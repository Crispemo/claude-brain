# GUIÓN: "Sistema de Post-Venta Automático por WhatsApp: Reduce Devoluciones un 30%"
> Duración estimada: 12-14 min | Tipo: Sistema completo con resultado medible

---

## POR QUÉ ESTE VÍDEO CONVIERTE CLIENTES DE AGENCIA
- Habla de reducir devoluciones → ahorro de dinero directo
- El 30% es un dato específico y creíble
- El dueño de tienda que tiene muchas devoluciones busca exactamente esto
- Demuestra que sabes construir infraestructura, no solo hablar de IA

**Título:** "Este Sistema de WhatsApp Reduce las Devoluciones de tu Shopify un 30% (Automático)"
**Thumbnail:** Flecha hacia abajo con "DEVOLUCIONES -30%" + logo WhatsApp + cara tuya sorprendida

---

## HOOK — Primeros 30 segundos

"¿Cuánto te cuestan las devoluciones al mes? Logística de vuelta, reposición de stock, tiempo de gestión... Para la mayoría de ecommerce son entre el 15 y el 25% de sus ventas. Hay un sistema de WhatsApp que reduce eso un 30% de forma automática. No porque convenzas al cliente de no devolver. Sino porque resuelves el problema antes de que se convierta en una devolución. Te lo explico."

---

## ESTRUCTURA DEL VÍDEO

### BLOQUE 1 — Por qué devuelven los clientes (2 min)
Los 5 motivos de devolución más comunes en ecommerce:
1. El producto no era lo que esperaban (foto/descripción engañosa)
2. Problema con el tamaño o la talla
3. El producto llegó tarde y ya no lo necesitan
4. Llegó en mal estado
5. Simplemente cambiaron de opinión

**El insight clave:** el 60% de las devoluciones se pueden evitar si contactas al cliente en el momento correcto. No para persuadirle, sino para resolver su duda antes de que decida devolver.

### BLOQUE 2 — El sistema de 4 mensajes (2 min — mostrar diagrama)
```
PEDIDO CONFIRMADO
  └→ Mensaje 1 (día 0): "Tu pedido está en camino — track aquí"

PEDIDO ENTREGADO (webhook Shopify)
  └→ Mensaje 2 (día 1): "¿Te llegó bien? ¿Alguna duda?"

SI RESPONDE CON PROBLEMA
  └→ Resolver antes de que piense en devolver

SI NO HAY PROBLEMA
  └→ Mensaje 3 (día 5): "¿Cómo lo estás usando? Aquí un tip"
  └→ Mensaje 4 (día 10): "¿Nos dejas una reseña?"
```

### BLOQUE 3 — Construcción en n8n (7 min)

**Paso 1 — Trigger: pedido entregado en Shopify (1 min)**
- Shopify Webhook: `fulfillments/create` → cuando se marca como enviado
- O mejor: `orders/fulfilled` → cuando llega confirmación de entrega del transportista
- Mostrar configuración

**Paso 2 — Mensaje 1: confirmación de envío (1 min)**
- Inmediatamente al cumplirse el evento
- Texto: "¡Hola {{nombre}}! Tu pedido de {{tienda}} ya está en camino 🚚 Puedes seguirlo aquí: {{tracking_url}} ¿Alguna pregunta? Estoy aquí."
- Nodo HTTP → WhatsApp API

**Paso 3 — Mensaje 2: check de entrega + detección de problemas (2 min)**
- Wait: 24 horas desde la entrega estimada
- Texto: "Hola {{nombre}}, ¿te llegó bien el pedido? Si tienes alguna duda sobre el producto o algo no está bien, cuéntame y lo solucionamos ahora mismo 💬"
- IF: ¿el cliente responde con palabras clave negativas? (roto, mal, error, no llegó, devolver)
  - Sí → Notificar al equipo + respuesta empática del agente
  - No → Continuar flujo

**Paso 4 — Mensaje 3: tip de uso (1 min)**
- Wait: 5 días desde la entrega
- Solo si no hay problema registrado
- Texto personalizado según categoría del producto
- Ejemplo ropa deportiva: "¿Cómo está yendo el entrenamiento con {{producto}}? Un truco: [tip relevante del producto]"

**Paso 5 — Mensaje 4: reseña (1 min)**
- Wait: 10 días desde la entrega
- Texto: "Hola {{nombre}}, ¿cómo está yendo todo con tu pedido? Si estás contento/a, nos ayudaría muchísimo dejar una reseña aquí: {{link_reseña}} ¡Gracias!"
- Si el cliente dejó reseña → parar flujo

**Paso 6 — Detección automática de intención de devolución (1 min)**
- En cualquier momento si el cliente menciona: "quiero devolver", "devolución", "no me gusta", "está roto"
- El agente responde empáticamente y ofrece alternativas antes del proceso formal

### BLOQUE 4 — El resultado (1 min)
"Este sistema no evita todas las devoluciones. Evita las que se producen por falta de información o por problemas solucionables. El 30% de reducción viene de resolver en el momento 2: el cliente tiene una duda, tú la resuelves en 5 minutos, y la devolución no llega."

### CTA
"El workflow completo con los 4 mensajes está en la descripción. Y si quieres que lo configure directamente en tu Shopify, ya sabes dónde encontrarme."

---

## DESCRIPCIÓN DEL VÍDEO
```
El 60% de las devoluciones se pueden evitar con el mensaje correcto en el momento correcto. Este sistema de n8n + WhatsApp lo hace automático: 4 mensajes, timing perfecto, y detección de problemas antes de que se conviertan en devoluciones.

⬇️ Descarga el workflow: [link]
📩 Lo configuramos en tu Shopify: wa.me/34643135603?text=Hola Cris!

#shopify #whatsapp #devoluciones #ecommerce #n8n #automatización
```
