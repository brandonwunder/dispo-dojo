"""Export pipeline results to CSV."""

import csv
import logging

from .models import ContactResult

logger = logging.getLogger("agent_finder.output")


def export_results_csv(results: list[ContactResult], output_path: str):
    """Export results to a single CSV file with original columns + contact info appended."""
    if not results:
        return

    extra_keys = []
    seen = set()
    for r in results:
        for k in r.agent.extra_columns:
            if k not in seen:
                extra_keys.append(k)
                seen.add(k)

    fieldnames = [
        "Name", "Brokerage", "Phone", "Email", "Status", "Source",
        "Street Address", "City", "State", "Zip Code", "List Price",
    ] + extra_keys

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        for r in results:
            row = {
                "Name": r.agent.name,
                "Brokerage": r.agent.brokerage,
                "Phone": r.phone,
                "Email": r.email,
                "Status": r.status.value,
                "Source": r.source,
                "Street Address": r.agent.address,
                "City": r.agent.city,
                "State": r.agent.state,
                "Zip Code": r.agent.zip_code,
                "List Price": r.agent.list_price,
            }
            for k in extra_keys:
                row[k] = r.agent.extra_columns.get(k, "")

            writer.writerow(row)

    logger.info("Exported %d results to %s", len(results), output_path)


def generate_summary(results: list[ContactResult]) -> dict:
    total = len(results)
    found = sum(1 for r in results if r.status.value == "found")
    not_found = sum(1 for r in results if r.status.value == "not_found")
    errors = sum(1 for r in results if r.status.value == "error")
    with_phone = sum(1 for r in results if r.phone)
    with_email = sum(1 for r in results if r.email)

    return {
        "total": total,
        "found": found,
        "not_found": not_found,
        "errors": errors,
        "with_phone": with_phone,
        "with_email": with_email,
        "hit_rate": round(found / total * 100) if total > 0 else 0,
    }
