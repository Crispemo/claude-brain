# Carousel Generator

Genera carruseles de 8 slides listos para Instagram (1080x1350px PNG).

## Instalación (una sola vez)

```bash
pip install anthropic playwright
playwright install chromium
```

Necesitas tu API key de Anthropic en una variable de entorno:
```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

O crea un archivo `.env` en esta carpeta con:
```
ANTHROPIC_API_KEY=sk-ant-...
```

## Uso

```bash
cd carousel-generator
python generate.py "tema del carrusel"
```

### Ejemplos

```bash
python generate.py "aumentar el AOV en tiendas Shopify"
python generate.py "automatizar el servicio al cliente con IA en ecommerce"
python generate.py "por qué tu tienda pierde ventas sin automatización"
python generate.py "n8n para ecommerce: 5 flujos que ahorran 10 horas a la semana"
```

### Con descripción de cliente personalizada

```bash
python generate.py "tema" "dueños de tiendas de moda online con Shopify"
```

## Output

Cada ejecución crea una carpeta en `output/` con:
```
output/
  20260324_1430_aumentar_el_AOV_en_tiendas_Sh/
    copy.json        ← el copy de los 8 slides en JSON
    slide_01.png     ← hook
    slide_02.png     ← problema
    slide_03.png     ← agravación
    slide_04.png     ← dolor
    slide_05.png     ← solución
    slide_06.png     ← resultado
    slide_07.png     ← prueba social
    slide_08.png     ← CTA
```

## Estructura de archivos

```
carousel-generator/
  generate.py          ← script principal
  prompt.txt           ← mega-prompt de contenido (editable)
  templates/
    slide_base.html    ← plantilla HTML de los slides
  brand/
    config.json        ← colores, fuentes, nombre de agencia
  output/              ← aquí se guardan los PNGs generados
```

## Personalización

### Cambiar colores o nombre de agencia
Edita `brand/config.json`.

### Cambiar el prompt de contenido
Edita `prompt.txt` para ajustar el tono, estructura o instrucciones.

### Cambiar el diseño de los slides
Edita `templates/slide_base.html`. Es HTML/CSS estándar.

## Colores de marca

| Color | Hex | Uso |
|---|---|---|
| Crema | #F5F0E8 | Fondo principal |
| Negro | #1A1A1A | Fondo impacto |
| Blanco | #FFFFFF | Fondo limpio |
| Terracota | #C4611A | Acento y CTA |
