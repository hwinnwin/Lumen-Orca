from __future__ import annotations
from pathlib import Path
import json
from typing import Dict, Optional

BASE_DIR = Path(__file__).resolve().parent.parent
LEXICON_PATH = BASE_DIR / "lexicon" / "base.json"

with open(LEXICON_PATH, "r", encoding="utf-8") as f:
    BASE_LEXICON: Dict[str, Dict[str, str]] = json.load(f)["vn"]


def to_nom(term: str) -> Optional[Dict[str, str]]:
    """Return a Nôm mapping for a Vietnamese or Sino-Việt term."""
    normalized = term.lower()
    return BASE_LEXICON.get(normalized)


__all__ = ["to_nom", "BASE_LEXICON"]
