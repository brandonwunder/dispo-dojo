"""Parse CSV/Excel uploads and extract agent rows."""

import csv
import logging
from pathlib import Path

from .models import AgentRow

logger = logging.getLogger("agent_finder.input")

NAME_COLUMNS = {"name", "agent", "agent_name", "agent name", "listing agent", "list agent"}
BROKER_COLUMNS = {"broker", "brokerage", "office", "broker name", "brokerage name", "listing office"}
ADDRESS_COLUMNS = {"street address", "address", "property address", "prop address", "street", "location"}
CITY_COLUMNS = {"city"}
STATE_COLUMNS = {"state", "st"}
ZIP_COLUMNS = {"postal code", "zip", "zip code", "zipcode", "postal"}
PRICE_COLUMNS = {"list price", "price", "listprice", "list_price"}


def _detect_column(headers: list[str], candidates: set[str]) -> str | None:
    """Find which header matches one of the candidate names."""
    lower_headers = {h.lower().strip(): h for h in headers}
    for candidate in candidates:
        if candidate in lower_headers:
            return lower_headers[candidate]
    for candidate in candidates:
        for lh, original in lower_headers.items():
            if candidate in lh:
                return original
    return None


def read_csv(file_path: str) -> list[AgentRow]:
    """Read a CSV file and return AgentRow list."""
    rows = []
    with open(file_path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames or []

        name_col = _detect_column(headers, NAME_COLUMNS)
        broker_col = _detect_column(headers, BROKER_COLUMNS)
        addr_col = _detect_column(headers, ADDRESS_COLUMNS)
        city_col = _detect_column(headers, CITY_COLUMNS)
        state_col = _detect_column(headers, STATE_COLUMNS)
        zip_col = _detect_column(headers, ZIP_COLUMNS)
        price_col = _detect_column(headers, PRICE_COLUMNS)

        if not name_col:
            raise ValueError(
                f"Could not find agent name column. Headers: {headers}. "
                f"Expected one of: {NAME_COLUMNS}"
            )

        known_cols = {name_col, broker_col, addr_col, city_col, state_col, zip_col, price_col}

        for i, row in enumerate(reader):
            name = (row.get(name_col) or "").strip()
            if not name:
                continue

            extra = {k: v for k, v in row.items() if k not in known_cols and k is not None}

            rows.append(AgentRow(
                name=name,
                brokerage=(row.get(broker_col) or "").strip() if broker_col else "",
                address=(row.get(addr_col) or "").strip() if addr_col else "",
                city=(row.get(city_col) or "").strip() if city_col else "",
                state=(row.get(state_col) or "").strip() if state_col else "",
                zip_code=(row.get(zip_col) or "").strip() if zip_col else "",
                list_price=(row.get(price_col) or "").strip() if price_col else "",
                row_index=i,
                extra_columns=extra,
            ))

    logger.info("Parsed %d agent rows from %s", len(rows), file_path)
    return rows


def read_excel(file_path: str) -> list[AgentRow]:
    """Read an Excel file and return AgentRow list."""
    import openpyxl
    wb = openpyxl.load_workbook(file_path, read_only=True, data_only=True)
    ws = wb.active

    rows_iter = ws.iter_rows(values_only=True)
    header_row = next(rows_iter, None)
    if not header_row:
        raise ValueError("Excel file is empty.")

    headers = [str(h).strip() if h else "" for h in header_row]

    import tempfile
    with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False, encoding="utf-8") as tmp:
        writer = csv.DictWriter(tmp, fieldnames=headers)
        writer.writeheader()
        for row in rows_iter:
            values = [str(v).strip() if v is not None else "" for v in row]
            writer.writerow(dict(zip(headers, values)))
        tmp_path = tmp.name

    wb.close()
    result = read_csv(tmp_path)
    Path(tmp_path).unlink(missing_ok=True)
    return result


def read_input(file_path: str) -> list[AgentRow]:
    """Read CSV or Excel file, auto-detecting format."""
    ext = Path(file_path).suffix.lower()
    if ext == ".csv":
        return read_csv(file_path)
    elif ext in (".xlsx", ".xls"):
        return read_excel(file_path)
    else:
        raise ValueError(f"Unsupported file type: {ext}")
