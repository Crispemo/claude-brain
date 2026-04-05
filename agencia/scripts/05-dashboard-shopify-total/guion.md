# GUIÓN: "El Panel de Control Total de tu Shopify — todas las métricas en un dashboard automático"
> Duración estimada: 16-20 min | Tipo: Tutorial avanzado | NIVEL: Wow factor máximo

---

## LA IDEA ELEVADA
No es "exportar a Excel". Es un **dashboard web interactivo**, generado automáticamente cada semana por n8n, con todas las métricas de la tienda visualizadas: ventas, conversión, productos top, clientes nuevos vs recurrentes, stock crítico, comparativa semana anterior. Enviado automáticamente al email o accesible desde un link. Esto es lo que usan las tiendas de 7 cifras. Hoy lo montas en tu Shopify.

**Título:** "El Dashboard Definitivo de Shopify que n8n Genera Automático cada Semana (y es Gratis)"
**Thumbnail:** Pantalla con dashboard lleno de gráficas coloridas + "AUTOMÁTICO" + logo n8n + logo Shopify

---

## HOOK — Primeros 30 segundos

"Cada lunes por la mañana, este dashboard llega a mi email solo. Ventas de la semana, comparativa con la anterior, productos más vendidos, tasa de conversión, clientes nuevos, stock crítico. Todo. Sin abrir Shopify, sin hacer nada. n8n lo genera automáticamente. Hoy te enseño cómo montarlo en tu tienda."

---

## ESTRUCTURA DEL VÍDEO

### BLOQUE 1 — El problema con los reportes en Shopify (2 min)
- Shopify Analytics es limitado: no compara semanas fácilmente, no cruza datos de stock con ventas, no te manda un resumen
- La mayoría de dueños de tienda no revisan métricas regularmente → toman decisiones sin datos
- Los que sí las revisan pierden 1-2 horas semanales en Shopify, Excel, Google Sheets...
- **La solución:** automatizar la recogida, el procesamiento y la visualización

### BLOQUE 2 — Qué incluye el dashboard (2 min — mostrar resultado final primero)
**Mostrar en pantalla el dashboard HTML generado:**
- KPIs de la semana: Ventas totales / Pedidos / AOV (ticket medio) / Tasa de conversión
- Comparativa vs semana anterior (flecha verde/roja)
- Gráfico de ventas diarias (últimos 7 días)
- Top 5 productos más vendidos
- Clientes nuevos vs recurrentes
- Stock crítico (productos con <10 unidades)
- Pedidos pendientes de envío

### BLOQUE 3 — Arquitectura del sistema (1 min)
Diagrama:
```
[Cada lunes 8:00] → n8n despierta
→ Llama a API de Shopify (orders, products, customers)
→ Procesa los datos con código
→ Genera HTML del dashboard
→ Envía por email
→ (Opcional) Publica en URL pública
```

### BLOQUE 4 — Construcción paso a paso (10 min)

**Paso 1 — Trigger semanal (30 seg)**
- Schedule Trigger: cada lunes a las 8:00
- Mostrar configuración

**Paso 2 — Recoger datos de Shopify (3 min)**
- HTTP Request → Shopify Admin API
- Endpoint orders: `/admin/api/2024-01/orders.json?created_at_min={{fecha_inicio}}&status=paid`
- Endpoint products: `/admin/api/2024-01/products.json?fields=id,title,variants`
- Endpoint customers: `/admin/api/2024-01/customers.json?created_at_min={{fecha_inicio}}`
- Explicar cómo obtener el API key de Shopify (Settings > Apps > Develop apps)

**Paso 3 — Procesar los datos (3 min)**
- Nodo Code (JavaScript):
  - Calcular ventas totales, número de pedidos, AOV
  - Encontrar top 5 productos
  - Contar clientes nuevos
  - Identificar productos con stock < 10
- Mostrar el código en pantalla (simplificado)

**Paso 4 — Generar el HTML del dashboard (2 min)**
- Nodo Code: template HTML con CSS inline
- Gráfico de barras con Chart.js (librería incluida por CDN)
- Colores: verde para métricas positivas, rojo para negativas
- Mostrar el resultado en pantalla

**Paso 5 — Enviar por email (1 min)**
- Nodo Gmail/SMTP: enviar el HTML como cuerpo del email
- Asunto: "📊 Tu tienda esta semana — {{fecha}}"
- Mostrar cómo se ve en el email

**Paso 6 (bonus) — Publicar en URL pública (1 min)**
- Opción: guardar el HTML en un servidor o usar n8n webhooks para servirlo
- Acceso desde móvil con link directo

### BLOQUE 5 — El nivel siguiente (1 min)
"Con este mismo sistema puedes añadir datos de Meta Ads, de Google Ads, de costes de producto... y tener un panel de rentabilidad real. Eso es lo que monto para los clientes de mi agencia. Si quieres ese nivel, el enlace está en la descripción."

### CTA
"El workflow completo con el código de procesamiento y el template HTML está en la descripción. Importa en n8n, pon tus credenciales de Shopify y tu email, y el próximo lunes llega solo."

---

## HERRAMIENTAS NECESARIAS
- n8n (self-hosted o cloud)
- Shopify Admin API key
- Gmail o SMTP para envío
- (Opcional) Chart.js para gráficos

## DESCRIPCIÓN DEL VÍDEO
```
Cada lunes a las 8:00 este dashboard llega a mi email automáticamente: ventas, conversión, stock crítico, top productos. Todo generado por n8n desde Shopify. Sin Excel, sin trabajo manual.

⬇️ Descarga el workflow completo: [link]
📩 Lo montamos en tu tienda: wa.me/34643135603?text=Hola Cris!

#shopify #n8n #dashboard #ecommerce #automatización #shopifyespaña
```
