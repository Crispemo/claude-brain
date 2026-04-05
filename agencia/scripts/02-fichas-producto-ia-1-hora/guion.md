# GUIÓN: "Cómo uso IA para generar 100 fichas de producto en Shopify en 1 hora (workflow real)"
> Duración estimada: 14-16 min | Tipo: Tutorial con workflow descargable

---

## HOOK — Primeros 30 segundos

"Tienes 200 productos en Shopify. Cada ficha debería tener: un título con keywords, una descripción de 150 palabras que venda, los beneficios en bullets, y el SEO optimizado. Hacerlo a mano: 15 minutos por producto, 50 horas de trabajo. Hacerlo con el workflow que te voy a enseñar hoy: 1 hora. Y no es ChatGPT copiando y pegando, es un sistema que lee tu catálogo, entiende cada producto, y escribe fichas que convierten."

---

## ESTRUCTURA DEL VÍDEO

### BLOQUE 1 — Por qué las fichas de producto importan tanto (2 min)
- El 87% de los compradores online dicen que la descripción del producto es clave en su decisión
- Una ficha mala = baja conversión + baja visibilidad en Google
- Con el Agentic Commerce llegando (vídeo anterior), los agentes de IA leen las fichas para decidir si recomendan tu producto. Ficha pobre = agente no te recomienda
- **El doble problema:** no tienes tiempo y no eres copywriter

### BLOQUE 2 — Qué genera el sistema (1 min — mostrar resultado)
Para cada producto, el sistema genera:
- Título optimizado (con keyword principal, máx 70 caracteres)
- Meta description para SEO (155 caracteres)
- Descripción principal (150-200 palabras, tono de marca)
- 5 bullets de beneficios (no características, beneficios)
- Tags de Shopify sugeridos
Mostrar antes/después: ficha genérica vs ficha generada

### BLOQUE 3 — Cómo funciona el workflow (1 min — diagrama)
```
Google Sheets (catálogo de productos)
  → n8n lee cada fila
  → Para cada producto → llama a Claude/GPT-4
  → Genera las 5 partes de la ficha
  → Actualiza directamente en Shopify vía API
  → Guarda resultado en Google Sheets (para revisión)
```

### BLOQUE 4 — Construcción paso a paso (8 min)

**Paso 0 — Preparar el catálogo en Google Sheets (1 min)**
Columnas necesarias: ID de producto Shopify | Nombre | Categoría | Características técnicas | Público objetivo | Precio | Diferenciador clave
Mostrar ejemplo con 5 productos reales

**Paso 1 — Leer el Google Sheet (1 min)**
- Nodo Google Sheets Trigger o Schedule + Read
- Filtrar solo filas sin ficha generada (columna "Generado" = vacío)

**Paso 2 — Loop por cada producto (30 seg)**
- Nodo Split In Batches (de 1 en 1 para no saturar la API)

**Paso 3 — El prompt maestro de fichas (3 min — el núcleo)**
Mostrar el prompt completo en pantalla:
```
Eres un experto en copywriting para ecommerce especializado en [CATEGORÍA].
Escribe la ficha completa para el siguiente producto.

PRODUCTO: {{nombre}}
CATEGORÍA: {{categoria}}
CARACTERÍSTICAS: {{caracteristicas}}
PÚBLICO: {{publico}}
PRECIO: {{precio}}€
DIFERENCIADOR: {{diferenciador}}

Genera exactamente en este formato JSON:
{
  "titulo": "título SEO máx 70 caracteres con keyword principal",
  "meta_description": "meta description 155 caracteres con CTA",
  "descripcion": "150-200 palabras, empieza con el beneficio principal, tono [MARCA], sin tecnicismos, vende la transformación",
  "bullets": ["beneficio 1", "beneficio 2", "beneficio 3", "beneficio 4", "beneficio 5"],
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}
```

**Paso 4 — Actualizar en Shopify (2 min)**
- Parsear el JSON de respuesta
- Nodo HTTP Request → Shopify Admin API → PUT `/admin/api/2024-01/products/{{id}}.json`
- Body: `{ "product": { "title": "...", "body_html": "...", "tags": "..." } }`
- Mostrar la ficha actualizada en directo en Shopify

**Paso 5 — Registrar en Google Sheets (30 seg)**
- Marcar la fila como "Generado" + timestamp
- Guardar el JSON completo en una columna para revisión

### BLOQUE 5 — Cómo revisar y ajustar (1 min)
- El sistema genera el 80% del trabajo
- Revisión humana: 2-3 min por ficha para ajustar tono y datos específicos
- Para 100 productos: 1h generación + 4-5h revisión = listo en una mañana

### BLOQUE 6 — La versión avanzada: imágenes con IA (1 min — teaser)
"El siguiente nivel es generar también las imágenes de producto con IA: fondo blanco, lifestyle, variaciones de color... eso lo cubro en un próximo vídeo."

### CTA
"El workflow completo y el Google Sheet template están en la descripción. Importa, añade tus productos, y empieza."

---

## DESCRIPCIÓN DEL VÍDEO
```
100 fichas de producto en Shopify en 1 hora. Workflow completo de n8n que lee tu catálogo, genera títulos SEO + descripciones + bullets con IA, y actualiza Shopify automáticamente.

⬇️ Descarga workflow + Google Sheet template: [link]
📩 Lo montamos en tu tienda: wa.me/34643135603?text=Hola Cris!

#shopify #ia #ecommerce #n8n #fichasdeproducto #chatgpt #automatización
```
