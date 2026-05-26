import json
from pathlib import Path

from sqlalchemy.orm import Session

from app.models import County


COUNTIES_SOURCE_URL = "https://raw.githubusercontent.com/ppatrzyk/polska-geojson/master/powiaty/powiaty-min.geojson"
COUNTIES_PATH = Path(__file__).resolve().parents[1] / "data" / "counties.json"


def seed_counties(db: Session) -> None:
    if db.query(County).first():
        return
    with COUNTIES_PATH.open(encoding="utf-8") as file:
        counties = json.load(file)
    db.add_all(
        County(
            external_id=item["external_id"],
            name=item["name"],
            source=COUNTIES_SOURCE_URL,
        )
        for item in counties
    )
    db.commit()
