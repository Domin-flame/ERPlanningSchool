"""RecommendationService schemas."""
from typing import Optional, List
from pydantic import BaseModel


class RecommendationOut(BaseModel):
    id: str
    name: str
    country: str = ""
    city: str = ""
    description: str = ""
    tags: List[str] = []
    avg_cost_per_day: float = 0
    image: str = "g1.jpg"
    rating: float = 4.0
    match_score: float = 0
    occasion: Optional[str] = None


class ConsumerStatus(BaseModel):
    connected: bool
    user_cache_size: int
    destinations_cached: int
