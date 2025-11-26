from __future__ import annotations
from typing import Dict

SEMANTIC_FALLBACKS: Dict[str, str] = {
    "protection": "盾",
    "growth": "成",
    "balance": "和"
}


def semantic_match(term: str) -> Dict[str, str] | None:
    normalized = term.lower()
    han = SEMANTIC_FALLBACKS.get(normalized)
    if han:
        return {"nom": han, "strategy": "semantic"}
    return None


__all__ = ["semantic_match", "SEMANTIC_FALLBACKS"]
