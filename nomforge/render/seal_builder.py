from __future__ import annotations
from pathlib import Path
from typing import Dict

TEMPLATES = {
    "seal": "square_seal.svg",
    "crest": "dragon_crest.svg",
    "banner": "vertical_banner.svg",
    "shield": "shield_crest.svg",
}

BASE_DIR = Path(__file__).resolve().parent
TEMPLATE_DIR = BASE_DIR / "svg_templates"


def load_template(name: str) -> str:
    filename = TEMPLATES.get(name, TEMPLATES["seal"])
    path = TEMPLATE_DIR / filename
    return path.read_text(encoding="utf-8")


def embed_text(template: str, replacement: Dict[str, str]) -> str:
    svg = template
    for key, value in replacement.items():
        svg = svg.replace(f"{{{{{key}}}}}", value)
    return svg


__all__ = ["load_template", "embed_text", "TEMPLATES"]
