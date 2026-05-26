import re
from datetime import date

REQUIRED_PARTICIPANT_FIELDS = [
    "first_name",
    "last_name",
    "pesel",
    "birth_date",
    "phone",
    "voivodeship",
    "county",
    "commune",
    "city",
    "postal_code",
    "address",
    "pup_zus_status",
    "exclusion",
    "disability_status",
    "health_status",
    "life_situation",
    "age",
    "gender",
    "labor_market_status",
    "education",
]


def validate_pesel(pesel: str | None) -> bool:
    return bool(pesel and re.fullmatch(r"\d{11}", pesel))


def validate_phone(phone: str | None) -> bool:
    if not phone:
        return False
    return bool(re.fullmatch(r"[+\d][\d\s-]{6,18}", phone.strip()))


def participant_warnings(data: dict) -> list[str]:
    warnings = [field for field in REQUIRED_PARTICIPANT_FIELDS if not data.get(field)]
    if data.get("pesel") and not validate_pesel(data.get("pesel")):
        warnings.append("pesel_invalid")
    if data.get("phone") and not validate_phone(data.get("phone")):
        warnings.append("phone_invalid")
    return warnings


def birth_date_from_pesel(pesel: str | None) -> date | None:
    if not pesel or not re.fullmatch(r"\d{11}", pesel):
        return None
    year = int(pesel[0:2])
    month = int(pesel[2:4])
    day = int(pesel[4:6])
    century = 1900
    if 21 <= month <= 32:
        century, month = 2000, month - 20
    elif 41 <= month <= 52:
        century, month = 2100, month - 40
    elif 61 <= month <= 72:
        century, month = 2200, month - 60
    elif 81 <= month <= 92:
        century, month = 1800, month - 80
    try:
        return date(century + year, month, day)
    except ValueError:
        return None
