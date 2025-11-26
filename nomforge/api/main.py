from pathlib import Path
import json
from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse

app = FastAPI(title="NÔM-FORGE PRIME", version="0.9")

BASE_DIR = Path(__file__).resolve().parent.parent
LEXICON_DIR = BASE_DIR / "lexicon"

with open(LEXICON_DIR / "base.json", "r", encoding="utf-8") as f:
    BASE_LEXICON = json.load(f)["vn"]
with open(LEXICON_DIR / "english.json", "r", encoding="utf-8") as f:
    EN_LEXICON = json.load(f)
with open(LEXICON_DIR / "romanji.json", "r", encoding="utf-8") as f:
    ROMANJI = json.load(f)
with open(LEXICON_DIR / "brands.json", "r", encoding="utf-8") as f:
    BRANDS = json.load(f)["brands"]
with open(LEXICON_DIR / "pua_map.json", "r", encoding="utf-8") as f:
    PUA_MAP = json.load(f)["pua"]


def detect_language(text: str) -> str:
    has_diacritics = any("àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ" in ch for ch in text)
    if has_diacritics:
        return "vn"
    if any("ぁ" <= ch <= "ゔ" for ch in text):
        return "jp"
    if any(ch.isalpha() for ch in text):
        return "en"
    return "auto"


def tokenize(text: str):
    return [token.strip() for token in text.split() if token.strip()]


def lookup_vn(token: str):
    lowered = token.lower()
    return BASE_LEXICON.get(lowered)


def lookup_brand(token: str):
    key = token.lower()
    if key in BRANDS:
        entry = BRANDS[key]
        return {"nom": f"\u{entry['pua']}", "pua": entry["pua"], "strategy": "brand"}
    return None


def english_concept(token: str):
    concept = EN_LEXICON["concepts"].get(token.lower())
    if concept:
        nom = concept.get("nom") or concept.get("han")
        return {"nom": nom, "han": concept.get("han"), "strategy": "concept"}
    return None


def english_phonetic(token: str):
    approx = EN_LEXICON["phonetic"].get(token.lower())
    if approx:
        base_sound = approx["approx"].split("-")[0]
        fallback = lookup_vn(base_sound) or {"nom": base_sound}
        return {"nom": fallback.get("nom", base_sound), "strategy": "phonetic"}
    consonants = token.lower()[:3]
    fallback = lookup_vn(consonants)
    if fallback:
        return {"nom": fallback.get("nom"), "strategy": "phonetic"}
    return {"nom": token, "strategy": "latin"}


def romanji_bridge(token: str):
    bridge = ROMANJI["kanji_bridge"].get(token.lower())
    if bridge:
        sino_viet = bridge.get("sino_viet", "")
        vn_match = lookup_vn(sino_viet)
        if vn_match:
            return {"nom": vn_match.get("nom"), "han": bridge.get("kanji"), "strategy": "romanji-bridge"}
        return {"nom": bridge.get("kanji"), "strategy": "romanji-bridge"}
    return None


def forge_symbol(token: str):
    code = PUA_MAP.get("DRAGONLINE_151")
    glyph = f"\u{code}" if code else token
    return {"nom": glyph, "strategy": "forge"}


def translate_token(token: str, lang_hint: str):
    brand = lookup_brand(token)
    if brand:
        return brand

    if lang_hint == "vn":
        vn = lookup_vn(token)
        if vn:
            return vn
    if lang_hint == "en":
        concept = english_concept(token)
        if concept:
            return concept
        return english_phonetic(token)
    if lang_hint == "jp":
        bridge = romanji_bridge(token)
        if bridge:
            return bridge
    romanji = romanji_bridge(token)
    if romanji:
        return romanji
    vn = lookup_vn(token)
    if vn:
        return vn
    concept = english_concept(token)
    if concept:
        return concept
    return forge_symbol(token)


def assemble_output(tokens, entries):
    nom = " ".join([entry.get("nom", t) for entry, t in zip(entries, tokens)])
    strategies = [entry.get("strategy", "unknown") for entry in entries]
    return {"nom": nom, "tokens": [entry.get("nom", t) for entry, t in zip(entries, tokens)], "strategies": strategies}


@app.get("/translate")
async def translate(text: str = Query(""), mode: str = Query("default"), lang: str = Query("auto")):
    lang_hint = lang if lang != "auto" else detect_language(text)
    tokens = tokenize(text)
    entries = [translate_token(token, lang_hint) for token in tokens]
    payload = assemble_output(tokens, entries)
    payload["mode"] = mode
    payload["lang"] = lang_hint
    return JSONResponse(payload)


@app.get("/forge")
async def forge(text: str = Query("")):
    tokens = tokenize(text)
    entries = [forge_symbol(token) for token in tokens]
    return JSONResponse(assemble_output(tokens, entries))


@app.get("/seal")
async def seal(text: str = Query("")):
    tokens = tokenize(text)
    entries = [translate_token(token, "auto") for token in tokens]
    payload = assemble_output(tokens, entries)
    payload["svg_template"] = "svg_templates/square_seal.svg"
    return JSONResponse(payload)


@app.get("/crest")
async def crest(text: str = Query("")):
    tokens = tokenize(text)
    entries = [translate_token(token, "auto") for token in tokens]
    payload = assemble_output(tokens, entries)
    payload["svg_template"] = "svg_templates/dragon_crest.svg"
    return JSONResponse(payload)
