"""
Destination catalogue ORM model (destinations_db).

Owns the "destinations" data domain.
"""
import uuid

from sqlalchemy import Column, String, Float, Text, JSON

from app.database import Base


class Destination(Base):
    __tablename__ = "destinations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, index=True, nullable=False)
    name_en = Column(String, default="")
    name_fr = Column(String, default="")
    original_name = Column(String, default="")
    country = Column(String, default="Cameroun")
    continent = Column(String, default="Afrique")
    city = Column(String, default="")
    description = Column(Text, default="")
    description_en = Column(Text, default="")
    description_fr = Column(Text, default="")
    tags = Column(JSON, default=list)
    avg_cost_per_day = Column(Float, default=0)
    image = Column(String, default="g1.jpg")
    rating = Column(Float, default=4.0)
    reviews_count = Column(Float, default=0)
    category = Column(String, default="")
    location = Column(JSON, default=dict)
    opening_hours = Column(String, default="")
    phone = Column(String, default="")
    website = Column(String, default="")
