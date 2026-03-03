"""FastAPI web app for Agent Contact Finder v3."""

import asyncio
import json
import logging
import uuid
from datetime import datetime
from pathlib import Path

import os

logger = logging.getLogger("agent_finder.app")

from fastapi import FastAPI, APIRouter, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from starlette.responses import StreamingResponse

from .input_handler import read_input
from .output_handler import export_results_csv, generate_summary
from .pipeline import run_pipeline

app = FastAPI(title="Agent Contact Finder v3")

_default_origins = "http://localhost:3000,http://localhost:5173,https://dispo-dojo.vercel.app,https://dispo-dojo-ionw3ihqj-airsyncs-projects.vercel.app"
_origins = os.environ.get("ALLOWED_ORIGINS", _default_origins).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api = APIRouter(prefix="/api")

jobs: dict[str, dict] = {}
_tasks: dict[str, asyncio.Task] = {}

DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)
JOBS_FILE = DATA_DIR / "jobs.json"


def _save_jobs():
    saveable = {}
    for jid, job in jobs.items():
        saveable[jid] = {
            "status": job["status"],
            "upload_path": job["upload_path"],
            "result_path": job.get("result_path"),
            "total": job["total"],
            "error": job.get("error"),
            "summary": job.get("summary"),
            "filename": job.get("filename", ""),
            "created_at": job.get("created_at", ""),
        }
    JOBS_FILE.write_text(json.dumps(saveable, indent=2), encoding="utf-8")


def _load_jobs():
    global jobs
    if not JOBS_FILE.exists():
        return
    try:
        saved = json.loads(JOBS_FILE.read_text(encoding="utf-8"))
        for jid, data in saved.items():
            restored = {**data, "progress": [], "preview_rows": None}
            if data.get("status") == "running":
                restored["status"] = "error"
                restored["error"] = "Server restarted while this job was running."
            jobs[jid] = restored
    except (json.JSONDecodeError, KeyError):
        pass


@app.on_event("startup")
async def startup():
    _load_jobs()


@api.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    ext = Path(file.filename).suffix.lower()
    if ext not in (".csv", ".xlsx", ".xls"):
        raise HTTPException(400, "Only .csv, .xlsx, or .xls files are supported.")

    job_id = str(uuid.uuid4())[:8]
    upload_path = DATA_DIR / f"{job_id}{ext}"

    content = await file.read()
    with open(upload_path, "wb") as f:
        f.write(content)

    try:
        agents = read_input(str(upload_path))
    except (ValueError, FileNotFoundError) as e:
        upload_path.unlink(missing_ok=True)
        raise HTTPException(400, str(e))

    if not agents:
        upload_path.unlink(missing_ok=True)
        raise HTTPException(400, "No valid agent rows found in file.")

    jobs[job_id] = {
        "status": "running",
        "upload_path": str(upload_path),
        "result_path": None,
        "total": len(agents),
        "progress": [],
        "error": None,
        "summary": None,
        "preview_rows": None,
        "filename": file.filename,
        "created_at": datetime.now().isoformat(),
    }
    _save_jobs()

    task = asyncio.create_task(_run_job(job_id, agents))
    _tasks[job_id] = task

    return {"job_id": job_id, "total": len(agents)}


@api.get("/progress/{job_id}")
async def progress_stream(job_id: str):
    if job_id not in jobs:
        raise HTTPException(404, "Job not found.")

    async def event_generator():
        last_idx = 0
        heartbeat_count = 0
        poll_interval = 0.3
        heartbeat_every = int(5 / poll_interval)

        while True:
            job = jobs.get(job_id)
            if not job:
                break

            progress_list = job["progress"]
            while last_idx < len(progress_list):
                yield f"data: {json.dumps(progress_list[last_idx])}\n\n"
                last_idx += 1
                heartbeat_count = 0

            if job["status"] == "complete":
                yield f"data: {json.dumps({'type': 'complete', 'summary': job['summary'], 'preview_rows': job['preview_rows']})}\n\n"
                break
            elif job["status"] == "error":
                yield f"data: {json.dumps({'type': 'error', 'message': job['error']})}\n\n"
                break
            elif job["status"] == "cancelled":
                yield f"data: {json.dumps({'type': 'cancelled'})}\n\n"
                break

            heartbeat_count += 1
            if heartbeat_count >= heartbeat_every:
                yield f"data: {json.dumps({'type': 'heartbeat'})}\n\n"
                heartbeat_count = 0

            await asyncio.sleep(poll_interval)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )


@api.get("/download/{job_id}")
async def download_result(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found.")
    if job["status"] != "complete" or not job.get("result_path"):
        raise HTTPException(400, "Results not ready yet.")

    result_path = Path(job["result_path"])
    if not result_path.exists():
        raise HTTPException(404, "Result file not found.")

    return FileResponse(
        str(result_path),
        filename=f"agent_contacts_{job_id}.csv",
        media_type="text/csv",
    )


@api.get("/jobs")
async def list_jobs():
    history = []
    for jid, job in jobs.items():
        last_progress = job["progress"][-1] if job["progress"] else None
        history.append({
            "job_id": jid,
            "filename": job.get("filename", "unknown"),
            "created_at": job.get("created_at", ""),
            "status": job["status"],
            "total": job["total"],
            "summary": job.get("summary"),
            "last_progress": last_progress,
        })
    history.sort(key=lambda x: x["created_at"], reverse=True)
    return history


@api.delete("/jobs/{job_id}")
async def delete_job(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found.")

    task = _tasks.get(job_id)
    if task and not task.done():
        task.cancel()

    for path_key in ("upload_path", "result_path"):
        raw = job.get(path_key) or ""
        if raw:
            p = Path(raw)
            if p.is_file():
                p.unlink(missing_ok=True)

    del jobs[job_id]
    _tasks.pop(job_id, None)
    _save_jobs()
    return {"ok": True}


@api.post("/jobs/{job_id}/cancel")
async def cancel_job(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found.")
    if job["status"] != "running":
        raise HTTPException(400, "Job is not running.")

    task = _tasks.get(job_id)
    if task and not task.done():
        task.cancel()

    job["status"] = "cancelled"
    _save_jobs()
    return {"ok": True}


# ── Comps endpoint (used by Underwriting page — keep from old code) ──

@api.get("/comps")
async def get_comps(address: str):
    """Pull sold comps near a given address using HomeHarvest."""
    try:
        from homeharvest import scrape_property
    except ImportError:
        raise HTTPException(status_code=500, detail="HomeHarvest not installed")

    import re as _re
    zip_match = _re.search(r'\b(\d{5})\b', address)
    location = zip_match.group(1) if zip_match else address

    comps = []
    for months in [3, 6, 9, 12]:
        try:
            loop = asyncio.get_event_loop()

            def _scrape(months_=months):
                from datetime import date, timedelta
                end = date.today()
                start = end - timedelta(days=months_ * 30)
                df = scrape_property(
                    location=location,
                    listing_type="sold",
                    date_from=start.strftime("%Y-%m-%d"),
                    date_to=end.strftime("%Y-%m-%d"),
                    limit=10,
                )
                return df

            df = await loop.run_in_executor(None, _scrape)

            if df is None or len(df) == 0:
                continue

            results = []
            for _, row in df.iterrows():
                list_price = float(row.get('list_price') or row.get('price') or 0)
                sold_price = float(row.get('sold_price') or row.get('close_price') or list_price)
                dom = int(row.get('days_on_market') or row.get('dom') or 0)
                addr = str(row.get('full_street_line') or row.get('street') or '')
                city = str(row.get('city') or '')
                if list_price <= 0:
                    continue
                pct_under = round((list_price - sold_price) / list_price * 100, 1) if list_price > 0 else 0
                results.append({
                    'address': f"{addr}, {city}".strip(', '),
                    'listPrice': list_price,
                    'soldPrice': sold_price,
                    'pctUnderList': pct_under,
                    'dom': dom,
                })

            if len(results) >= 3:
                comps = results[:5]
                break
            if len(results) > 0:
                comps = results
        except Exception as e:
            logging.getLogger("agent_finder.comps").warning("Comp scrape failed (%d mo): %s", months, e)
            continue

    if not comps:
        return {"comps": [], "avgPctUnderList": 0, "avgDom": 0, "note": "No comps found"}

    avg_pct = round(sum(c['pctUnderList'] for c in comps) / len(comps), 1)
    avg_dom = round(sum(c['dom'] for c in comps) / len(comps))
    return {"comps": comps, "avgPctUnderList": avg_pct, "avgDom": avg_dom}


# ── Background job runner ──

async def _run_job(job_id: str, agents):
    job = jobs[job_id]

    def on_progress(data: dict):
        data["type"] = "progress"
        job["progress"].append(data)

    try:
        results = await run_pipeline(agents, progress_callback=on_progress)

        result_path = str(DATA_DIR / f"{job_id}_results.csv")
        export_results_csv(results, result_path)

        preview = []
        for r in results[:30]:
            preview.append({
                "name": r.agent.name,
                "brokerage": r.agent.brokerage,
                "address": r.agent.address,
                "phone": r.phone,
                "email": r.email,
                "status": r.status.value,
                "source": r.source,
            })

        summary = generate_summary(results)

        job["status"] = "complete"
        job["result_path"] = result_path
        job["summary"] = summary
        job["preview_rows"] = preview
        _save_jobs()

    except asyncio.CancelledError:
        if job["status"] != "cancelled":
            job["status"] = "cancelled"
            _save_jobs()

    except Exception as e:
        import traceback
        traceback.print_exc()
        job["status"] = "error"
        job["error"] = str(e)
        _save_jobs()

    finally:
        _tasks.pop(job_id, None)


# ── Register router + serve frontend ──

app.include_router(api)

FRONTEND_DIR = Path(__file__).parent.parent / "frontend" / "dist"
if FRONTEND_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIR / "assets")), name="frontend-assets")

    @app.get("/{full_path:path}")
    async def serve_react(full_path: str):
        candidate = FRONTEND_DIR / full_path
        if candidate.is_file():
            return FileResponse(str(candidate))
        index_path = FRONTEND_DIR / "index.html"
        if index_path.exists():
            return HTMLResponse(content=index_path.read_text(encoding="utf-8"))
        raise HTTPException(404, "Frontend not built.")


def main():
    import uvicorn
    port = int(os.environ.get("PORT", 9000))
    print(f"\n  Agent Contact Finder v3")
    print(f"  Open http://localhost:{port}\n")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
