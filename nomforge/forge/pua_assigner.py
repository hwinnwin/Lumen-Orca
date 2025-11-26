from __future__ import annotations
from pathlib import Path
import json
from typing import Dict

BASE_DIR = Path(__file__).resolve().parent.parent
PUA_PATH = BASE_DIR / "lexicon" / "pua_map.json"

with open(PUA_PATH, "r", encoding="utf-8") as f:
    PUA_TABLE: Dict[str, str] = json.load(f)["pua"]


def assign(name: str) -> Dict[str, str]:
    key = name.upper()
    codepoint = PUA_TABLE.get(key)
    glyph = f"\u{codepoint}" if codepoint else name
    return {"nom": glyph, "pua": codepoint, "strategy": "pua"}


__all__ = ["assign", "PUA_TABLE"]
