# NÔM-FORGE PRIME

Prototype multilingual translation pipeline for Vietnamese Chữ Nôm / Hán-Nôm and Dragonline glyph output. The FastAPI service in `api/main.py` exposes translation, forge, seal, and crest endpoints returning JSON-first payloads that can be consumed by downstream frontends.

## Quickstart

```bash
uvicorn nomforge.api.main:app --reload
```

## Structure
- `api/`: FastAPI entrypoints
- `forge/`: language and glyph utilities
- `lexicon/`: core lexica and PUA maps
- `render/`: SVG templates and helpers
- `fonts/`: placeholder font build
- `keyboards/`: platform-specific keyboard notes
