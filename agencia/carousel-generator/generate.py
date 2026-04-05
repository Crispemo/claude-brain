#!/usr/bin/env python3
"""
Carousel Generator — Agencia Cristina Peris AI
Genera carruseles de 8 slides (1080x1350px PNG) listos para Instagram.

USO:
    python generate.py "tema"                        # estilo A (editorial)
    python generate.py "tema" --style b              # estilo B (creator bold)
    python generate.py "tema" "desc cliente" --style b

REQUISITOS:
    pip install playwright anthropic
    playwright install chromium
"""

import sys
import json
import os
import re
import asyncio
from pathlib import Path
from datetime import datetime

# Cargar .env si existe
_env_file = Path(__file__).parent / ".env"
if _env_file.exists():
    for _line in _env_file.read_text().splitlines():
        if _line.strip() and not _line.startswith("#") and "=" in _line:
            _k, _v = _line.split("=", 1)
            os.environ.setdefault(_k.strip(), _v.strip())

# ── Rutas ──────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent
TEMPLATES_DIR = BASE_DIR / "templates"
OUTPUT_DIR = BASE_DIR / "output"
BRAND_DIR = BASE_DIR / "brand"
PROMPT_FILE = BASE_DIR / "prompt.txt"
TEMPLATE_FILE_A = TEMPLATES_DIR / "slide_base.html"
TEMPLATE_FILE_B = TEMPLATES_DIR / "slide_base_b.html"

# ── Configuración de marca ─────────────────────────────────────────────────────
with open(BRAND_DIR / "config.json") as f:
    BRAND = json.load(f)

COLORS = BRAND["colors"]

# Estilo A — editorial (cream / black / accent)
# bg_color, text_color, muted_color, bg_class
BG_MAP_A = {
    "cream":  (COLORS["cream"],  COLORS["black"],  COLORS["text_muted"], "cream"),
    "black":  (COLORS["black"],  COLORS["white"],  "#4A4040",            "black"),
    "white":  (COLORS["white"],  COLORS["black"],  COLORS["text_muted"], "white"),
    "accent": (COLORS["accent"], COLORS["white"],  "#A04010",            "accent"),
}
DEFAULT_BG_A = ["cream", "black", "cream", "black", "cream", "black", "cream", "accent"]

# Estilo B — creator bold (blue / yellow / navy / coral)
# bg_color, text_color, headline_color, card_bg, card_text
BG_MAP_B = {
    "blue":   ("linear-gradient(155deg,#1877F2 0%,#0A52C4 100%)", "#FFFFFF", "#FFE135", "rgba(255,255,255,0.12)", "#FFFFFF"),
    "yellow": ("#FFE135",                                          "#1A1A1A", "#1A1A1A", "rgba(0,0,0,0.09)",       "#1A1A1A"),
    "navy":   ("#0A1628",                                          "#FFFFFF", "#FFE135", "rgba(255,255,255,0.10)", "#FFFFFF"),
    "coral":  ("#D44000",                                          "#FFFFFF", "#FFE135", "rgba(255,255,255,0.14)", "#FFFFFF"),
}
DEFAULT_BG_B = ["blue", "yellow", "blue", "navy", "blue", "yellow", "blue", "coral"]


# ── Paso 1: Generar copy con Claude ───────────────────────────────────────────
def generate_copy(topic: str, client_description: str = "dueños de tiendas online en España que quieren aplicar IA") -> list[dict]:
    """Llama a Claude para generar el JSON de los 8 slides."""
    try:
        import anthropic
    except ImportError:
        print("ERROR: instala anthropic → pip install anthropic")
        sys.exit(1)

    with open(PROMPT_FILE) as f:
        base_prompt = f.read()

    prompt = (
        base_prompt
        .replace("[TEMA]", topic)
        .replace("[DESCRIPCIÓN DEL CLIENTE]", client_description)
        .replace("[PALABRA_CTA]", "AUTOMATIZAR")
    )

    client = anthropic.Anthropic()
    print(f"Generando copy para: '{topic}'...")

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}]
    )

    raw = message.content[0].text.strip()

    # Extraer JSON aunque venga con texto extra
    match = re.search(r'\[.*\]', raw, re.DOTALL)
    if not match:
        print("ERROR: Claude no devolvió JSON válido.")
        print(raw)
        sys.exit(1)

    slides = json.loads(match.group())
    print(f"✓ Copy generado — {len(slides)} slides")
    return slides


# ── Paso 2: Renderizar HTML para cada slide ───────────────────────────────────
def render_slide_html(slide: dict, slide_num: int, style: str = "a", total: int = 8) -> str:
    """Rellena la plantilla HTML con los datos del slide."""
    if style == "b":
        template_file = TEMPLATE_FILE_B
        bg_map = BG_MAP_B
        default_bg = DEFAULT_BG_B
    else:
        template_file = TEMPLATE_FILE_A
        bg_map = BG_MAP_A
        default_bg = DEFAULT_BG_A

    with open(template_file) as f:
        template = f.read()

    bg_key = slide.get("background", default_bg[slide_num - 1])

    # Dots de navegación
    dots_html = ""
    for i in range(1, total + 1):
        dots_html += f'<div class="dot {"active" if i == slide_num else ""}"></div>'

    headline = slide.get("headline", "").upper()
    body = (slide.get("body") or "").strip()

    if style == "b":
        bg_color, text_color, headline_color, card_bg, card_text = bg_map.get(bg_key, bg_map["blue"])
        body_block = (
            f'<div class="body-card"><p>{body}</p></div>' if body else ""
        )
        html = (
            template
            .replace("{{BACKGROUND}}", bg_color)
            .replace("{{TEXT_COLOR}}", text_color)
            .replace("{{HEADLINE_COLOR}}", headline_color)
            .replace("{{CARD_BG}}", card_bg)
            .replace("{{CARD_TEXT}}", card_text)
            .replace("{{SLIDE_NUM}}", f"{slide_num:02d}")
            .replace("{{HEADLINE}}", headline)
            .replace("{{SUBHEADLINE}}", slide.get("subheadline", ""))
            .replace("{{BODY_BLOCK}}", body_block)
            .replace("{{DOTS}}", dots_html)
        )
    else:
        bg_color, text_color, muted_color, bg_class = bg_map.get(bg_key, bg_map["cream"])
        body_block = f'<p class="body-text">{body}</p>' if body else ""
        html = (
            template
            .replace("{{BACKGROUND}}", bg_color)
            .replace("{{TEXT_COLOR}}", text_color)
            .replace("{{TEXT_MUTED}}", muted_color)
            .replace("{{BG_CLASS}}", bg_class)
            .replace("{{SLIDE_NUM}}", f"{slide_num:02d}")
            .replace("{{HEADLINE}}", headline)
            .replace("{{SUBHEADLINE}}", slide.get("subheadline", ""))
            .replace("{{BODY_BLOCK}}", body_block)
            .replace("{{DOTS}}", dots_html)
        )

    return html


# ── Paso 3: Exportar cada slide como PNG con Playwright ──────────────────────
async def export_slides_to_png(slides: list[dict], output_folder: Path, style: str = "a") -> list[Path]:
    """Usa Playwright para renderizar cada HTML a PNG de 1080x1350."""
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        print("ERROR: instala playwright → pip install playwright && playwright install chromium")
        sys.exit(1)

    output_folder.mkdir(parents=True, exist_ok=True)
    paths = []

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1080, "height": 1350})

        for i, slide in enumerate(slides, 1):
            html = render_slide_html(slide, i, style=style)

            tmp_html = output_folder / f"_tmp_slide_{i}.html"
            tmp_html.write_text(html, encoding="utf-8")

            await page.goto(f"file://{tmp_html.resolve()}")
            await page.wait_for_load_state("networkidle")

            png_path = output_folder / f"slide_{i:02d}.png"
            await page.screenshot(path=str(png_path), clip={"x": 0, "y": 0, "width": 1080, "height": 1350})

            tmp_html.unlink()
            paths.append(png_path)
            print(f"  ✓ slide_{i:02d}.png")

        await browser.close()

    return paths


# ── Main ──────────────────────────────────────────────────────────────────────
async def main():
    args = sys.argv[1:]

    # Extraer --style a|b
    style = "a"
    if "--style" in args:
        idx = args.index("--style")
        style = args[idx + 1].lower() if idx + 1 < len(args) else "a"
        args = [a for i, a in enumerate(args) if i != idx and i != idx + 1]

    if not args:
        print("Uso: python generate.py \"tema\" [desc_cliente] [--style a|b]")
        sys.exit(1)

    topic = args[0]
    client_desc = args[1] if len(args) > 1 else "dueños de tiendas online en España que quieren aplicar IA y automatización"

    safe_topic = re.sub(r'[^a-zA-Z0-9_-]', '_', topic[:60]).strip("_")
    style_suffix = f"_style{style.upper()}"
    output_folder = OUTPUT_DIR / f"{safe_topic}{style_suffix}"

    print(f"\n── Carousel Generator ──────────────────────")
    print(f"Tema:   {topic}")
    print(f"Estilo: {style.upper()}")
    print(f"Output: {output_folder}\n")

    slides = generate_copy(topic, client_desc)

    output_folder.mkdir(parents=True, exist_ok=True)
    with open(output_folder / "copy.json", "w", encoding="utf-8") as f:
        json.dump(slides, f, ensure_ascii=False, indent=2)
    print(f"✓ Copy guardado en copy.json")

    print("\nGenerando PNGs...")
    png_paths = await export_slides_to_png(slides, output_folder, style=style)

    print(f"\n── Listo ──────────────────────────────────")
    print(f"✓ {len(png_paths)} slides generados en:")
    print(f"  {output_folder}")
    print(f"\nAbre la carpeta y sube los PNGs a Instagram en orden.\n")


if __name__ == "__main__":
    asyncio.run(main())
