"""Input handler - reads CSV/Excel files and normalizes addresses."""

import os
from pathlib import Path
from typing import Optional

import pandas as pd

from .models import Property

# Common column name variations for address fields
ADDRESS_COLUMNS = {
    "address": ["address", "street_address", "street", "addr", "property_address",
                 "address_line", "address_line_1", "address1", "property address",
                 "street address"],
    "city": ["city", "town", "municipality"],
    "state": ["state", "st", "state_code", "province"],
    "zip": ["zip", "zipcode", "zip_code", "postal_code", "postal"],
}


def _find_column(df: pd.DataFrame, candidates: list[str]) -> Optional[str]:
    """Find a matching column name from a list of candidates (case-insensitive)."""
    df_cols_lower = {c.lower().strip(): c for c in df.columns}
    for candidate in candidates:
        if candidate.lower() in df_cols_lower:
            return df_cols_lower[candidate.lower()]
    return None


def _detect_format(file_path: str) -> str:
    """Detect file format from extension."""
    ext = Path(file_path).suffix.lower()
    if ext == ".csv":
        return "csv"
    elif ext in (".xlsx", ".xls"):
        return "excel"
    else:
        raise ValueError(f"Unsupported file format: {ext}. Use .csv, .xlsx, or .xls")


def _normalize_address_components(row: pd.Series, addr_col: str,
                                   city_col: Optional[str],
                                   state_col: Optional[str],
                                   zip_col: Optional[str]) -> Property:
    """Build a Property from a DataFrame row, normalizing address components."""
    raw = str(row.get(addr_col, "")).strip()

    # If we have separate columns, use them
    city = str(row.get(city_col, "")).strip() if city_col else ""
    state = str(row.get(state_col, "")).strip() if state_col else ""
    zip_code = str(row.get(zip_col, "")).strip() if zip_col else ""

    # Clean up "nan" strings from pandas
    if city.lower() == "nan":
        city = ""
    if state.lower() == "nan":
        state = ""
    if zip_code.lower() == "nan":
        zip_code = ""

    # Try to parse address components from raw if separate columns are missing
    address_line = raw
    if not city and not state:
        # Attempt basic comma-split parsing: "123 Main St, Springfield, IL 62704"
        parts = [p.strip() for p in raw.split(",")]
        if len(parts) >= 3:
            address_line = parts[0]
            city = parts[1]
            # Last part might be "IL 62704" or "IL"
            state_zip = parts[2].strip().split()
            if state_zip:
                state = state_zip[0]
            if len(state_zip) > 1:
                zip_code = state_zip[1]
        elif len(parts) == 2:
            address_line = parts[0]
            state_zip = parts[1].strip().split()
            if state_zip:
                city_or_state = state_zip[0]
                if len(city_or_state) == 2:
                    state = city_or_state
                else:
                    city = city_or_state
            if len(state_zip) > 1:
                last = state_zip[-1]
                if last.isdigit() and len(last) == 5:
                    zip_code = last
                elif len(last) == 2:
                    state = last

    return Property(
        raw_address=raw,
        address_line=address_line.upper().strip(),
        city=city.upper().strip(),
        state=state.upper().strip(),
        zip_code=zip_code.strip(),
    )


def read_input(file_path: str) -> list[Property]:
    """
    Read a CSV or Excel file and return a list of Property objects.

    Automatically detects address-related columns by name.
    Supports both single-column (full address) and multi-column formats.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Input file not found: {file_path}")

    fmt = _detect_format(file_path)

    if fmt == "csv":
        df = pd.read_csv(file_path, dtype=str)
    else:
        df = pd.read_excel(file_path, dtype=str)

    if df.empty:
        raise ValueError("Input file is empty")

    # Find address columns
    addr_col = _find_column(df, ADDRESS_COLUMNS["address"])
    city_col = _find_column(df, ADDRESS_COLUMNS["city"])
    state_col = _find_column(df, ADDRESS_COLUMNS["state"])
    zip_col = _find_column(df, ADDRESS_COLUMNS["zip"])

    if not addr_col:
        # If no address column found, try using the first column
        addr_col = df.columns[0]

    properties = []
    for idx, row in df.iterrows():
        prop = _normalize_address_components(row, addr_col, city_col, state_col, zip_col)
        prop.row_index = idx
        if prop.raw_address and prop.raw_address.lower() != "nan":
            properties.append(prop)

    return properties


def read_raw_dataframe(file_path: str) -> pd.DataFrame:
    """Read the original file as a DataFrame, preserving all columns exactly."""
    fmt = _detect_format(file_path)
    if fmt == "csv":
        return pd.read_csv(file_path, dtype=str)
    else:
        return pd.read_excel(file_path, dtype=str)


def validate_input(file_path: str) -> dict:
    """Validate an input file and return a summary without processing."""
    properties = read_input(file_path)
    has_city = sum(1 for p in properties if p.city)
    has_state = sum(1 for p in properties if p.state)
    has_zip = sum(1 for p in properties if p.zip_code)

    return {
        "total_rows": len(properties),
        "with_city": has_city,
        "with_state": has_state,
        "with_zip": has_zip,
        "sample": [p.search_query for p in properties[:5]],
    }
