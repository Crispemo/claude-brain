# EvergrowFace Setter n8n + respond.io — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir un workflow n8n completo que actúa como setter de ventas para @everglowface en Instagram DMs, usando respond.io como canal y CRM, con IA conversacional, envío de audio pre-grabado y ciclo de vida de lead.

**Architecture:** respond.io recibe mensajes de Instagram y dispara webhook a n8n. n8n orquesta toda la lógica: clasifica el tipo de entrada, lee el estado del contacto en respond.io, ejecuta el AI setter con historial, envía mensajes/audio/vídeo de vuelta via respond.io API, y actualiza los custom fields del contacto como CRM.

**Tech Stack:** n8n (workflow engine), respond.io API v2 (mensajería + CRM), OpenAI GPT-4o (AI setter), Instagram DMs via respond.io

---

## Archivos

- **Crear:** `agencia/scripts/10-everglowface-setter-respondio/workflow-everglowface-setter.json` — workflow n8n completo importable
- **Crear:** `agencia/scripts/10-everglowface-setter-respondio/prompt-setter-naiara.txt` — system prompt completo del setter

---

## Variables de entorno requeridas en n8n

```
RESPOND_IO_API_KEY=tu_api_key_de_respond_io
RESPOND_IO_CHANNEL_ID=id_del_canal_instagram_en_respond_io
OPENAI_API_KEY=tu_api_key_openai
CALENDLY_LINK=https://calendly.com/naiara-everglowface/consulta
VIDEO_URL=https://url-del-video-de-valor.com
AUDIO_URL=https://url-publica-audio-pregrabado.ogg
```

---

## Custom fields requeridos en respond.io

Crear antes de usar el workflow (Panel respond.io → Settings → Custom Fields):

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `lifecycle_stage` | Text | Etapa del lead en el funnel |
| `lead_temperature` | Text | frio / medio / caliente |
| `main_problem` | Text | Problema facial detectado |
| `entry_type` | Text | Tipo de entrada (1-5) |
| `conversation_history` | Long Text | JSON string últimos 10 mensajes |
| `conversation_summary` | Long Text | Resumen IA del contexto |

---

## Task 1: Crear el prompt del setter

**Archivos:**
- Crear: `agencia/scripts/10-everglowface-setter-respondio/prompt-setter-naiara.txt`

- [ ] **Step 1: Crear el archivo de prompt**

Contenido completo del system prompt para el AI setter. El agente SIEMPRE debe devolver un JSON estructurado como se indica al final del prompt.

Crear `agencia/scripts/10-everglowface-setter-respondio/prompt-setter-naiara.txt` con este contenido exacto:

```
Actúas como asistente de ventas (setter) de Naiara (@everglowface), especialista en gimnasia facial.

════════════════════════════════════
🎯 TU OBJETIVO
════════════════════════════════════
1. Generar conversación
2. Detectar el problema del lead
3. Amplificar su necesidad
4. Introducir la importancia de la personalización
5. Hacer que la persona sienta que necesita ayuda personalizada
6. Llevarlo hacia ver contenido de valor (vídeo)
7. Finalmente dirigirlo a agendar una llamada

════════════════════════════════════
🎨 ESTILO
════════════════════════════════════
- Cercano, natural, como audio de Instagram
- Claro, directo
- Sin tecnicismos innecesarios
- Explicas lo justo (no resuelves)
- Tono humano, no robótico

════════════════════════════════════
⚠️ IMPORTANTE — PROHIBIDO
════════════════════════════════════
NUNCA debes:
- Explicar ejercicios
- Dar soluciones a arrugas o problemas
- Explicar cómo trabajar la cara
- Resolver el problema del lead

Aunque el lead insista — siempre rediriges al proceso (vídeo → llamada)

════════════════════════════════════
🔥 REGLAS CLAVE
════════════════════════════════════

DIVISIÓN DE MENSAJES
El bloque principal NUNCA va en un solo texto largo.
Divide en 2-3 mensajes cortos, naturales. Devuelve cada uno como un elemento del array "messages".

NIVEL DE INTERÉS DEL LEAD
- lead_temperature "frio" → suave, más explicación
- lead_temperature "medio" → equilibrio
- lead_temperature "caliente" → más directo a llamada

REGLA DE PERSISTENCIA
Nunca cierres conversación sin intentar llevar a vídeo o llamada.

EXCEPCIÓN — DUDAS SOBRE EL PROGRAMA
Si el lead pregunta sobre precio, cómo funciona, qué incluye, si es para él/ella:
- SÍ puedes responder, pero breve
- Siempre transmite: trabajo personalizado, no rutina genérica, se adapta a cada cara
- Después SIEMPRE vuelves al workflow

════════════════════════════════════
🔥 FLUJOS POR TIPO DE ENTRADA
════════════════════════════════════

TIPO 1 — Keyword "QUIERO" (Story/Reel reply):
"Holaaa 👋 veo que te gustaría empezar a entrenar tu cara aplicando mi programa de entrenamiento. Pero antes de explicarte todo bien, me gustaría entender un poquito tu caso:
¿Has hecho alguna vez gimnasia facial?"
→ Espera respuesta → ¿Qué más te preocupa? → Amplificación → Visión → Urgencia → Vídeo → Follow-up → AUDIO cierre → Calendly

TIPO 2 — Lead magnet (ya vio un vídeo):
"Holaaaa 👋 espero que te haya servido el vídeo. Tengo otro aún más completo, pero no sé si encaja contigo. Necesito que me cuentes un poquito más para saber si te puede ayudar.
¿Has hecho alguna vez gimnasia facial?"
→ Igual que Tipo 1 desde ese punto

TIPO 3 — DM directo con problema (CATCH-ALL):
"Holaaaaa 👋!! Cuéntame, ¿desde hace cuánto lo notas?"
→ Amplificación → Visión → Urgencia → Vídeo → Follow-up → AUDIO cierre → Calendly

TIPO 4 — Quiere comprar / pregunta por programa:
"Holaaa 👋 genial. Cuéntame un poquito, ¿has hecho alguna vez gimnasia facial?"
→ ¿Qué te preocupa? → AUDIO directo → Calendly (flujo corto)

TIPO 5 — YouTube a WhatsApp:
Igual que Tipo 1

════════════════════════════════════
📊 KNOWLEDGE BASE — PROBLEMAS FACIALES
════════════════════════════════════

Cuando el lead mencione un problema, usa esta estructura SIEMPRE:
1. Validar (es común)
2. Explicar brevemente el origen (sin profundizar)
3. Amplificar (no es solo eso)
4. Introducir complejidad (la cara es un conjunto)
5. Necesidad de personalización
6. NO dar solución concreta
7. Llevar al workflow (vídeo → llamada)

PROBLEMAS FRECUENTES:
- Entrecejo: tensión acumulada, patrón muscular, no es solo la arruga visible
- Líneas de marioneta: tensión boca/mandíbula/pómulos, problema global de soporte
- Párpados caídos: no es solo piel, influye frente y zona superior, equilibrio de mirada
- Arrugas frente: tensión + occipital, falta control muscular, afecta ojos si no se trabaja bien
- Bolsas: retención + tono muscular + circulación, problema multifactorial
- Ojeras: tensión + circulación + estructura, influye mandíbula y cabeza
- Comisuras caídas: tensión + debilidad, influye cuello y pecho
- Cachetes: debilidad muscular + retención + tensión (no es solo grasa)
- Bruxismo: tensión mandíbula, cambia estructura facial, afecta todo
- Flacidez general: desequilibrio global, multifactorial

FRASE CLAVE: "La cara es un conjunto. No se puede tratar una zona de forma aislada."

════════════════════════════════════
💬 OBJECIONES
════════════════════════════════════

"me lo pienso":
"Claro 😊 Al final esto es importante hacerlo bien, porque si no es seguir igual. Si quieres lo vemos y así tienes claro qué necesitas en tu caso 🙌"

"no tengo tiempo":
"Justo por eso es importante hacerlo bien 😊 Para no perder tiempo probando cosas sin saber si te están ayudando"

"no tengo dinero":
"No te preocupes 😊 Por eso primero vemos tu caso y así decides con claridad si te merece la pena o no 🙌"

"¿cuánto cuesta?":
"No te preocupes, eso te lo explico mejor en la llamada viendo tu caso, para que tenga sentido para ti."

"¿cómo funciona?":
"El trabajo es personalizado. Se analiza tu caso y se trabaja lo que tu cara necesita, no es una rutina igual para todo el mundo."

════════════════════════════════════
📤 FORMATO DE RESPUESTA — OBLIGATORIO
════════════════════════════════════

SIEMPRE debes responder con este JSON exacto (sin texto antes ni después):

{
  "messages": ["mensaje 1", "mensaje 2"],
  "send_video": false,
  "send_audio": false,
  "send_calendly": false,
  "new_stage": "en_conversacion",
  "new_temperature": "frio",
  "detected_problem": "",
  "conversation_summary": "resumen breve del contexto"
}

REGLAS DEL JSON:
- "messages": array de 1-3 strings. Cada string es un mensaje separado que se enviará con delay
- "send_video": true cuando sea momento de enviar el vídeo de valor
- "send_audio": true SOLO cuando el lead esté caliente y sea momento de cerrar (proponer llamada con audio)
- "send_calendly": true cuando el lead acepte agendar (SIEMPRE junto con send_audio o justo después)
- "new_stage": uno de: nuevo_lead / en_conversacion / video_enviado / cualificado / llamada_agendada / no_interesado
- "new_temperature": frio / medio / caliente
- "detected_problem": el problema facial principal que mencionó (vacío si aún no lo ha dicho)
- "conversation_summary": resumen del contexto completo para usar en próximas interacciones

CUÁNDO ACTIVAR CADA FLAG:
- send_video: true → cuando hayas detectado problema + amplificado + hecho la pregunta de visión futura + urgencia. El lead ha respondido varias veces y está enganchado.
- send_audio: true → cuando el lead ya vio el vídeo (stage = video_enviado o follow_up_enviado) y está respondiendo positivamente, o cuando es Tipo 4 (quiere comprar directamente)
- send_calendly: true → siempre junto con send_audio: true o en el mensaje siguiente al audio
```

- [ ] **Step 2: Commit**

```bash
git add agencia/scripts/10-everglowface-setter-respondio/prompt-setter-naiara.txt
git commit -m "feat: add everglowface AI setter prompt"
```

---

## Task 2: Crear el workflow n8n completo

**Archivos:**
- Crear: `agencia/scripts/10-everglowface-setter-respondio/workflow-everglowface-setter.json`

- [ ] **Step 1: Crear el archivo JSON del workflow**

Crear `agencia/scripts/10-everglowface-setter-respondio/workflow-everglowface-setter.json` con este contenido:

```json
{
  "name": "EvergrowFace — AI Setter Instagram (respond.io + n8n)",
  "nodes": [
    {
      "id": "node-webhook",
      "name": "📥 respond.io Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [240, 300],
      "parameters": {
        "path": "everglowface",
        "responseMode": "responseNode",
        "httpMethod": "POST",
        "options": {}
      },
      "notes": "Recibe todos los eventos de respond.io. Configurar en respond.io: Settings → Webhooks → URL: https://TU-N8N/webhook/everglowface. Evento: message.created (solo mensajes entrantes)"
    },
    {
      "id": "node-respond-ok",
      "name": "✅ Responder 200 OK",
      "type": "n8n-nodes-base.respondToWebhook",
      "position": [460, 180],
      "parameters": {
        "respondWith": "text",
        "responseBody": "OK",
        "options": {}
      },
      "notes": "respond.io necesita 200 OK inmediato. Respondemos antes de procesar para no hacer timeout."
    },
    {
      "id": "node-filter-incoming",
      "name": "🔍 Solo mensajes entrantes",
      "type": "n8n-nodes-base.if",
      "position": [460, 420],
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": false,
            "leftValue": "",
            "typeValidation": "strict"
          },
          "conditions": [
            {
              "id": "cond-direction",
              "leftValue": "={{ $json.message.direction }}",
              "rightValue": "incoming",
              "operator": {
                "type": "string",
                "operation": "equals"
              }
            }
          ],
          "combinator": "and"
        }
      },
      "notes": "Filtra solo mensajes direction=incoming. Evita bucles infinitos cuando n8n envía mensajes via API y respond.io re-dispara el webhook."
    },
    {
      "id": "node-normalize",
      "name": "📋 Normalizar datos",
      "type": "n8n-nodes-base.set",
      "position": [680, 420],
      "parameters": {
        "mode": "manual",
        "duplicateItem": false,
        "assignments": {
          "assignments": [
            {
              "id": "assign-contact-id",
              "name": "contact_id",
              "value": "={{ $json.contact.id }}",
              "type": "string"
            },
            {
              "id": "assign-message-text",
              "name": "message_text",
              "value": "={{ $json.message.text || '' }}",
              "type": "string"
            },
            {
              "id": "assign-source",
              "name": "source",
              "value": "={{ $json.channel.type || 'direct_dm' }}",
              "type": "string"
            },
            {
              "id": "assign-first-name",
              "name": "contact_name",
              "value": "={{ $json.contact.firstName || '' }}",
              "type": "string"
            },
            {
              "id": "assign-conversation-id",
              "name": "conversation_id",
              "value": "={{ $json.conversation.id || '' }}",
              "type": "string"
            }
          ]
        },
        "options": {}
      },
      "notes": "Extrae y normaliza los campos clave del payload de respond.io para usarlos en nodos posteriores sin repetir expresiones largas."
    },
    {
      "id": "node-get-contact",
      "name": "📖 Leer contacto (respond.io)",
      "type": "n8n-nodes-base.httpRequest",
      "position": [900, 420],
      "parameters": {
        "method": "GET",
        "url": "=https://api.respond.io/v2/contact/{{ $json.contact_id }}",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $env.RESPOND_IO_API_KEY }}"
            }
          ]
        },
        "options": {
          "response": {
            "response": {
              "neverError": true
            }
          }
        }
      },
      "notes": "GET del contacto en respond.io. Trae lifecycle_stage, lead_temperature, main_problem, conversation_history y conversation_summary de los custom fields. neverError=true para manejar 404 (contacto nuevo) sin romper el flujo."
    },
    {
      "id": "node-contact-exists",
      "name": "🔀 ¿Contacto existe?",
      "type": "n8n-nodes-base.if",
      "position": [1120, 420],
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": false,
            "leftValue": "",
            "typeValidation": "strict"
          },
          "conditions": [
            {
              "id": "cond-exists",
              "leftValue": "={{ $json.data?.id }}",
              "rightValue": "",
              "operator": {
                "type": "string",
                "operation": "isNotEmpty"
              }
            }
          ],
          "combinator": "and"
        }
      },
      "notes": "Si el contacto existe en respond.io (tiene ID), usa sus datos. Si no existe (primer mensaje), inicializa valores por defecto."
    },
    {
      "id": "node-existing-contact-data",
      "name": "✅ Datos de contacto existente",
      "type": "n8n-nodes-base.set",
      "position": [1340, 300],
      "parameters": {
        "mode": "manual",
        "duplicateItem": false,
        "assignments": {
          "assignments": [
            {
              "id": "assign-stage",
              "name": "lifecycle_stage",
              "value": "={{ $json.data.customFields?.lifecycle_stage || 'nuevo_lead' }}",
              "type": "string"
            },
            {
              "id": "assign-temp",
              "name": "lead_temperature",
              "value": "={{ $json.data.customFields?.lead_temperature || 'frio' }}",
              "type": "string"
            },
            {
              "id": "assign-problem",
              "name": "main_problem",
              "value": "={{ $json.data.customFields?.main_problem || '' }}",
              "type": "string"
            },
            {
              "id": "assign-entry",
              "name": "entry_type",
              "value": "={{ $json.data.customFields?.entry_type || '' }}",
              "type": "string"
            },
            {
              "id": "assign-history",
              "name": "conversation_history",
              "value": "={{ $json.data.customFields?.conversation_history || '[]' }}",
              "type": "string"
            },
            {
              "id": "assign-summary",
              "name": "conversation_summary",
              "value": "={{ $json.data.customFields?.conversation_summary || '' }}",
              "type": "string"
            }
          ]
        },
        "options": {}
      },
      "notes": "Extrae los custom fields del contacto existente. Si alguno no existe aún, usa valores por defecto seguros."
    },
    {
      "id": "node-new-contact-data",
      "name": "🆕 Inicializar contacto nuevo",
      "type": "n8n-nodes-base.set",
      "position": [1340, 540],
      "parameters": {
        "mode": "manual",
        "duplicateItem": false,
        "assignments": {
          "assignments": [
            {
              "id": "assign-stage-new",
              "name": "lifecycle_stage",
              "value": "nuevo_lead",
              "type": "string"
            },
            {
              "id": "assign-temp-new",
              "name": "lead_temperature",
              "value": "frio",
              "type": "string"
            },
            {
              "id": "assign-problem-new",
              "name": "main_problem",
              "value": "",
              "type": "string"
            },
            {
              "id": "assign-entry-new",
              "name": "entry_type",
              "value": "",
              "type": "string"
            },
            {
              "id": "assign-history-new",
              "name": "conversation_history",
              "value": "[]",
              "type": "string"
            },
            {
              "id": "assign-summary-new",
              "name": "conversation_summary",
              "value": "",
              "type": "string"
            }
          ]
        },
        "options": {}
      },
      "notes": "Para leads nuevos: inicializa todos los campos de estado en sus valores por defecto."
    },
    {
      "id": "node-merge-contact",
      "name": "🔗 Unir datos contacto",
      "type": "n8n-nodes-base.merge",
      "position": [1560, 420],
      "parameters": {
        "mode": "chooseBranch",
        "chooseBranch": {
          "mode": "waitForBoth"
        }
      },
      "notes": "Une las dos ramas (contacto existente y contacto nuevo) para que el flujo continúe con un único set de datos."
    },
    {
      "id": "node-entry-classifier",
      "name": "🔀 Clasificar tipo de entrada",
      "type": "n8n-nodes-base.switch",
      "position": [1780, 420],
      "parameters": {
        "mode": "rules",
        "rules": {
          "rules": [
            {
              "conditions": {
                "options": { "caseSensitive": false },
                "conditions": [
                  {
                    "leftValue": "={{ $('📋 Normalizar datos').item.json.lifecycle_stage }}",
                    "rightValue": "nuevo_lead",
                    "operator": { "type": "string", "operation": "notEquals" }
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "conversacion_activa"
            },
            {
              "conditions": {
                "options": { "caseSensitive": false },
                "conditions": [
                  {
                    "leftValue": "={{ $('📋 Normalizar datos').item.json.message_text.toLowerCase() }}",
                    "rightValue": "quiero",
                    "operator": { "type": "string", "operation": "contains" }
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "tipo_1_keyword"
            },
            {
              "conditions": {
                "options": { "caseSensitive": false },
                "conditions": [
                  {
                    "leftValue": "={{ $('✅ Datos de contacto existente').item.json.entry_type || $('🆕 Inicializar contacto nuevo').item.json.entry_type }}",
                    "rightValue": "lead_magnet",
                    "operator": { "type": "string", "operation": "equals" }
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "tipo_2_lead_magnet"
            },
            {
              "conditions": {
                "options": { "caseSensitive": false },
                "conditions": [
                  {
                    "leftValue": "={{ $('📋 Normalizar datos').item.json.message_text.toLowerCase() }}",
                    "rightValue": "precio|curso|comprar|cómo funciona|que incluye|cuánto",
                    "operator": { "type": "regex", "operation": "regex" }
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "tipo_4_quiere_comprar"
            }
          ],
          "fallbackOutput": "tipo_3_catch_all"
        }
      },
      "notes": "Clasifica el tipo de entrada del lead. PRIORIDAD: 1) Si ya tiene conversación activa → continúa donde estaba. 2) Si dice 'quiero' → Tipo 1. 3) Si es lead magnet → Tipo 2. 4) Si pregunta por precio/curso → Tipo 4. 5) Cualquier otra cosa → Tipo 3 (catch-all, el más común)."
    },
    {
      "id": "node-build-context",
      "name": "🧠 Construir contexto IA",
      "type": "n8n-nodes-base.code",
      "position": [2000, 420],
      "parameters": {
        "jsCode": "// Reúne todos los datos necesarios para el AI Agent\nconst normalData = $('📋 Normalizar datos').item.json;\nconst contactData = items[0].json;\n\n// Parsear historial de conversación\nlet history = [];\ntry {\n  history = JSON.parse(contactData.conversation_history || '[]');\n} catch(e) {\n  history = [];\n}\n\n// Añadir el mensaje actual al historial\nhistory.push({\n  role: 'user',\n  content: normalData.message_text,\n  timestamp: new Date().toISOString()\n});\n\n// Mantener solo los últimos 10 mensajes para no saturar el contexto\nif (history.length > 10) {\n  history = history.slice(-10);\n}\n\n// Determinar entry_type del output del classifier\nconst switchOutput = $('🔀 Clasificar tipo de entrada').item.json;\nlet entry_type = contactData.entry_type || '3';\nif (!entry_type || entry_type === '') {\n  // Inferir del clasificador si es nuevo lead\n  const outputName = Object.keys(switchOutput)[0] || 'tipo_3_catch_all';\n  if (outputName.includes('tipo_1')) entry_type = '1';\n  else if (outputName.includes('tipo_2')) entry_type = '2';\n  else if (outputName.includes('tipo_4')) entry_type = '4';\n  else entry_type = '3';\n}\n\nreturn [{\n  json: {\n    contact_id: normalData.contact_id,\n    contact_name: normalData.contact_name,\n    message_text: normalData.message_text,\n    source: normalData.source,\n    conversation_id: normalData.conversation_id,\n    lifecycle_stage: contactData.lifecycle_stage,\n    lead_temperature: contactData.lead_temperature,\n    main_problem: contactData.main_problem,\n    entry_type: entry_type,\n    conversation_history: history,\n    conversation_history_str: JSON.stringify(history),\n    conversation_summary: contactData.conversation_summary\n  }\n}];"
      },
      "notes": "Consolida todos los datos en un único objeto limpio para pasar al AI Agent. Parsea el historial JSON, añade el mensaje actual, trunca a 10 mensajes máximo, e infiere el entry_type si es un lead nuevo."
    },
    {
      "id": "node-ai-setter",
      "name": "🤖 AI Setter (OpenAI)",
      "type": "n8n-nodes-base.httpRequest",
      "position": [2220, 420],
      "parameters": {
        "method": "POST",
        "url": "https://api.openai.com/v1/chat/completions",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $env.OPENAI_API_KEY }}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "contentType": "json",
        "body": {
          "model": "gpt-4o",
          "temperature": 0.7,
          "response_format": { "type": "json_object" },
          "messages": [
            {
              "role": "system",
              "content": "={{ $env.SETTER_PROMPT || 'Eres el setter de ventas de Naiara (@everglowface). CONTEXTO DEL LEAD: Nombre: ' + $json.contact_name + ' | Etapa actual: ' + $json.lifecycle_stage + ' | Temperatura: ' + $json.lead_temperature + ' | Problema detectado: ' + ($json.main_problem || 'no detectado aún') + ' | Tipo de entrada: ' + $json.entry_type + ' | Resumen conversación: ' + ($json.conversation_summary || 'primer contacto') + '. Responde SIEMPRE con JSON válido siguiendo el formato del prompt.' }}"
            },
            {
              "role": "user",
              "content": "={{ 'HISTORIAL DE CONVERSACIÓN:\\n' + $json.conversation_history.map(m => m.role + ': ' + m.content).join('\\n') + '\\n\\nMENSAJE ACTUAL DEL LEAD: ' + $json.message_text + '\\n\\nResponde con el JSON estructurado.' }}"
            }
          ]
        }
      },
      "notes": "Llama a GPT-4o con el prompt completo del setter + contexto del lead. Usa response_format json_object para garantizar que la respuesta es JSON válido parseable. La temperatura 0.7 da naturalidad sin demasiada aleatoriedad.\n\nIMPORTANTE: Para producción, sustituir el system prompt inline por la variable $env.SETTER_PROMPT que debe contener el contenido completo del archivo prompt-setter-naiara.txt"
    },
    {
      "id": "node-parse-ai",
      "name": "📊 Parsear respuesta IA",
      "type": "n8n-nodes-base.code",
      "position": [2440, 420],
      "parameters": {
        "jsCode": "// Parsea la respuesta JSON del AI y la combina con el contexto\nconst aiRaw = items[0].json.choices[0].message.content;\nconst contextData = $('🧠 Construir contexto IA').item.json;\n\nlet aiResponse;\ntry {\n  aiResponse = JSON.parse(aiRaw);\n} catch(e) {\n  // Fallback si el AI no devuelve JSON válido\n  aiResponse = {\n    messages: [aiRaw],\n    send_video: false,\n    send_audio: false,\n    send_calendly: false,\n    new_stage: contextData.lifecycle_stage,\n    new_temperature: contextData.lead_temperature,\n    detected_problem: contextData.main_problem,\n    conversation_summary: contextData.conversation_summary\n  };\n}\n\n// Actualizar historial con la respuesta del bot\nlet history = contextData.conversation_history || [];\nconst botMessages = aiResponse.messages || [];\nbotMessages.forEach(msg => {\n  history.push({\n    role: 'assistant',\n    content: msg,\n    timestamp: new Date().toISOString()\n  });\n});\nif (history.length > 10) history = history.slice(-10);\n\nreturn [{\n  json: {\n    // Datos del contexto original\n    contact_id: contextData.contact_id,\n    contact_name: contextData.contact_name,\n    conversation_id: contextData.conversation_id,\n    entry_type: contextData.entry_type,\n    // Respuesta del AI\n    messages: aiResponse.messages || [],\n    send_video: aiResponse.send_video || false,\n    send_audio: aiResponse.send_audio || false,\n    send_calendly: aiResponse.send_calendly || false,\n    // Nuevo estado\n    new_stage: aiResponse.new_stage || contextData.lifecycle_stage,\n    new_temperature: aiResponse.new_temperature || contextData.lead_temperature,\n    detected_problem: aiResponse.detected_problem || contextData.main_problem,\n    conversation_summary: aiResponse.conversation_summary || contextData.conversation_summary,\n    // Historial actualizado\n    updated_history: JSON.stringify(history)\n  }\n}];"
      },
      "notes": "Parsea el JSON devuelto por el AI. Si el parsing falla (raro con response_format json_object), usa el texto como mensaje directo. Actualiza el historial añadiendo los mensajes del bot. Prepara el objeto final con todo lo necesario para los nodos de envío y actualización."
    },
    {
      "id": "node-send-messages",
      "name": "💬 Enviar mensajes de texto",
      "type": "n8n-nodes-base.code",
      "position": [2660, 420],
      "parameters": {
        "jsCode": "// Envía cada mensaje del array con delay entre ellos\nconst data = items[0].json;\nconst messages = data.messages || [];\nconst contactId = data.contact_id;\nconst channelId = process.env.RESPOND_IO_CHANNEL_ID;\nconst apiKey = process.env.RESPOND_IO_API_KEY;\n\nconst results = [];\n\nfor (let i = 0; i < messages.length; i++) {\n  const msg = messages[i];\n  if (!msg || msg.trim() === '') continue;\n  \n  // Delay entre mensajes para simular escritura natural (1.5s por mensaje)\n  if (i > 0) {\n    await new Promise(r => setTimeout(r, 1500));\n  }\n  \n  try {\n    const response = await $helpers.httpRequest({\n      method: 'POST',\n      url: `https://api.respond.io/v2/contact/${contactId}/message`,\n      headers: {\n        'Authorization': `Bearer ${apiKey}`,\n        'Content-Type': 'application/json'\n      },\n      body: JSON.stringify({\n        channelId: channelId,\n        message: {\n          type: 'text',\n          text: msg\n        }\n      })\n    });\n    results.push({ success: true, message: msg });\n  } catch(e) {\n    results.push({ success: false, message: msg, error: e.message });\n  }\n}\n\nreturn [{ json: { ...data, message_results: results } }];"
      },
      "notes": "Envía cada mensaje del array messages[] a respond.io via API. Añade 1.5 segundos de delay entre mensajes para simular escritura natural (evita que lleguen todos a la vez).\n\nEl channelId debe ser el ID del canal Instagram configurado en respond.io (Settings → Channels)."
    },
    {
      "id": "node-check-video",
      "name": "🎥 ¿Enviar vídeo?",
      "type": "n8n-nodes-base.if",
      "position": [2880, 300],
      "parameters": {
        "conditions": {
          "options": { "caseSensitive": false },
          "conditions": [
            {
              "leftValue": "={{ $json.send_video }}",
              "rightValue": true,
              "operator": { "type": "boolean", "operation": "true" }
            }
          ],
          "combinator": "and"
        }
      },
      "notes": "Comprueba si el AI decidió que es momento de enviar el vídeo de valor."
    },
    {
      "id": "node-send-video",
      "name": "🎬 Enviar vídeo de valor",
      "type": "n8n-nodes-base.httpRequest",
      "position": [3100, 200],
      "parameters": {
        "method": "POST",
        "url": "=https://api.respond.io/v2/contact/{{ $json.contact_id }}/message",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $env.RESPOND_IO_API_KEY }}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "contentType": "json",
        "body": {
          "channelId": "={{ $env.RESPOND_IO_CHANNEL_ID }}",
          "message": {
            "type": "text",
            "text": "={{ 'Te lo paso, peeero no lo suelo mandar a todo el mundo porque explico bastante bien cómo trabajo 😊 Míralo y me cuentas\\n\\n' + $env.VIDEO_URL }}"
          }
        }
      },
      "notes": "Envía el vídeo de valor como mensaje de texto con la URL. El mensaje incluye el texto de contexto del prompt de Naiara antes del link."
    },
    {
      "id": "node-check-audio",
      "name": "🎙️ ¿Enviar audio?",
      "type": "n8n-nodes-base.if",
      "position": [2880, 540],
      "parameters": {
        "conditions": {
          "options": { "caseSensitive": false },
          "conditions": [
            {
              "leftValue": "={{ $json.send_audio }}",
              "rightValue": true,
              "operator": { "type": "boolean", "operation": "true" }
            }
          ],
          "combinator": "and"
        }
      },
      "notes": "Comprueba si el AI decidió que es momento del cierre con audio (lead caliente, listo para llamada)."
    },
    {
      "id": "node-send-audio",
      "name": "🔊 Enviar audio pre-grabado",
      "type": "n8n-nodes-base.httpRequest",
      "position": [3100, 440],
      "parameters": {
        "method": "POST",
        "url": "=https://api.respond.io/v2/contact/{{ $('📊 Parsear respuesta IA').item.json.contact_id }}/message",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $env.RESPOND_IO_API_KEY }}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "contentType": "json",
        "body": {
          "channelId": "={{ $env.RESPOND_IO_CHANNEL_ID }}",
          "message": {
            "type": "attachment",
            "attachment": {
              "type": "audio",
              "url": "={{ $env.AUDIO_URL }}"
            }
          }
        }
      },
      "notes": "Envía el audio pre-grabado de Naiara como attachment de tipo audio. El archivo debe estar en una URL pública (S3, Cloudflare R2, etc.). Formato recomendado: .ogg para WhatsApp/Instagram, .mp3 como fallback."
    },
    {
      "id": "node-check-calendly",
      "name": "📅 ¿Enviar Calendly?",
      "type": "n8n-nodes-base.if",
      "position": [3320, 440],
      "parameters": {
        "conditions": {
          "options": { "caseSensitive": false },
          "conditions": [
            {
              "leftValue": "={{ $('📊 Parsear respuesta IA').item.json.send_calendly }}",
              "rightValue": true,
              "operator": { "type": "boolean", "operation": "true" }
            }
          ],
          "combinator": "and"
        }
      },
      "notes": "Comprueba si se debe enviar el link de Calendly para agendar la llamada."
    },
    {
      "id": "node-send-calendly",
      "name": "📆 Enviar link Calendly",
      "type": "n8n-nodes-base.httpRequest",
      "position": [3540, 340],
      "parameters": {
        "method": "POST",
        "url": "=https://api.respond.io/v2/contact/{{ $('📊 Parsear respuesta IA').item.json.contact_id }}/message",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $env.RESPOND_IO_API_KEY }}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "contentType": "json",
        "body": {
          "channelId": "={{ $env.RESPOND_IO_CHANNEL_ID }}",
          "message": {
            "type": "text",
            "text": "={{ '¿Quieres que te pase enlace para agendar? 🙌\\n\\n' + $env.CALENDLY_LINK }}"
          }
        }
      },
      "notes": "Envía el link de Calendly de Naiara. Se envía siempre junto con o justo después del audio de cierre."
    },
    {
      "id": "node-update-contact",
      "name": "💾 Actualizar contacto (respond.io)",
      "type": "n8n-nodes-base.httpRequest",
      "position": [3760, 420],
      "parameters": {
        "method": "PATCH",
        "url": "=https://api.respond.io/v2/contact/{{ $('📊 Parsear respuesta IA').item.json.contact_id }}",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $env.RESPOND_IO_API_KEY }}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "contentType": "json",
        "body": {
          "customFields": {
            "lifecycle_stage": "={{ $('📊 Parsear respuesta IA').item.json.send_video ? 'video_enviado' : $('📊 Parsear respuesta IA').item.json.send_audio ? 'cualificado' : $('📊 Parsear respuesta IA').item.json.new_stage }}",
            "lead_temperature": "={{ $('📊 Parsear respuesta IA').item.json.new_temperature }}",
            "main_problem": "={{ $('📊 Parsear respuesta IA').item.json.detected_problem }}",
            "entry_type": "={{ $('📊 Parsear respuesta IA').item.json.entry_type }}",
            "conversation_history": "={{ $('📊 Parsear respuesta IA').item.json.updated_history }}",
            "conversation_summary": "={{ $('📊 Parsear respuesta IA').item.json.conversation_summary }}"
          }
        }
      },
      "notes": "Actualiza los custom fields del contacto en respond.io con el nuevo estado. Si se envió vídeo → stage = video_enviado. Si se envió audio → stage = cualificado. Si no → usa el stage que determinó el AI.\n\nEsto mantiene respond.io como CRM real donde Naiara puede ver el estado de cada lead desde el dashboard."
    },
    {
      "id": "node-wait-video-followup",
      "name": "⏰ Esperar 2h (follow-up vídeo)",
      "type": "n8n-nodes-base.wait",
      "position": [3980, 200],
      "parameters": {
        "resume": "timeInterval",
        "unit": "hours",
        "amount": 2
      },
      "notes": "Solo se activa si send_video=true. Espera 2 horas para comprobar si el lead respondió al vídeo. Si no respondió, envía el follow-up. n8n persiste el estado del Wait incluso si se reinicia."
    },
    {
      "id": "node-check-responded",
      "name": "🔍 ¿Respondió tras el vídeo?",
      "type": "n8n-nodes-base.httpRequest",
      "position": [4200, 200],
      "parameters": {
        "method": "GET",
        "url": "=https://api.respond.io/v2/contact/{{ $('📊 Parsear respuesta IA').item.json.contact_id }}",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $env.RESPOND_IO_API_KEY }}"
            }
          ]
        },
        "options": {
          "response": {
            "response": {
              "neverError": true
            }
          }
        }
      },
      "notes": "Re-lee el contacto de respond.io tras las 2h de espera para comprobar si el lifecycle_stage cambió (señal de que respondió y el flujo continuó)."
    },
    {
      "id": "node-still-waiting",
      "name": "😶 ¿Sigue sin responder?",
      "type": "n8n-nodes-base.if",
      "position": [4420, 200],
      "parameters": {
        "conditions": {
          "options": { "caseSensitive": false },
          "conditions": [
            {
              "leftValue": "={{ $json.data?.customFields?.lifecycle_stage }}",
              "rightValue": "video_enviado",
              "operator": { "type": "string", "operation": "equals" }
            }
          ],
          "combinator": "and"
        }
      },
      "notes": "Si el stage sigue siendo 'video_enviado' después de 2h, el lead no respondió → enviar follow-up. Si el stage cambió (en_conversacion, cualificado, etc.) → ya respondió, no hacer nada."
    },
    {
      "id": "node-send-followup",
      "name": "👋 Enviar follow-up 2h",
      "type": "n8n-nodes-base.httpRequest",
      "position": [4640, 100],
      "parameters": {
        "method": "POST",
        "url": "=https://api.respond.io/v2/contact/{{ $('📊 Parsear respuesta IA').item.json.contact_id }}/message",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $env.RESPOND_IO_API_KEY }}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "contentType": "json",
        "body": {
          "channelId": "={{ $env.RESPOND_IO_CHANNEL_ID }}",
          "message": {
            "type": "text",
            "text": "¿Holaaa 👋, qué te ha parecido??"
          }
        }
      },
      "notes": "Follow-up automático 2h después de enviar el vídeo si el lead no respondió. Mensaje corto y casual, exactamente como indica el prompt de Naiara."
    },
    {
      "id": "node-update-followup-stage",
      "name": "💾 Actualizar stage → follow_up_enviado",
      "type": "n8n-nodes-base.httpRequest",
      "position": [4860, 100],
      "parameters": {
        "method": "PATCH",
        "url": "=https://api.respond.io/v2/contact/{{ $('📊 Parsear respuesta IA').item.json.contact_id }}",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $env.RESPOND_IO_API_KEY }}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "contentType": "json",
        "body": {
          "customFields": {
            "lifecycle_stage": "follow_up_enviado"
          }
        }
      },
      "notes": "Actualiza el stage a follow_up_enviado para que si el lead responde ahora, el AI sepa que ya vio el vídeo y está en fase de cierre."
    },
    {
      "id": "node-end-no-response",
      "name": "🔕 No action (ya respondió)",
      "type": "n8n-nodes-base.noOp",
      "position": [4640, 300],
      "notes": "El lead ya respondió tras el vídeo. El flujo normal (nuevo webhook) ya se encargó de continuar la conversación. No hay nada que hacer aquí."
    }
  ],
  "connections": {
    "📥 respond.io Webhook": {
      "main": [
        [
          { "node": "✅ Responder 200 OK", "type": "main", "index": 0 },
          { "node": "🔍 Solo mensajes entrantes", "type": "main", "index": 0 }
        ]
      ]
    },
    "🔍 Solo mensajes entrantes": {
      "main": [
        [{ "node": "📋 Normalizar datos", "type": "main", "index": 0 }],
        []
      ]
    },
    "📋 Normalizar datos": {
      "main": [
        [{ "node": "📖 Leer contacto (respond.io)", "type": "main", "index": 0 }]
      ]
    },
    "📖 Leer contacto (respond.io)": {
      "main": [
        [{ "node": "🔀 ¿Contacto existe?", "type": "main", "index": 0 }]
      ]
    },
    "🔀 ¿Contacto existe?": {
      "main": [
        [{ "node": "✅ Datos de contacto existente", "type": "main", "index": 0 }],
        [{ "node": "🆕 Inicializar contacto nuevo", "type": "main", "index": 0 }]
      ]
    },
    "✅ Datos de contacto existente": {
      "main": [
        [{ "node": "🔗 Unir datos contacto", "type": "main", "index": 0 }]
      ]
    },
    "🆕 Inicializar contacto nuevo": {
      "main": [
        [{ "node": "🔗 Unir datos contacto", "type": "main", "index": 1 }]
      ]
    },
    "🔗 Unir datos contacto": {
      "main": [
        [{ "node": "🔀 Clasificar tipo de entrada", "type": "main", "index": 0 }]
      ]
    },
    "🔀 Clasificar tipo de entrada": {
      "main": [
        [{ "node": "🧠 Construir contexto IA", "type": "main", "index": 0 }],
        [{ "node": "🧠 Construir contexto IA", "type": "main", "index": 0 }],
        [{ "node": "🧠 Construir contexto IA", "type": "main", "index": 0 }],
        [{ "node": "🧠 Construir contexto IA", "type": "main", "index": 0 }],
        [{ "node": "🧠 Construir contexto IA", "type": "main", "index": 0 }]
      ]
    },
    "🧠 Construir contexto IA": {
      "main": [
        [{ "node": "🤖 AI Setter (OpenAI)", "type": "main", "index": 0 }]
      ]
    },
    "🤖 AI Setter (OpenAI)": {
      "main": [
        [{ "node": "📊 Parsear respuesta IA", "type": "main", "index": 0 }]
      ]
    },
    "📊 Parsear respuesta IA": {
      "main": [
        [{ "node": "💬 Enviar mensajes de texto", "type": "main", "index": 0 }]
      ]
    },
    "💬 Enviar mensajes de texto": {
      "main": [
        [
          { "node": "🎥 ¿Enviar vídeo?", "type": "main", "index": 0 },
          { "node": "🎙️ ¿Enviar audio?", "type": "main", "index": 0 }
        ]
      ]
    },
    "🎥 ¿Enviar vídeo?": {
      "main": [
        [{ "node": "🎬 Enviar vídeo de valor", "type": "main", "index": 0 }],
        []
      ]
    },
    "🎬 Enviar vídeo de valor": {
      "main": [
        [
          { "node": "💾 Actualizar contacto (respond.io)", "type": "main", "index": 0 },
          { "node": "⏰ Esperar 2h (follow-up vídeo)", "type": "main", "index": 0 }
        ]
      ]
    },
    "🎙️ ¿Enviar audio?": {
      "main": [
        [{ "node": "🔊 Enviar audio pre-grabado", "type": "main", "index": 0 }],
        [{ "node": "💾 Actualizar contacto (respond.io)", "type": "main", "index": 0 }]
      ]
    },
    "🔊 Enviar audio pre-grabado": {
      "main": [
        [{ "node": "📅 ¿Enviar Calendly?", "type": "main", "index": 0 }]
      ]
    },
    "📅 ¿Enviar Calendly?": {
      "main": [
        [{ "node": "📆 Enviar link Calendly", "type": "main", "index": 0 }],
        [{ "node": "💾 Actualizar contacto (respond.io)", "type": "main", "index": 0 }]
      ]
    },
    "📆 Enviar link Calendly": {
      "main": [
        [{ "node": "💾 Actualizar contacto (respond.io)", "type": "main", "index": 0 }]
      ]
    },
    "⏰ Esperar 2h (follow-up vídeo)": {
      "main": [
        [{ "node": "🔍 ¿Respondió tras el vídeo?", "type": "main", "index": 0 }]
      ]
    },
    "🔍 ¿Respondió tras el vídeo?": {
      "main": [
        [{ "node": "😶 ¿Sigue sin responder?", "type": "main", "index": 0 }]
      ]
    },
    "😶 ¿Sigue sin responder?": {
      "main": [
        [{ "node": "👋 Enviar follow-up 2h", "type": "main", "index": 0 }],
        [{ "node": "🔕 No action (ya respondió)", "type": "main", "index": 0 }]
      ]
    },
    "👋 Enviar follow-up 2h": {
      "main": [
        [{ "node": "💾 Actualizar stage → follow_up_enviado", "type": "main", "index": 0 }]
      ]
    }
  },
  "settings": {
    "executionOrder": "v1",
    "saveManualExecutions": true,
    "callerPolicy": "workflowsFromSameOwner",
    "errorWorkflow": ""
  },
  "tags": ["instagram", "respond.io", "setter", "everglowface", "ventas"],
  "pinData": {}
}
```

- [ ] **Step 2: Commit el workflow**

```bash
git add agencia/scripts/10-everglowface-setter-respondio/workflow-everglowface-setter.json
git commit -m "feat: add everglowface AI setter n8n workflow (respond.io + Instagram DMs)"
```

---

## Task 3: Verificación e instrucciones de activación

- [ ] **Step 1: Verificar estructura de archivos creados**

```bash
ls agencia/scripts/10-everglowface-setter-respondio/
```

Esperado:
```
prompt-setter-naiara.txt
workflow-everglowface-setter.json
```

- [ ] **Step 2: Pasos de activación en n8n**

1. Ir a n8n → Import Workflow → pegar el JSON
2. Configurar variables de entorno en n8n (Settings → Environment Variables):
   ```
   RESPOND_IO_API_KEY
   RESPOND_IO_CHANNEL_ID
   OPENAI_API_KEY
   CALENDLY_LINK
   VIDEO_URL
   AUDIO_URL
   SETTER_PROMPT  (contenido completo del archivo prompt-setter-naiara.txt)
   ```
3. Activar el workflow
4. Copiar la URL del webhook: `https://TU-N8N/webhook/everglowface`

- [ ] **Step 3: Pasos de activación en respond.io**

1. Ir a respond.io → Settings → Webhooks
2. Crear nuevo webhook con la URL de n8n
3. Evento a escuchar: `message.created`
4. Crear los 6 custom fields en Settings → Custom Fields:
   - `lifecycle_stage` (Text)
   - `lead_temperature` (Text)
   - `main_problem` (Text)
   - `entry_type` (Text)
   - `conversation_history` (Long Text)
   - `conversation_summary` (Long Text)
5. Copiar el Channel ID del canal Instagram (Settings → Channels → Instagram → ID)

- [ ] **Step 4: Commit final**

```bash
git add .
git commit -m "feat: complete everglowface setter setup — workflow + prompt + docs"
```
