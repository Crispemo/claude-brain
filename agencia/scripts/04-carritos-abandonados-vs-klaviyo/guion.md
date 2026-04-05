# GUIÓN: "Cómo n8n recupera carritos abandonados mejor que Klaviyo (y gratis)"
> Duración estimada: 14-16 min | Tipo: Tutorial comparativo con resultado | MUY TOP

---

## POR QUÉ ESTE VÍDEO ES CLAVE PARA EL CANAL
- Klaviyo es la herramienta más usada en Shopify para email marketing — todos la conocen
- "Gratis" es una palabra que genera clicks
- Tutorial práctico = demuestra que sabes hacerlo = credibilidad de agencia
- Los que buscan "alternativa a Klaviyo" son dueños de tienda con intención de cambiar → cliente ideal

**Título final:** "n8n recupera carritos abandonados mejor que Klaviyo (y es gratis)"
**Thumbnail:** Tú señalando hacia dos logos: n8n (verde, "GRATIS ✓") vs Klaviyo (tachado, "€€€ ✗") + texto "MISMO RESULTADO"

---

## HOOK — Primeros 30 segundos

"Klaviyo te cobra 150, 200, 300 euros al mes para recuperar carritos abandonados. Y funciona bien, sí. Pero lo que voy a enseñarte hoy hace exactamente lo mismo — email + WhatsApp + seguimiento automático — y te cuesta cero euros. Voy a mostrarte el workflow completo de n8n que tengo montado, y al final del vídeo lo puedes descargar e importar directamente en tu n8n. Vamos."

---

## ESTRUCTURA DEL VÍDEO

### BLOQUE 1 — El problema con los carritos abandonados (2 min)
- El 70% de los carritos en Shopify se abandonan. Es el porcentaje más estudiado del ecommerce
- Klaviyo lo recupera con: email a los 30 min + email a las 24h + email a los 3 días
- Tasa de recuperación típica: 5-15% de los carritos abandonados
- Coste: desde 45€/mes (plan básico) hasta 300€+ con volumen

**La pregunta que planta la semilla:** "¿Y si pudieras hacer eso mismo, añadirle WhatsApp, personalizarlo con IA, y no pagar nada?"

### BLOQUE 2 — Cómo funciona el sistema con n8n (1 min — resumen visual)
Mostrar el diagrama del workflow (imagen del JSON renderizado en n8n):
1. Shopify detecta carrito abandonado (webhook)
2. Espera 30 minutos
3. Comprueba si ya compró → si sí, para. Si no, continúa
4. Envía email personalizado con IA
5. Espera 2 horas
6. Envía WhatsApp si tiene número
7. Espera 24 horas
8. Segundo email + segundo WhatsApp si no compró
9. Para el flujo si compra en cualquier momento

### BLOQUE 3 — Configuración paso a paso en pantalla (8 min — el núcleo)

**Paso 1 — Conectar Shopify a n8n (1 min)**
- Nodo: Shopify Trigger → evento "Checkout Created"
- Mostrar dónde pegar el webhook URL en Shopify
- Settings > Notifications > Webhooks

**Paso 2 — Esperar 30 min y verificar compra (1 min)**
- Nodo Wait: 30 minutos
- Nodo Shopify: buscar si el checkout se completó (buscar por checkout ID)
- Nodo IF: ¿completó la compra? → Sí: terminar. No: continuar

**Paso 3 — Email personalizado con IA (2 min)**
- Nodo OpenAI: generar email personalizado con nombre del cliente y productos del carrito
- Prompt: "Escribe un email en español, tono cercano, para recuperar este carrito abandonado. Cliente: {{nombre}}. Productos: {{productos}}. Tienda: {{nombre_tienda}}. Sin ser agresivo, con una frase final preguntando si tuvo algún problema."
- Nodo Gmail/SMTP: enviar email
- Mostrar ejemplo de email generado

**Paso 4 — WhatsApp si tiene número (2 min)**
- Nodo IF: ¿tiene número de teléfono?
- Nodo HTTP Request → Twilio API o WhatsApp Business API
- Mensaje: más corto y directo que el email. "Hola {{nombre}}, vi que dejaste algo en tu carrito 🛒 ¿Puedo ayudarte con alguna duda?"
- Mostrar el mensaje que llega al móvil

**Paso 5 — Segunda ronda a las 24h (2 min)**
- Nodo Wait: 24 horas
- Misma verificación de compra
- Email con descuento (si quieres): "Te guardamos el carrito + 10% de descuento hasta mañana"
- WhatsApp: recordatorio final

### BLOQUE 4 — Comparativa con Klaviyo (2 min)
| | n8n | Klaviyo |
|---|---|---|
| Coste | 0€ (self-hosted) o 20€/mes (cloud) | 45-300€/mes |
| Email recovery | ✓ | ✓ |
| WhatsApp | ✓ (nativo) | ✗ (requiere integración extra) |
| Personalización IA | ✓ | Limitado |
| Control total | ✓ | ✗ |
| Curva de aprendizaje | Media | Baja |

**Frase para el vídeo:** "El único punto donde Klaviyo gana es en facilidad de configuración inicial. Pero lo que acabas de ver lo monté en 2 horas la primera vez. Y ahora tú lo puedes importar en 5 minutos."

### CTA FINAL (1 min)
"El JSON del workflow está en la descripción, descárgalo, impórtalo en tu n8n y solo tienes que cambiar las credenciales de Shopify, tu email y tu número de WhatsApp. Si tienes dudas o quieres que lo monte yo directamente en tu tienda, tienes el enlace de revisión gratuita en la descripción."

---

## DESCRIPCIÓN DEL VÍDEO
```
Klaviyo cobra hasta 300€/mes para recuperar carritos abandonados. Este workflow de n8n hace lo mismo — email + WhatsApp + IA — y es gratis.

En este vídeo te enseño el sistema completo paso a paso y al final puedes descargar el JSON e importarlo directamente.

⬇️ Descarga el workflow JSON: [link al archivo en tu web o drive]
📩 Lo montamos en tu tienda: wa.me/34643135603?text=Hola Cris!

⏱️ Índice:
00:00 - El problema de los carritos abandonados
02:00 - Cómo funciona el sistema
03:00 - Paso a paso en n8n
11:00 - Comparativa n8n vs Klaviyo
13:00 - Descarga e importa el workflow

#shopify #n8n #ecommerce #klaviyo #automatización #carritos #tiendaonline
```
