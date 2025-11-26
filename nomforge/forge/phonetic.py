from __future__ import annotations
from typing import Dict


def latin_to_nom(token: str, fallback: Dict[str, str] | None = None) -> Dict[str, str]:
    simplified = token.lower()[:3]
    if fallback:
        return {"nom": fallback.get("nom", token), "strategy": "phonetic"}
    return {"nom": simplified, "strategy": "phonetic"}


__all__ = ["latin_to_nom"]
