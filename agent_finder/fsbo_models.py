"""Data models for the FSBO Finder pipeline."""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class FSBOSearchCriteria:
    """Search parameters submitted by the user."""
    location: str                        # "85001" or "85001,85002" or "Phoenix, AZ"
    location_type: str                   # "zip" | "city_state"
    radius_miles: int = 25
    min_price: Optional[int] = None
    max_price: Optional[int] = None
    min_beds: Optional[int] = None
    min_baths: Optional[float] = None
    property_type: Optional[str] = None  # "single_family"|"condo"|"multi_family"|"land"|None
    max_days_on_market: Optional[int] = None


@dataclass
class FSBOListing:
    """A single FSBO listing result."""
    address: str
    city: str
    state: str
    zip_code: str
    price: Optional[int]
    beds: Optional[int]
    baths: Optional[float]
    sqft: Optional[int]
    property_type: Optional[str]
    days_on_market: Optional[int]
    owner_name: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    listing_url: str
    source: str          # "fsbo.com"|"forsalebyowner.com"|"zillow"|"realtor"|"craigslist"
    contact_status: str  # "complete"|"partial"|"phone_only"|"anonymous"|"none"
    scraped_at: datetime = field(default_factory=datetime.now)

    def compute_contact_status(self) -> str:
        """Derive contact_status from available fields."""
        has_name = bool(self.owner_name and self.owner_name.strip())
        has_phone = bool(self.phone and self.phone.strip())
        has_email = bool(self.email and self.email.strip())
        if has_name and has_phone and has_email:
            return "complete"
        if has_name and (has_phone or has_email):
            return "partial"
        if has_phone and not has_email:
            return "phone_only"
        return "none"

    def merge(self, other: "FSBOListing") -> "FSBOListing":
        """Merge another listing into this one, filling missing fields."""
        if not self.owner_name and other.owner_name:
            self.owner_name = other.owner_name
        if not self.phone and other.phone:
            self.phone = other.phone
        if not self.email and other.email:
            self.email = other.email
        if not self.price and other.price:
            self.price = other.price
        if not self.beds and other.beds:
            self.beds = other.beds
        if not self.baths and other.baths:
            self.baths = other.baths
        if not self.sqft and other.sqft:
            self.sqft = other.sqft
        if not self.days_on_market and other.days_on_market:
            self.days_on_market = other.days_on_market
        self.contact_status = self.compute_contact_status()
        return self
