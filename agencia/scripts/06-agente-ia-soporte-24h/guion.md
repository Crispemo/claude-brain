# GUIÓN: "El Agente de IA con n8n que Responde a tus Clientes de Shopify 24/7"
> Duración estimada: 16-18 min | Tipo: Tutorial con caso práctico completo

---

## LA TIENDA FICTICIA — "BlueBana" (usar en el vídeo)
Tienda de ropa deportiva en Shopify. Ya tienes este nombre en un thumbnail anterior ("Claude Code analiza este eCommerce real — Blue Banana"). Podemos usar ese mismo contexto o crear una tienda ficticia parecida.

**Nombre:** Velites Sport (tienda de CrossFit — más específico y creíble)
- Productos: zapatillas, ropa de entrenamiento, accesorios CrossFit
- Preguntas frecuentes reales: tallas, tiempos de envío, política de devolución, compatibilidad de productos
- Inventario: ver archivo `inventario-velites.json`

---

## HOOK — Primeros 30 segundos

"Son las 2 de la mañana. Un cliente escribe a tu WhatsApp preguntando si tienes la zapatilla talla 43. Tú estás durmiendo. Normalmente esa venta se pierde. Con lo que voy a enseñarte hoy, el agente le responde en 10 segundos, le confirma si hay stock, le manda el link de compra, y si quiere devolver algo también lo gestiona. Todo automático. Y voy a montarlo en directo con una tienda real."

---

## ESTRUCTURA DEL VÍDEO

### BLOQUE 1 — El coste real de no tener soporte 24/7 (2 min)
- El 40% de las consultas de clientes en ecommerce ocurren fuera de horario laboral
- Tiempo de respuesta promedio sin automatización: 6-18 horas
- Cada hora sin respuesta = probabilidad de compra cae un 10%
- El cliente que no obtiene respuesta compra en Amazon
- **No hace falta un chatbot genérico y molesto. Hace falta un agente que conozca TU tienda.**

### BLOQUE 2 — Qué puede hacer este agente (2 min — mostrar demo)
Demo en vivo: escribir al WhatsApp de la tienda ficticia:
- "¿Tenéis las zapatillas Metcon talla 43?" → "Sí, tenemos 3 unidades. Aquí el link: [url]"
- "¿Cuánto tarda el envío a Barcelona?" → "Los pedidos a Barcelona llegan en 24-48h. El envío gratis a partir de 50€."
- "Quiero devolver algo" → "Sin problema. Te explico cómo: tienes 30 días, el proceso es [...]"
- "¿Qué me recomiendas para empezar CrossFit?" → Recomendación personalizada con productos del catálogo

### BLOQUE 3 — Cómo está construido (1 min — diagrama)
```
WhatsApp Business → n8n Webhook
→ Agente IA (Claude/GPT-4)
  → Herramienta 1: Buscar en inventario (JSON/Sheet)
  → Herramienta 2: Consultar política de envíos y devoluciones
  → Herramienta 3: Buscar pedido del cliente por email/nombre
→ Generar respuesta
→ Responder por WhatsApp
→ (Si urgente) Notificar al dueño
```

### BLOQUE 4 — Construcción paso a paso (10 min)

**Paso 1 — Recibir mensajes de WhatsApp (2 min)**
- WhatsApp Business API (Meta Cloud API) → webhook de n8n
- Alternativa más sencilla: Twilio WhatsApp → n8n
- Mostrar cómo configurar el webhook

**Paso 2 — El agente IA con herramientas (4 min)**
- Nodo `@n8n/n8n-nodes-langchain.agent`
- Configurar con OpenAI GPT-4 o Claude
- System prompt (ver abajo)
- Conectar herramientas:
  - Tool 1: Leer inventario (nodo que lee el JSON del inventario)
  - Tool 2: Leer FAQ/políticas (nodo que lee el documento de políticas)
  - Tool 3: Buscar pedidos (nodo Shopify que busca por email)

**System Prompt del agente:**
```
Eres el asistente de Velites Sport, tienda online de CrossFit.
Respondes en español, tono cercano y profesional. Siempre en 2-3 frases máximo.
Cuando no sepas algo, di "Voy a consultarlo con el equipo y te escribo enseguida."
Nunca inventes información de productos o precios.
Si el cliente quiere comprar, manda siempre el link directo al producto.
```

**Paso 3 — Responder por WhatsApp (1 min)**
- Nodo HTTP Request → WhatsApp API para enviar mensaje
- Formato: texto plano + link si corresponde

**Paso 4 — Escalado a humano (1 min)**
- Nodo IF: ¿el agente dijo "voy a consultarlo"?
- Si sí → notificación por WhatsApp al dueño con el mensaje del cliente

**Paso 5 — Memoria de conversación (2 min)**
- Nodo para guardar historial de la conversación (Redis o archivo en n8n)
- Que el agente recuerde lo que dijo antes en la misma conversación
- Mostrar ejemplo con 3 mensajes consecutivos

### BLOQUE 5 — Personalización y límites (1 min)
- El agente no puede hacer devoluciones él solo (explicar por qué está bien así)
- Se puede conectar a más fuentes: Google Sheets, Notion, Airtable
- Se puede añadir detección de idioma (responde en inglés si escriben en inglés)

### CTA
"El inventario de ejemplo, el workflow y el system prompt están en la descripción. Y si quieres que monte esto en tu tienda esta semana, escribeme por WhatsApp."

---

## DESCRIPCIÓN DEL VÍDEO
```
Un agente de IA que conoce tu catálogo, tus políticas y tus pedidos. Responde en WhatsApp 24/7 sin que tú hagas nada.

En este vídeo lo monto en directo con una tienda real, paso a paso con n8n.

⬇️ Descarga el workflow + inventario de ejemplo: [link]
📩 Lo montamos en tu tienda: wa.me/34643135603?text=Hola Cris!

#shopify #n8n #ia #agenteia #whatsapp #ecommerce #automatización
```
