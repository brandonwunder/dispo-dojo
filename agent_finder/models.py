"""Data models for Agent Contact Finder v2."""

from dataclasses import dataclass, field
from enum import Enum


class ContactStatus(str, Enum):
    FOUND = "found"
    PARTIAL = "partial"
    NOT_FOUND = "not_found"
    ERROR = "error"


@dataclass
class AgentRow:
    """One row from the uploaded CSV — an agent to find contact info for."""
    name: str
    brokerage: str
    address: str = ""
    city: str = ""
    state: str = ""
    zip_code: str = ""
    list_price: str = ""
    row_index: int = 0
    extra_columns: dict = field(default_factory=dict)


@dataclass
class ContactResult:
    """Search result for one agent."""
    agent: AgentRow
    phone: str = ""
    email: str = ""
    source: str = ""
    status: ContactStatus = ContactStatus.NOT_FOUND
    error_message: str = ""

    @property
    def has_contact(self) -> bool:
        return bool(self.phone or self.email)
