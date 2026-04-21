# Spec: EvergowFace — AI Setter en n8n + respond.io (Instagram DMs)

**Fecha:** 2026-04-20
**Cliente:** Naiara (@everglowface) — gimnasia facial
**Objetivo:** Sustituir ManyChat con un flujo n8n completo que cualifica leads de Instagram via respond.io como CRM y canal de mensajería.

---

## Contexto

Naiara capta leads en Instagram via Stories y Reels. Cuando alguien responde a una Story/Reel con una keyword o escribe un DM directo, un bot setter los cualifica conversacionalmente, les envía un vídeo de valor, hace follow-up, y cuando el lead está caliente cierra con un audio pre-grabado + link de Calendly.

respond.io gestiona la conexión con Instagram. n8n orquesta toda la lógica, IA y automatizaciones porque respond.io es muy limitado para IA avanzada y automatizaciones complejas.

---

## Arquitectura (Opción C aprobada)

```
Instagram (Story/Reel reply o DM directo)
        ↓
   respond.io (recibe mensaje → dispara webhook a n8n)
        ↓
   n8n Webhook Trigger
        ↓
   [1] Entry Classifier
        ↓
   [2] Contact Reader (lee estado del contacto en respond.io)
        ↓
   [3] AI Setter Agent (prompt completo de Naiara)
        ↓
   [4] Message Sender (texto / vídeo / audio via respond.io API)
        ↓
   [5] State Writer (actualiza custom fields en respond.io)
        ↓
   [6] Follow-up Handler (Wait 2h → check → follow-up si no respondió)
```

respond.io actúa como CRM visible para Naiara (stages, datos del lead) y como canal de entrada/salida de Instagram. n8n tiene el control total del flujo.

---

## Triggers

Dos eventos disparan el flujo:

1. **Keyword en Story/Reel reply** — el usuario responde "QUIERO" (u otras keywords configuradas) a una Story o Reel → respond.io lo detecta y abre DM automáticamente → webhook a n8n
2. **Cualquier DM directo** — el usuario escribe cualquier cosa al DM de Naiara → respond.io recibe → webhook a n8n

respond.io envía el webhook con:
- `contact_id` — ID único del contacto en respond.io
- `message_text` — texto del mensaje recibido
- `channel` — instagram_dm
- `source` — story_reply / reel_reply / direct_dm
- `source_media_id` — ID del reel/story si aplica

---

## Nodos del workflow n8n

### [1] Entry Classifier (Switch)

Dos dimensiones:

**A) ¿Contacto nuevo o conversación activa?**
- Lee `lifecycle_stage` del contacto en respond.io
- Si no existe → lead nuevo, asignar tipo de entrada
- Si existe con stage activo → continuar conversación existente (pasar al AI Agent con contexto)

**B) Tipo de entrada (para leads nuevos)**

| Tipo | Condición de detección |
|------|----------------------|
| 1 — Keyword "QUIERO" | `source = story_reply OR reel_reply` + texto contiene keyword configurada |
| 2 — Lead magnet | Tag `lead_magnet` en el contacto de respond.io ya existe |
| 3 — DM con problema (catch-all) | Cualquier DM que no encaje en otros tipos. El más común. |
| 4 — Quiere comprar / pregunta por programa | Texto contiene palabras clave: "precio", "curso", "cómo funciona", "qué incluye", "comprar" |
| 5 — YouTube a WhatsApp | Tag `youtube_lead` en el contacto (viene de otro flujo) |

El Tipo 3 es el catch-all — cualquier mensaje no clasificado entra aquí y el AI Agent toma el control.

### [2] Contact Reader (HTTP Request → respond.io API)

GET `https://api.respond.io/v2/contact/{contact_id}`

Extrae y pasa al AI Agent:
- `lifecycle_stage`
- `lead_temperature`
- `main_problem`
- `entry_type`
- `conversation_history` (JSON string, últimos 10 mensajes)
- `conversation_summary`

Si el contacto no existe → se crea con stage `nuevo_lead`.

### [3] AI Setter Agent (LangChain AI Agent)

**Modelo:** Claude Sonnet / GPT-4o

**System prompt:** El prompt completo de Naiara (setter de EvergowFace) incluyendo:
- Objetivo: generar conversación → detectar problema → amplificar → vídeo → llamada
- Estilo: cercano, natural, como audio de Instagram
- Prohibiciones: no dar soluciones, no explicar ejercicios
- Manejo de objeciones (me lo pienso / no tengo tiempo / no tengo dinero)
- Conocimiento de problemas faciales (entrecejo, bolsas, flacidez, etc.)
- Regla de persistencia: nunca cerrar sin llevar a vídeo o llamada

**Input al agente:**
```json
{
  "entry_type": 1,
  "lifecycle_stage": "en_conversacion",
  "lead_temperature": "frio",
  "main_problem": "",
  "conversation_history": [...],
  "conversation_summary": "",
  "new_message": "Hola, quiero saber más"
}
```

**Output estructurado (JSON):**
```json
{
  "messages": ["texto 1", "texto 2"],
  "send_video": false,
  "send_audio": false,
  "send_calendly": false,
  "new_stage": "en_conversacion",
  "new_temperature": "medio",
  "detected_problem": "flacidez",
  "conversation_summary": "Lead con flacidez, nunca hizo gimnasia facial"
}
```

El agente decide cuándo enviar el vídeo, el audio y el Calendly basándose en el estado de la conversación y la temperatura del lead.

### [4] Message Sender (HTTP Request → respond.io API)

Ejecuta en secuencia según el output del AI Agent:

1. **Mensajes de texto** — POST a respond.io por cada mensaje en el array `messages`
   - Endpoint: `POST /v2/contact/{contact_id}/message`
   - Si hay 2-3 mensajes, se envían con un pequeño delay entre ellos (simula escritura natural)

2. **Vídeo** — si `send_video: true`, envía texto con la URL del vídeo

3. **Audio** — si `send_audio: true`, envía el archivo .ogg pre-grabado de Naiara
   - Endpoint: `POST /v2/contact/{contact_id}/message` con `type: "attachment"` y la URL pública del audio

4. **Calendly** — si `send_calendly: true`, envía texto con el link de Calendly de Naiara

### [5] State Writer (HTTP Request → respond.io API)

PATCH `https://api.respond.io/v2/contact/{contact_id}`

Actualiza los custom fields del contacto:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `lifecycle_stage` | string | Etapa actual del lead en el funnel |
| `lead_temperature` | string | frio / medio / caliente |
| `main_problem` | string | Problema facial principal detectado |
| `entry_type` | string | Cómo llegó el lead (1-5) |
| `conversation_history` | text | JSON string con últimos 10 mensajes |
| `conversation_summary` | text | Resumen generado por IA para contexto futuro |

**Lifecycle stages:**
- `nuevo_lead` — primer contacto, sin clasificar
- `en_conversacion` — conversación activa de cualificación
- `video_enviado` — se le envió el vídeo de valor
- `follow_up_enviado` — se envió el follow-up de 2h
- `cualificado` — lead caliente, listo para llamada
- `llamada_agendada` — confirmó la llamada con Calendly
- `no_interesado` — cerró conversación o no respondió tras follow-up

### [6] Follow-up Handler (Wait + HTTP Request)

Se activa cuando `send_video: true`:

1. **Nodo Wait** — espera 2 horas
2. **Contact Reader** — vuelve a leer el contacto en respond.io
3. **Condición** — ¿`lifecycle_stage` sigue siendo `video_enviado`? (es decir, no respondió)
4. **Si no respondió** → envía follow-up:
   - Texto: `"¿Holaaa 👋, qué te ha parecido??"`
   - Actualiza stage a `follow_up_enviado`
5. **Si sí respondió** → el flujo normal ya habrá continuado via webhook, no hace nada

---

## Flujos por tipo de entrada

### Tipo 1 — Keyword "QUIERO"
```
Apertura → ¿Has hecho gimnasia facial? → ¿Qué te preocupa? →
Amplificación → Visión positiva → Urgencia negativa →
Envío vídeo → Follow-up 2h → AUDIO cierre → Calendly
```

### Tipo 2 — Lead magnet
```
"Espero que te haya servido el vídeo" → ¿Has hecho gimnasia facial? →
¿Qué te preocupa? → Amplificación → Envío vídeo 2 →
Follow-up 2h → AUDIO cierre → Calendly
```

### Tipo 3 — DM directo con problema (catch-all)
```
"Cuéntame, ¿desde hace cuánto lo notas?" →
Amplificación → Visión positiva → Urgencia negativa →
Envío vídeo → Follow-up 2h → AUDIO cierre → Calendly
```

### Tipo 4 — Quiere comprar / pregunta por programa
```
"Cuéntame, ¿has hecho gimnasia facial?" → ¿Qué te preocupa? →
AUDIO directo → Calendly (flujo corto, lead caliente)
```

### Tipo 5 — YouTube a WhatsApp
```
Igual que Tipo 1 (mismo flujo de apertura y cualificación)
```

---

## Manejo de objeciones

El AI Agent detecta objeciones en el texto del lead y responde según el prompt:

| Objeción | Respuesta del bot |
|----------|------------------|
| "me lo pienso" | Valida + invita a ver el caso juntos |
| "no tengo tiempo" | Reencuadra: por eso es importante hacerlo bien |
| "no tengo dinero" | Quita presión: primero vemos tu caso |
| Pregunta sobre precio | "Eso te lo explico en la llamada viendo tu caso" |
| Pregunta sobre cómo funciona | Respuesta breve + vuelta al workflow |
| Insistencia en ejercicios concretos | No resuelve + redirige al proceso |

---

## Configuración técnica

### respond.io
- Instagram Business conectado a respond.io
- Webhook configurado: `POST https://[n8n-url]/webhook/everglowface`
- Custom fields creados: `lifecycle_stage`, `lead_temperature`, `main_problem`, `entry_type`, `conversation_history`, `conversation_summary`
- Audio pre-grabado de Naiara subido a URL pública (S3 o similar)

### n8n
- Variables de entorno: `RESPOND_IO_API_KEY`, `OPENAI_API_KEY` (o Anthropic), `CALENDLY_LINK`, `VIDEO_URL`, `AUDIO_URL`
- El workflow se activa via Webhook node
- El AI Agent usa LangChain con output parser estructurado (JSON)

---

## Lo que NO hace este sistema

- No genera audio por IA (el audio es pre-grabado, estático)
- No gestiona pagos ni onboarding post-llamada
- No maneja WhatsApp (solo Instagram DMs via respond.io)
- No conecta con Calendly para confirmar citas (solo envía el link)
