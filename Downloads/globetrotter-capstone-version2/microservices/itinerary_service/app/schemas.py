"""ItineraryService Pydantic v2 schemas."""
from typing import Optional, List
from pydantic import BaseModel, Field


class ItineraryIn(BaseModel):
    title: str = Field(min_length=1)
    destinations: List[str] = Field(default_factory=list)
    start_date: Optional[str] = ""
    end_date: Optional[str] = ""
    notes: Optional[str] = ""


class ItineraryOut(BaseModel):
    id: str
    username: str
    title: str
    destinations: List[str] = []
    start_date: str = ""
    end_date: str = ""
    notes: str = ""
    share_link: Optional[str] = None
    created_at: str = ""
    updated_at: str = ""


class BookingIn(BaseModel):
    destination_name: str
    itinerary_id: Optional[str] = ""
    booking_date: Optional[str] = ""
    details: Optional[str] = ""


class ReviewIn(BaseModel):
    destination_name: str
    rating: float = Field(ge=1, le=5)
    comment: str = ""


class ReviewUpdate(BaseModel):
    rating: Optional[float] = Field(default=None, ge=1, le=5)
    comment: Optional[str] = None


class ProposalIn(BaseModel):
    name: str
    country: str
    continent: str
    description: str
    tags: List[str] = Field(default_factory=list)
    avg_cost_per_day: float = 0
    image: str = "placeholder.jpg"
    city: str = ""


class AdminComment(BaseModel):
    comment: str = ""


class DestinationOut(BaseModel):
    id: str
    name: str
    country: str = ""
    continent: str = ""
    city: str = ""
    description: str = ""
    tags: List[str] = []
    avg_cost_per_day: float = 0
    image: str = "g1.jpg"
    rating: float = 4.0
    category: str = ""


class Message(BaseModel):
    message: str
