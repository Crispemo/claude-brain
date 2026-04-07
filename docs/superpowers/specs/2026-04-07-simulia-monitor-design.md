# Simulia Monitor — Spec de Diseño
**Fecha:** 2026-04-07  
**Proyecto:** Simulia  
**Objetivo:** Sistema automático de detección de nuevas guías clínicas de enfermería con generación de script de vídeo listo para grabar.

---

## Contexto

Los vídeos de mayor rendimiento de Simulia son reacciones a novedades en guías clínicas (ERC 2025, actualizaciones OMS, alertas sanitarias). Actualmente el proceso es manual: Cris encuentra la novedad, decide si hacerlo, escribe el script. Este sistema automatiza los pasos 1 y 2 y facilita el 3.

---

## Arquitectura general

```
[node-cron: 8:00 diario] → [simulia-monitor.js]
                              ↓
                         [scraper por fuente]
                              ↓
                    [comparación vs seenUrls]
                              ↓ (si hay novedad)
                    [filtro relevancia — Claude API]
                              ↓ (si es relevante EIR)
                    [generación resumen + script — Claude API]
                              ↓
                    [escribe en state.json > simuliaAlerts]
                              ↓
                    [dashboard muestra alerta con punto rojo]
```

**Comportamiento al arrancar el servidor:** Si `simuliaAlerts.lastRun` no es la fecha de hoy, el monitor se ejecuta inmediatamente al inicio. Así, si el Mac no estaba encendido a las 8h, corre en el momento de arrancar.

---

## Fuentes monitorizadas

```js
const SOURCES = [
  {
    name: "Sanidad Exterior",
    url: "https://www.sanidad.gob.es/areas/sanidadExterior/laSaludTambienViaja/notasInformativas/home.htm",
    selector: "..." // a determinar al implementar
  },
  {
    name: "Seguridad del Paciente",
    url: "https://seguridaddelpaciente.sanidad.gob.es/informacion/publicaciones/home.htm",
    selector: "..."
  },
  {
    name: "GuíaSalud",
    url: "https://portal.guiasalud.es/",
    selector: "..."
  }
]
```

Las fuentes son un array configurable en `simulia-monitor.js`. Añadir una nueva fuente no requiere tocar lógica.

Tecnología de scraping: `node-fetch` + `cheerio`. Las 3 fuentes tienen HTML estático (no JS renderizado), no se necesita Puppeteer.

---

## Pipeline por novedad detectada

1. **Extracción:** título, descripción (si existe), URL del artículo, fuente
2. **Filtro de relevancia** (llamada Claude API): pregunta si la novedad es relevante para oposiciones de enfermería EIR/OPE. Si no lo es, se ignora y se añade a `seenUrls` para no reprocesar.
3. **Generación de contenido** (llamada Claude API): produce un resumen breve (3-4 líneas) y un script completo siguiendo el formato de `simulia/scripts/GUIA-FORMATO.md` (hook 0-3s, contexto, cambio clave, dato de test, cierre EIR, CTA doble).
4. **Persistencia:** guarda la alerta completa en `state.json`.

---

## Estructura de datos en `state.json`

Nueva clave `simuliaAlerts`:

```json
"simuliaAlerts": {
  "lastRun": "2026-04-07T08:00:00.000Z",
  "seenUrls": [
    "https://portal.guiasalud.es/articulo-ejemplo"
  ],
  "alerts": [
    {
      "id": "alert-1712487600000",
      "title": "Guía Sepsis 2026 — nuevos criterios SOFA",
      "url": "https://portal.guiasalud.es/...",
      "source": "GuíaSalud",
      "detectedAt": "2026-04-07T08:02:00.000Z",
      "summary": "La nueva guía actualiza los criterios SOFA para diagnóstico precoz de sepsis...",
      "script": "[0:00–0:03] HOOK\n\"Si estás estudiando sepsis con los criterios de 2021...\"",
      "seen": false
    }
  ]
}
```

---

## Archivos afectados

| Archivo | Acción | Descripción |
|---|---|---|
| `dashboard/simulia-monitor.js` | Crear | Módulo completo: scraper, cron, lógica de detección, llamadas Claude API |
| `dashboard/server.js` | Modificar | Importar monitor, añadir endpoint `POST /api/monitor/run` |
| `dashboard/state.json` | Modificar | Añadir clave `simuliaAlerts` con estructura vacía inicial |
| `dashboard/index.html` | Modificar | Nueva sección UI "Alertas Simulia" en sidebar y contenido principal |

---

## UI — Sección "Alertas Simulia"

**Sidebar:** nueva entrada "Alertas Simulia" con punto rojo cuando `alerts.some(a => !a.seen)`.

**Vista principal:**

```
┌─────────────────────────────────────────────┐
│  ALERTAS SIMULIA              [▶ Ejecutar]  │
│  Última revisión: hoy 08:00                 │
├─────────────────────────────────────────────┤
│  🔴 NUEVA — Guía Sepsis 2026                │
│  Fuente: guiasalud.es · hace 2h             │
│  "La nueva guía actualiza los criterios..." │
│  [Ver script] [Marcar como visto]           │
├─────────────────────────────────────────────┤
│  ✓ VISTA — Actualización RCP ERC 2025       │
│  Fuente: sanidad.gob.es · hace 3 días       │
└─────────────────────────────────────────────┘
```

**"Ver script":** despliega el borrador completo generado por Claude en formato `GUIA-FORMATO.md`.

**"Marcar como visto":** cambia `seen: true`, quita el punto rojo del sidebar.

**"Ejecutar":** llama a `POST /api/monitor/run` para lanzar el monitor manualmente sin esperar al cron.

---

## Dependencias nuevas

- `cheerio` — parsing HTML para scraping
- `node-cron` — scheduler del job diario
- `node-fetch` ya existe en el proyecto (`content-engine/`)

---

## Lo que NO hace este sistema

- No publica el vídeo automáticamente
- No envía notificaciones push/email/WhatsApp
- No raspa fuentes con JS renderizado (si en el futuro hace falta, se añade Puppeteer)
- No aprende de cuáles alertas decides usar (futuro: feedback loop)
