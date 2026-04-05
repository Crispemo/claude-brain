# GUIÓN: "n8n Envía Alertas de Stock Bajo a WhatsApp Automáticamente (Tutorial Paso a Paso)"
> Duración estimada: 10-12 min | Tipo: Tutorial práctico | Atrae a dueños técnicos + no técnicos

---

## ESTRATEGIA DEL VÍDEO
Este vídeo tiene dos audiencias:
1. Dueños de tienda que quieren implementarlo solos → tutorial
2. Dueños que lo intentan, no pueden, y contactan → captación de cliente

El tono es "lo hago contigo, no para ti". No es un tutorial frío de YouTube, es como si se lo explicaras a un amigo con tienda.

**Título:** "Nunca Más Sin Stock sin Saberlo: Alertas Automáticas de Shopify a WhatsApp con n8n"
**Thumbnail:** Screenshot de WhatsApp con mensaje "⚠️ Stock crítico: Zapatilla talla 42 — solo 2 unidades" + cara tuya mirando el móvil con cara de "esto salva vidas"

---

## HOOK — Primeros 30 segundos

"¿Cuántas veces te has quedado sin stock de un producto sin enterarte hasta que el cliente ya había intentado comprarlo y no pudo? Cada vez que eso pasa, pierdes una venta y un cliente. Este sistema de n8n revisa tu inventario de Shopify cada noche y si algún producto baja de 10 unidades, te manda un WhatsApp inmediatamente. Sin apps de pago, sin suscripciones. Vamos a montarlo."

---

## ESTRUCTURA DEL VÍDEO

### BLOQUE 1 — El coste real del stock roto (2 min)
- Stockout = venta perdida + cliente frustrado que no vuelve
- En Shopify, por defecto no hay alertas útiles de stock bajo
- La mayoría de tiendas lo descubren cuando hay 0 unidades, no cuando quedan 5-10
- **El momento correcto para actuar:** cuando queda entre 10-15% del stock habitual, no cuando llega a 0

### BLOQUE 2 — Qué hace el sistema exactamente (1 min)
- Cada noche a las 22:00 → n8n consulta el inventario de Shopify
- Por cada variante de producto → comprueba si está por debajo del umbral
- Si sí → envía WhatsApp al dueño con: nombre del producto, variante, stock actual, link directo a Shopify para reponer
- Resumen semanal los lunes con todos los productos en nivel crítico

### BLOQUE 3 — Construcción paso a paso (6 min)

**Paso 1 — Schedule Trigger (30 seg)**
- Cada día a las 22:00
- Mostrar configuración del cron: `0 22 * * *`

**Paso 2 — Consultar inventario de Shopify (2 min)**
- HTTP Request → GET `/admin/api/2024-01/variants.json?fields=id,title,inventory_quantity,product_id`
- Paginación si hay más de 250 variantes (mostrar cómo manejarla)
- Resultado: array con todas las variantes y su stock

**Paso 3 — Filtrar las que están por debajo del umbral (1 min)**
- Nodo Code: filtrar variantes donde `inventory_quantity <= 10`
- Añadir el nombre del producto haciendo un lookup
- Output: solo los productos críticos

**Paso 4 — ¿Hay productos críticos? (30 seg)**
- Nodo IF: ¿la lista de críticos tiene elementos?
- Si no hay → terminar (sin mensaje)
- Si hay → continuar

**Paso 5 — Formatear y enviar WhatsApp (2 min)**
- Nodo Code: construir mensaje WhatsApp con la lista
- Formato del mensaje:
```
⚠️ ALERTA DE STOCK — {{fecha}}

Productos por debajo del umbral:

{{#each productos}}
• {{nombre}} ({{variante}}): {{stock}} unidades
  → https://tu-tienda.myshopify.com/admin/products/{{id}}
{{/each}}

Revisa y repone antes de que lleguen a 0.
```
- Nodo HTTP Request → Twilio/WhatsApp API → enviar

**Paso extra — Umbral personalizado por producto (bonus)**
- Mostrar cómo usar un Google Sheet con umbrales distintos por producto
- Producto A: alerta en 10 | Producto B: alerta en 50 (si se vende muy rápido)

### BLOQUE 4 — Variante: alerta en tiempo real (1 min)
"Lo que acabamos de montar revisa cada noche. Si quieres alertas en tiempo real, puedes usar el webhook de Shopify `inventory_levels/update` que dispara n8n cada vez que cambia el stock. Más inmediato pero más complejo. Eso lo dejo como ejercicio o si me lo pedís en comentarios lo hago en otro vídeo."

### CTA
"El workflow está en la descripción. Si intentas montarlo y te atascas en algún punto, escríbeme. Y si directamente quieres que lo configure yo en tu tienda esta semana, también tienes el link."

---

## DESCRIPCIÓN DEL VÍDEO
```
Shopify no te avisa cuando el stock baja. Este workflow de n8n lo hace automáticamente: revisa cada noche y te manda un WhatsApp con los productos críticos.

⬇️ Descarga el workflow: [link]
📩 Lo configuramos en tu tienda: wa.me/34643135603?text=Hola Cris!

#shopify #n8n #stock #ecommerce #automatización #whatsapp #inventario
```
