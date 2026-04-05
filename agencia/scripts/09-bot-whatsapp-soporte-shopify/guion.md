# Video 09: Bot de WhatsApp para tu tienda Shopify con n8n (soporte automático 24/7)

## Metadatos SEO

**Título:** `Bot de WhatsApp para tu tienda Shopify con n8n: automatiza el soporte al cliente (24/7)`
**Duración estimada:** 7 minutos
**Tags:** n8n whatsapp bot, automatización shopify, chatbot whatsapp negocio, agente ia n8n, n8n tutorial español, soporte automatico ecommerce
**Thumbnail idea:** esquema del flujo (cliente → WhatsApp → bot → respuesta) + texto "0 respuestas manuales"

---

## Estructura

### [GANCHO — 0:00-0:20]

*Pantalla: conversación de WhatsApp con cliente respondida en 4 segundos*

"Tu tienda recibe mensajes de WhatsApp todo el día. ¿Tenéis esto en stock? ¿Cuánto tarda el envío? ¿Puedo devolver si no me gusta?"

"Hoy te enseño a montar un bot con n8n que responde el 90% de esas preguntas automáticamente, en menos de 5 segundos, sin que toques el teléfono."

---

### [EL PROBLEMA — 0:20-1:00]

"El problema más común en tiendas pequeñas: el dueño pasa horas al día contestando siempre las mismas preguntas."

"60, 80, 100 mensajes diarios. La mayoría son preguntas que ya están respondidas en la web. Pero el cliente no las busca — prefiere preguntar por WhatsApp."

"Y mientras el dueño tarda en contestar — porque tiene una tienda que gestionar — ese cliente se va a la competencia."

*Dato en pantalla: 'El 78% de compradores online espera respuesta en menos de 1 hora'*

"Hay una solución sencilla. Y no necesitas saber programar."

---

### [EL SISTEMA — 1:00-2:30]

"Lo que vamos a montar es esto."

*Pantalla: diagrama del flujo en n8n*

"Twilio recibe el mensaje de WhatsApp. n8n lo procesa. Un agente de IA analiza el mensaje contra el inventario de la tienda — stock, precios, políticas de envío y devoluciones. Y responde automáticamente."

"Si la IA no sabe contestar — una queja compleja, una devolución — le manda un aviso al dueño con el contexto completo. Solo en ese caso interviene él."

*Mostrar el flujo en n8n: webhook → extracción → agente IA → condición → respuesta*

"El agente tiene tres partes: quién es, qué puede hacer, y el catálogo completo de la tienda como contexto. Las respuestas son cortas — 3 o 4 líneas máximo. Tono cercano, como si fuera alguien del equipo."

---

### [EL WORKFLOW PASO A PASO — 2:30-5:00]

**Paso 1 — Configurar Twilio**

"Twilio es el puente entre WhatsApp y n8n. Tienen sandbox gratuito para probar. Cuando pasáis a producción, el número de WhatsApp Business cuesta unos 45€/mes."

*Mostrar configuración del webhook en Twilio apuntando a n8n*

**Paso 2 — El nodo de extracción**

"El primer nodo en n8n extrae el número de teléfono y el texto del mensaje del payload de Twilio."

*Mostrar el código del nodo*

**Paso 3 — El inventario**

"Esto es el 80% del trabajo real: preparar el JSON con la información de la tienda. Productos, variantes, precios, stock, política de envío, política de devoluciones."

"Podéis guardarlo como archivo en el servidor de n8n, o mejor: conectarlo directamente a la API de Shopify para que el stock sea siempre en tiempo real."

*Mostrar estructura del JSON del inventario*

**Paso 4 — El agente IA**

"El agente usa GPT-4o. El system prompt le dice quién es, le da las reglas — máximo 4 líneas, nunca inventar datos, si no sabe decir que va a consultar — y recibe el inventario completo como contexto."

*Mostrar el system prompt en n8n*

**Paso 5 — El escalado**

"Una condición simple: si la respuesta contiene la frase 'voy a consultarlo', n8n lo detecta y manda un WhatsApp al dueño con el nombre del cliente y su pregunta. Así solo interviene cuando es necesario."

---

### [COSTE Y ALTERNATIVAS — 5:00-6:00]

"Coste aproximado para una tienda mediana:"
- Twilio: ~45€/mes (número WhatsApp Business)
- n8n cloud: desde 20€/mes
- GPT-4o: variable según volumen, normalmente 5-15€/mes para una tienda normal
- **Total: unos 70-80€/mes**

"Alternativas si queréis reducir coste:"
- n8n self-hosted: gratis (solo pagas el servidor, unos 5-10€/mes en Railway o Render)
- En lugar de GPT-4, podéis usar Claude Haiku — más barato y muy bueno para este tipo de tareas

"¿Vale la pena? Si el dueño recupera aunque sea 2 horas al día, sí."

---

### [CIERRE — 6:00-7:00]

"En la descripción tenéis el workflow completo de n8n para importar directamente, y la plantilla del JSON de inventario para adaptarla a vuestra tienda."

"La semana que viene: cómo añadirle memoria al bot para que recuerde conversaciones anteriores del mismo cliente. Completamente diferente la experiencia."

"Si esto te ha sido útil, dale like — me ayuda a saber qué tipo de contenido funciona. Nos vemos."

---

## Notas de producción

- Grabar pantalla con n8n abierto mostrando el flujo real (importar el workflow del video 06)
- Mostrar conversación de ejemplo en WhatsApp (usar sandbox de Twilio para demo en vivo)
- El JSON de inventario puede ser el inventario-velites.json ya creado
- Diferenciador vs video 06: este es tutorial paso a paso de implementación; el 06 era demostración del agente en funcionamiento
