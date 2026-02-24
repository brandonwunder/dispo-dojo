"""Output handler - exports results to CSV/Excel."""

import zipfile
from io import StringIO
from pathlib import Path

import pandas as pd

from .models import ScrapeResult


def export_results(
    results: list[ScrapeResult],
    output_path: str,
    fmt: str = "csv",
) -> str:
    """
    Export scrape results to CSV or Excel.

    Returns the path of the written file.
    """
    rows = []
    for r in results:
        row = {
            "original_address": r.property.raw_address,
            "normalized_address": r.property.normalized,
            "city": r.property.city,
            "state": r.property.state,
            "zip": r.property.zip_code,
            "agent_name": r.agent_info.agent_name if r.agent_info else "",
            "brokerage": r.agent_info.brokerage if r.agent_info else "",
            "agent_phone": r.agent_info.phone if r.agent_info else "",
            "agent_email": r.agent_info.email if r.agent_info else "",
            "data_source": r.agent_info.source if r.agent_info else "",
            "listing_url": r.agent_info.listing_url if r.agent_info else "",
            "list_date": r.agent_info.list_date if r.agent_info else "",
            "days_on_market": r.agent_info.days_on_market if r.agent_info else "",
            "listing_price": r.agent_info.listing_price if r.agent_info else "",
            "lookup_status": r.status.value,
            "confidence": f"{r.confidence:.2f}",
            "verified": "Yes" if r.verified else "No",
            "sources_matched": ", ".join(r.sources_matched),
            "sources_tried": ", ".join(r.sources_tried),
            "error": r.error_message,
        }
        rows.append(row)

    df = pd.DataFrame(rows)

    # Replace pandas NA/NaN with empty strings for clean output
    df = df.fillna("")
    df = df.replace({"<NA>": "", "<Na>": "", "nan": "", "None": ""})

    # Ensure output path has correct extension
    output = Path(output_path)
    if fmt == "excel" or fmt == "xlsx":
        if output.suffix.lower() not in (".xlsx", ".xls"):
            output = output.with_suffix(".xlsx")
        df.to_excel(str(output), index=False, engine="openpyxl")
    else:
        if output.suffix.lower() != ".csv":
            output = output.with_suffix(".csv")
        df.to_csv(str(output), index=False)

    return str(output)


def export_results_zip(
    results: list[ScrapeResult],
    original_file_path: str,
    output_zip_path: str,
) -> str:
    """
    Export results as a ZIP containing 3 CSVs, preserving all original columns.

    The original spreadsheet columns are kept intact, with new agent info
    columns appended at the end. Results are split into:
      - found_agents.csv   (status: found or cached)
      - partial_agents.csv  (status: partial)
      - not_found.csv       (status: not_found or error)

    Returns the path of the written ZIP file.
    """
    from .input_handler import read_raw_dataframe

    # Read the original uploaded file
    original_df = read_raw_dataframe(original_file_path)

    # Build a mapping from row_index → agent result columns
    agent_rows = {}
    for r in results:
        idx = r.property.row_index
        agent_rows[idx] = {
            "agent_name": r.agent_info.agent_name if r.agent_info else "",
            "brokerage": r.agent_info.brokerage if r.agent_info else "",
            "agent_phone": r.agent_info.phone if r.agent_info else "",
            "agent_email": r.agent_info.email if r.agent_info else "",
            "data_source": r.agent_info.source if r.agent_info else "",
            "listing_url": r.agent_info.listing_url if r.agent_info else "",
            "list_date": r.agent_info.list_date if r.agent_info else "",
            "days_on_market": r.agent_info.days_on_market if r.agent_info else "",
            "listing_price": r.agent_info.listing_price if r.agent_info else "",
            "lookup_status": r.status.value,
            "confidence": f"{r.confidence:.2f}",
            "verified": "Yes" if r.verified else "No",
            "sources_matched": ", ".join(r.sources_matched),
        }

    # Build agent columns DataFrame aligned to original index
    agent_df = pd.DataFrame.from_dict(agent_rows, orient="index")
    agent_df.index.name = original_df.index.name

    # Merge: original columns + new agent columns
    merged = original_df.join(agent_df, how="left")

    # Clean up NaN/NA values
    merged = merged.fillna("")
    merged = merged.replace({"<NA>": "", "<Na>": "", "nan": "", "None": ""})

    # Fill any rows that weren't processed (shouldn't happen, but safe)
    for col in ["agent_name", "brokerage", "agent_phone", "agent_email",
                 "data_source", "listing_url", "list_date", "days_on_market",
                 "listing_price", "lookup_status", "confidence", "verified", "sources_matched"]:
        if col not in merged.columns:
            merged[col] = ""

    # Split into 3 DataFrames by status
    found_mask = merged["lookup_status"].isin(["found", "cached"])
    partial_mask = merged["lookup_status"] == "partial"
    not_found_mask = merged["lookup_status"].isin(["not_found", "error", ""])

    found_df = merged[found_mask]
    partial_df = merged[partial_mask]
    not_found_df = merged[not_found_mask]

    # Write ZIP with 3 CSVs
    output = Path(output_zip_path)
    if output.suffix.lower() != ".zip":
        output = output.with_suffix(".zip")

    with zipfile.ZipFile(str(output), "w", zipfile.ZIP_DEFLATED) as zf:
        for name, df in [
            ("found_agents.csv", found_df),
            ("partial_agents.csv", partial_df),
            ("not_found.csv", not_found_df),
        ]:
            buf = StringIO()
            df.to_csv(buf, index=False)
            zf.writestr(name, buf.getvalue())

    return str(output)


def generate_summary(results: list[ScrapeResult]) -> dict:
    """Generate a summary dict of the results."""
    total = len(results)
    found = sum(1 for r in results if r.status.value == "found")
    partial = sum(1 for r in results if r.status.value == "partial")
    cached = sum(1 for r in results if r.status.value == "cached")
    not_found = sum(1 for r in results if r.status.value == "not_found")
    errors = sum(1 for r in results if r.status.value == "error")

    # Source breakdown
    sources = {}
    for r in results:
        if r.agent_info and r.agent_info.source:
            src = r.agent_info.source.split("+")[0]  # strip enrichment suffix
            sources[src] = sources.get(src, 0) + 1

    return {
        "total": total,
        "found": found,
        "partial": partial,
        "cached": cached,
        "not_found": not_found,
        "errors": errors,
        "success_rate": f"{((found + partial + cached) / total * 100):.1f}%" if total > 0 else "0%",
        "sources": sources,
    }
