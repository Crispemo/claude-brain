# Content Engine — Design Spec
**Fecha:** 2026-04-07  
**Estado:** Aprobado

---

## Resumen

App web independiente (`content-engine/` dentro de `claude-brain`) con dos módulos:

1. **Scripts** — genera guiones adaptados a la voz de Agencia desde cualquier URL
2. **Video Clipper** — monta clips cortos 9:16 HD desde dos vídeos (pantalla + cara)

---

## Arquitectura

- **Stack:** Node.js + Express + HTML/CSS/JS (mismo patrón que el dashboard existente)
- **Ubicación:** `/Users/cris/Desktop/claude-brain/content-engine/`
- **Dependencias externas (instalar una vez):**
  - `yt-dlp` — descarga transcripciones de YouTube/Instagram sin bajar el vídeo completo
  - `ffmpeg` — montaje y edición de vídeo
  - `whisper` (Python, local, modelo `small` o `medium`) — transcripción de audio a texto
- **APIs:** Claude API (ya disponible en `.env` del dashboard)
- **Almacenamiento:** Local. Scripts en JSON, clips en carpeta `output/`

---

## Módulo 1 — Scripts

### Flujo
1. Usuario pega una URL (YouTube, Instagram, artículo web)
2. Backend detecta el tipo de URL:
   - YT/Instagram → `yt-dlp --skip-download --write-auto-sub` extrae transcripción
   - Artículo web → fetch + extracción de texto limpio (sin HTML)
3. Claude API recibe el texto + prompt fijo → genera script
4. UI muestra script en 4 secciones editables + botón copiar
5. Script se guarda en JSON local (`scripts/YYYY-MM-DD-titulo.json`)

### Prompt fijo (hardcodeado en backend)

```
Eres un asistente que genera scripts de vídeo para Cris, creador de contenido de IA aplicada a ecommerce en español.

AUDIENCIA: Dueños de tiendas online que ya facturan y quieren optimizar con IA. No son principiantes.

VOZ: Directo, sin relleno, tono de "así lo puedes tener tú". Nunca pedagógico ni de profesor. Primera persona, ejemplos concretos, frases cortas.

ESTRUCTURA OBLIGATORIA:
1. INTRO (gancho) — frase directa que conecta con un problema real del ecom
2. CTA TEMPRANO — "escríbeme al WhatsApp / enlace en bio si quieres esto para tu tienda"
3. CONTENIDO — adapta el material fuente a la audiencia con la voz descrita arriba
4. CIERRE + CTA — recordatorio de contacto/WhatsApp

INPUT: [transcripción o texto fuente]

Genera el script completo. Sin explicaciones, solo el script.
```

### UI
- Input: campo URL + botón "Generar script"
- Output: 4 bloques de texto con etiquetas (INTRO / CTA / CONTENIDO / CIERRE)
- Acciones: Copiar todo, Copiar sección, Guardar
- Lista de scripts guardados con fecha y URL origen

---

## Módulo 2 — Video Clipper

### Flujo
1. Usuario sube **vídeo pantalla** + **vídeo cara** (ambos mp4/mov)
2. Backend:
   a. Extrae audio del vídeo cara con ffmpeg
   b. Whisper transcribe el audio → texto con timestamps
   c. Claude analiza la transcripción y devuelve **5-10 segmentos** con timestamps de inicio/fin (los momentos más impactantes, cambios de tema, frases de alto valor)
   d. Para cada segmento, ffmpeg monta el clip:
      - Formato: 1080x1920 (9:16 vertical)
      - Pantalla arriba: 60% de la altura (1080x1152)
      - Cara abajo: 40% de la altura (1080x768)
      - Captions animados: sobre el vídeo de cara, centrados, fuente grande
   e. Clips exportados en `output/YYYY-MM-DD-clip-N.mp4`
3. UI muestra lista de clips con preview y botón de descarga

### Prompt de selección de clips (Claude)

```
Analiza esta transcripción con timestamps y selecciona entre 5 y 10 segmentos para clips cortos de redes sociales (30-90 segundos cada uno).

Criterios de selección:
- Frases de alto impacto o sorpresa
- Momentos donde se explica algo concreto y accionable
- Cambios de tema claros (buenos puntos de corte)
- Evitar: saludos, muletillas, frases incompletas

Devuelve SOLO un array JSON:
[{"start": 12.5, "end": 45.2, "titulo": "Por qué el 80% de los ecom fallan en X"}, ...]
```

### Captions
- Generados a partir de la transcripción de Whisper (ya tiene timestamps por palabra)
- Estilo: texto blanco, fondo negro semitransparente, palabra activa en amarillo
- Implementación: se genera un `.ass` (Advanced SubStation Alpha) desde Whisper y se incrusta con ffmpeg `subtitles` filter — permite estilo por palabra (karaoke-style)

### UI
- Dos zonas de upload (drag & drop): "Vídeo pantalla" + "Vídeo cara"
- Barra de progreso durante el procesamiento (puede tardar varios minutos)
- Lista de clips generados: miniatura, duración, título sugerido, botón descarga
- Botón "Descargar todos"

---

## Estructura de archivos

```
content-engine/
├── server.js              # Express app, rutas API
├── index.html             # UI completa (SPA, mismo estilo dark que dashboard)
├── package.json
├── .env                   # ANTHROPIC_API_KEY
├── prompts/
│   ├── script-agencia.txt # Prompt fijo módulo Scripts
│   └── clip-selector.txt  # Prompt selección de clips
├── scripts/               # Scripts guardados (JSON)
├── uploads/               # Vídeos subidos temporalmente
└── output/                # Clips generados
```

---

## API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/scripts/generate` | Recibe URL, devuelve script |
| GET | `/api/scripts` | Lista de scripts guardados |
| POST | `/api/clips/process` | Recibe dos vídeos, inicia procesamiento |
| GET | `/api/clips/status/:jobId` | Estado del procesamiento |
| GET | `/api/clips` | Lista de clips generados |
| GET | `/output/:filename` | Descarga de clip |

---

## Consideraciones

- **Procesamiento de vídeo es lento** — el endpoint de clips devuelve un `jobId` inmediatamente y la UI hace polling del estado
- **Almacenamiento:** los uploads se limpian tras procesar; los clips se guardan hasta borrado manual
- **Calidad:** ffmpeg exporta con `-crf 18` (alta calidad) y `-preset slow` para mejor compresión sin perder calidad
- **Sin marca de agua:** todo local, sin servicios externos para el vídeo
