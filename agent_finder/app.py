"""FastAPI web app for Agent Finder - drag-and-drop CSV processing."""

import asyncio
import json
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, APIRouter, File, UploadFile, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from starlette.responses import StreamingResponse

from .cache import ScrapeCache
from .input_handler import read_input, validate_input
from .output_handler import export_results, export_results_zip, generate_summary
from .pipeline import AgentFinderPipeline

app = FastAPI(title="Agent Finder")
api = APIRouter(prefix="/api")

# Serve static files (logo, etc.)
STATIC_DIR = Path(__file__).parent / "static"
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# In-memory job store
jobs: dict[str, dict] = {}
# Track asyncio tasks so we can cancel them
_tasks: dict[str, asyncio.Task] = {}

TEMPLATES_DIR = Path(__file__).parent / "templates"
UPLOAD_DIR = Path(__file__).parent / "data"
UPLOAD_DIR.mkdir(exist_ok=True)
JOBS_FILE = UPLOAD_DIR / "jobs.json"


# ── Job persistence ──

def _save_jobs():
    """Persist job metadata to disk (excludes transient fields like progress)."""
    saveable = {}
    for jid, job in jobs.items():
        saveable[jid] = {
            "status": job["status"],
            "upload_path": job["upload_path"],
            "result_path": job["result_path"],
            "total": job["total"],
            "error": job["error"],
            "summary": job["summary"],
            "filename": job.get("filename", ""),
            "created_at": job.get("created_at", ""),
        }
    JOBS_FILE.write_text(json.dumps(saveable, indent=2), encoding="utf-8")


def _load_jobs():
    """Load saved jobs from disk on startup."""
    global jobs
    if not JOBS_FILE.exists():
        return
    try:
        saved = json.loads(JOBS_FILE.read_text(encoding="utf-8"))
        for jid, data in saved.items():
            restored = {**data, "progress": [], "preview_rows": None}
            if data.get("status") in ("running", "queued"):
                # Job was interrupted by a server restart — show in history as interrupted
                restored["status"] = "interrupted"
                restored["error"] = (
                    "This job was interrupted because the server restarted. "
                    "Re-upload the file to run again."
                )
            jobs[jid] = restored
    except (json.JSONDecodeError, KeyError):
        pass


@app.on_event("startup")
async def startup():
    _load_jobs()


@api.get("/legacy-agent-finder", response_class=HTMLResponse)
async def legacy_agent_finder():
    """Serve the legacy Agent Finder page (used inside iframe)."""
    html_path = TEMPLATES_DIR / "index.html"
    return HTMLResponse(content=html_path.read_text(encoding="utf-8"))


@api.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload a CSV/Excel file and start processing."""
    # Validate file extension
    ext = Path(file.filename).suffix.lower()
    if ext not in (".csv", ".xlsx", ".xls"):
        raise HTTPException(400, "Only .csv, .xlsx, or .xls files are supported.")

    # Save uploaded file
    job_id = str(uuid.uuid4())[:8]
    upload_path = UPLOAD_DIR / f"{job_id}{ext}"

    content = await file.read()
    with open(upload_path, "wb") as f:
        f.write(content)

    # Validate input
    try:
        properties = read_input(str(upload_path))
    except (ValueError, FileNotFoundError) as e:
        upload_path.unlink(missing_ok=True)
        raise HTTPException(400, str(e))

    if not properties:
        upload_path.unlink(missing_ok=True)
        raise HTTPException(400, "No valid addresses found in file.")

    # Initialize job
    jobs[job_id] = {
        "status": "queued",
        "upload_path": str(upload_path),
        "result_path": None,
        "total": len(properties),
        "progress": [],
        "error": None,
        "summary": None,
        "preview_rows": None,
        "filename": file.filename,
        "created_at": datetime.now().isoformat(),
    }

    _save_jobs()  # persist queued state so restart sees it

    # Start processing in background and store the task reference
    task = asyncio.create_task(_run_pipeline(job_id, properties))
    _tasks[job_id] = task

    return {"job_id": job_id, "total": len(properties)}


@api.get("/progress/{job_id}")
async def progress_stream(job_id: str):
    """Server-Sent Events stream for job progress."""
    if job_id not in jobs:
        raise HTTPException(404, "Job not found.")

    async def event_generator():
        last_idx = 0
        while True:
            job = jobs.get(job_id)
            if not job:
                break

            # Send any new progress events
            progress_list = job["progress"]
            while last_idx < len(progress_list):
                data = json.dumps(progress_list[last_idx])
                yield f"data: {data}\n\n"
                last_idx += 1

            # Check if job is done
            if job["status"] == "complete":
                done_data = json.dumps({
                    "type": "complete",
                    "summary": job["summary"],
                    "preview_rows": job["preview_rows"],
                })
                yield f"data: {done_data}\n\n"
                break
            elif job["status"] == "error":
                err_data = json.dumps({
                    "type": "error",
                    "message": job["error"],
                })
                yield f"data: {err_data}\n\n"
                break
            elif job["status"] == "cancelled":
                cancel_data = json.dumps({
                    "type": "cancelled",
                    "message": "Job was cancelled.",
                })
                yield f"data: {cancel_data}\n\n"
                break

            await asyncio.sleep(0.3)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@api.get("/download/{job_id}")
async def download_result(job_id: str):
    """Download the result ZIP file."""
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found.")
    if job["status"] != "complete" or not job["result_path"]:
        raise HTTPException(400, "Results not ready yet.")

    result_path = Path(job["result_path"])
    if not result_path.exists():
        raise HTTPException(404, "Result file not found.")

    return FileResponse(
        str(result_path),
        filename="agent_finder_results.zip",
        media_type="application/zip",
    )


# ── History & management endpoints ──

@api.get("/jobs")
async def list_jobs():
    """Return all jobs (active + past) for the UI."""
    history = []
    for jid, job in jobs.items():
        # For running jobs, grab the latest progress stats
        last_progress = None
        if job["progress"]:
            last_progress = job["progress"][-1]

        history.append({
            "job_id": jid,
            "filename": job.get("filename", "unknown"),
            "created_at": job.get("created_at", ""),
            "status": job["status"],
            "total": job["total"],
            "summary": job.get("summary"),
            "last_progress": last_progress,
        })
    # Sort by created_at descending (newest first)
    history.sort(key=lambda x: x["created_at"], reverse=True)
    return history


@api.get("/cache/stats")
async def cache_stats():
    """Return universal cache statistics."""
    cache = ScrapeCache(db_path=str(UPLOAD_DIR / "web_cache.db"))
    return await cache.stats()


@api.get("/jobs/{job_id}/results")
async def get_job_results(job_id: str):
    """Return full results for a completed job as JSON (used for inline preview and export)."""
    import zipfile
    import csv
    import io as _io
    job = jobs.get(job_id)
    if not job or job["status"] != "complete":
        raise HTTPException(404, "Job not found or not complete")
    result_path = job.get("result_path")
    if not result_path or not Path(result_path).exists():
        raise HTTPException(404, "Result file not found")
    rows = []
    with zipfile.ZipFile(result_path) as zf:
        csv_name = next((n for n in zf.namelist() if n.endswith(".csv")), None)
        if csv_name:
            with zf.open(csv_name) as f:
                reader = csv.DictReader(_io.TextIOWrapper(f, encoding="utf-8"))
                rows = list(reader)
    return {"results": rows}


@api.post("/jobs/{job_id}/cancel")
async def cancel_job(job_id: str):
    """Cancel a running job."""
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found.")
    if job["status"] not in ("queued", "running"):
        raise HTTPException(400, "Job is not running.")

    # Cancel the asyncio task
    task = _tasks.get(job_id)
    if task and not task.done():
        task.cancel()

    job["status"] = "cancelled"
    job["error"] = "Cancelled by user."
    _save_jobs()

    return {"ok": True}


@api.post("/jobs/{job_id}/resume")
async def resume_job(job_id: str):
    """Resume a cancelled or errored job by re-processing with cache."""
    old_job = jobs.get(job_id)
    if not old_job:
        raise HTTPException(404, "Job not found.")
    if old_job["status"] not in ("cancelled", "error", "interrupted"):
        raise HTTPException(400, "Only cancelled, errored, or interrupted jobs can be resumed.")

    # Verify upload file still exists
    upload_path = Path(old_job.get("upload_path", ""))
    if not upload_path.exists():
        raise HTTPException(400, "Original upload file no longer exists.")

    # Re-parse the original file
    try:
        properties = read_input(str(upload_path))
    except (ValueError, FileNotFoundError) as e:
        raise HTTPException(400, f"Could not read original file: {e}")

    if not properties:
        raise HTTPException(400, "No valid addresses found in original file.")

    # Create a new job that reuses the same upload file
    new_job_id = str(uuid.uuid4())[:8]
    jobs[new_job_id] = {
        "status": "queued",
        "upload_path": str(upload_path),
        "result_path": None,
        "total": len(properties),
        "progress": [],
        "error": None,
        "summary": None,
        "preview_rows": None,
        "filename": old_job.get("filename", "resumed"),
        "created_at": datetime.now().isoformat(),
    }

    # Start pipeline — cache will automatically skip already-found addresses
    task = asyncio.create_task(_run_pipeline(new_job_id, properties))
    _tasks[new_job_id] = task

    return {"job_id": new_job_id, "total": len(properties)}


@api.delete("/jobs/{job_id}")
async def delete_job(job_id: str):
    """Delete a past job and its associated files."""
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found.")

    # If it's still running, cancel it first
    task = _tasks.get(job_id)
    if task and not task.done():
        task.cancel()

    # Delete uploaded file
    upload_raw = job.get("upload_path", "")
    if upload_raw:
        upload_path = Path(upload_raw)
        if upload_path.is_file():
            upload_path.unlink(missing_ok=True)

    # Delete result file
    result_raw = job.get("result_path") or ""
    if result_raw:
        result_path = Path(result_raw)
        if result_path.is_file():
            result_path.unlink(missing_ok=True)

    # Remove from memory and save
    del jobs[job_id]
    _tasks.pop(job_id, None)
    _save_jobs()

    return {"ok": True}


async def _run_pipeline(job_id: str, properties):
    """Background task to run the scraping pipeline."""
    job = jobs[job_id]
    job["status"] = "running"
    _save_jobs()  # persist running state so restart marks it interrupted

    def on_progress(data: dict):
        data["type"] = "progress"
        job["progress"].append(data)

    try:
        pipeline = AgentFinderPipeline(
            progress_callback=on_progress,
            cache_path=str(UPLOAD_DIR / "web_cache.db"),
        )

        results = await pipeline.run(properties)

        # Export results as ZIP (3 CSVs: found, partial, not_found)
        result_path = str(UPLOAD_DIR / f"{job_id}_results.zip")
        export_results_zip(results, job["upload_path"], result_path)

        # Build preview rows (first 20)
        def _clean(val):
            """Ensure value is JSON-safe string."""
            if val is None:
                return ""
            s = str(val)
            if s.lower() in ("nan", "none", "<na>", "na"):
                return ""
            return s

        preview = []
        for r in results[:20]:
            preview.append({
                "address": _clean(r.property.raw_address),
                "agent_name": _clean(r.agent_info.agent_name) if r.agent_info else "",
                "brokerage": _clean(r.agent_info.brokerage) if r.agent_info else "",
                "phone": _clean(r.agent_info.phone) if r.agent_info else "",
                "email": _clean(r.agent_info.email) if r.agent_info else "",
                "status": r.status.value,
                "source": _clean(r.agent_info.source) if r.agent_info else "",
                "list_date": _clean(r.agent_info.list_date) if r.agent_info else "",
                "days_on_market": _clean(r.agent_info.days_on_market) if r.agent_info else "",
                "listing_price": _clean(r.agent_info.listing_price) if r.agent_info else "",
                "confidence": f"{r.confidence:.0%}",
                "verified": r.verified,
            })

        summary = generate_summary(results)

        job["status"] = "complete"
        job["result_path"] = result_path
        job["summary"] = summary
        job["preview_rows"] = preview

        _save_jobs()

    except asyncio.CancelledError:
        # Job was cancelled by user — status already set by cancel endpoint
        if job["status"] != "cancelled":
            job["status"] = "cancelled"
            job["error"] = "Cancelled by user."
            _save_jobs()

    except Exception as e:
        import traceback
        traceback.print_exc()
        job["status"] = "error"
        job["error"] = str(e)
        _save_jobs()

    finally:
        _tasks.pop(job_id, None)



# ── Register API router ──
app.include_router(api)

# ── Serve React frontend ──

FRONTEND_DIR = Path(__file__).parent.parent / "frontend" / "dist"

if FRONTEND_DIR.exists():
    # Serve built React static assets (JS, CSS, images)
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIR / "assets")), name="frontend-assets")

    # SPA catch-all: serve real files from dist if they exist, otherwise serve index.html
    @app.get("/{full_path:path}")
    async def serve_react(full_path: str):
        """Serve static files from dist, or index.html for SPA routes."""
        candidate = FRONTEND_DIR / full_path
        if candidate.is_file():
            return FileResponse(str(candidate))
        index_path = FRONTEND_DIR / "index.html"
        if index_path.exists():
            return HTMLResponse(content=index_path.read_text(encoding="utf-8"))
        raise HTTPException(404, "Frontend not built. Run: cd frontend && npm run build")


def main():
    """Run the web server."""
    import uvicorn
    port = 9000
    print(f"\n  Dispo Dojo Platform")
    print(f"  Open http://localhost:{port} in your browser\n")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")


if __name__ == "__main__":
    main()
