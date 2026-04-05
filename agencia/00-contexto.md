# Agencia — Contexto del Proyecto
> Actualizado: 24/03/2026

---

## Qué es
Agencia de ecommerce con IA. Ayudo a otras tiendas online a crecer usando Inteligencia Artificial y automatización (n8n). El canal de YouTube es el principal canal de captación de clientes.

## Estado actual
- Clientes: 0 (objetivo inmediato: conseguir primeros clientes)
- Canal YouTube: @CristinaPerisAI → https://www.youtube.com/@CristinaPerisAI
- Referente / mentor objetivo: Nacho Leo → https://www.youtube.com/@Nacho_Leo
- Meta con mentoría: poder pagarla con los ingresos de los primeros clientes

## Objetivo del canal YouTube
**No es volumen de views. Es captación de clientes.**
El canal debe atraer a dueños de tiendas online que quieran aplicar IA y automatización a su ecommerce. Cada vídeo es una demostración de competencia, no entretenimiento.

## Cliente ideal (ICP — Ideal Customer Profile)
- Dueño/a de tienda online (Shopify, WooCommerce, PrestaShop)
- Facturando algo (no en fase 0) pero con margen de mejora
- Frustrado/a con procesos manuales, publicidad cara, o falta de tiempo
- Abierto/a a la IA pero no sabe cómo aplicarla
- España / habla hispana

## Nicho de contenido
- IA aplicada a ecommerce (casos reales, herramientas, procesos)
- Automatización con n8n para tiendas online
- Estrategia de ecommerce con enfoque práctico
- Novedad: siempre desde el ángulo de "cómo esto cambia o mejora tu tienda"

---

## Las 5 palancas de trabajo con Claude

### 1. Evaluación del canal (análisis profundo, hecho una vez + revisiones trimestrales)
Ver `01-evaluacion-canal-youtube.md`
- Análisis de: título del canal, descripción, banner, thumbnails, títulos de vídeos, hooks, retención, CTAs
- Fortalezas, debilidades, puntos ciegos
- Lista priorizada de cambios a realizar

### 2. Análisis de competencia (especialmente Nacho Leo)
Ver `02-analisis-competencia.md`
- Qué hace Nacho Leo que funciona: estructura de vídeos, títulos, thumbnails, propuesta de valor
- Qué huecos existen que Cristina puede ocupar
- Cómo diferenciarse siendo más específica en IA + ecom

### 3. Ideas de contenido — IA y n8n aplicado a ecommerce
Ver `04-banco-de-ideas.md`
- Búsqueda semanal de novedades de IA relevantes para ecommerce
- Ideas de vídeos siempre desde el enfoque: "qué cambia esto para una tienda online"
- Automatizaciones de n8n con casos de uso reales para ecommerce
- Formato de cada idea: título SEO + hook de apertura + estructura del vídeo

### 4. Análisis semanal de métricas
Ver `05-analisis-semanal/`
- Cada semana: pegar métricas de YouTube Studio → Claude las interpreta
- Output: qué funcionó, qué no, por qué, qué cambiar la próxima semana
- Seguimiento de tendencias acumuladas semana a semana

### 5. Generador de carruseles de Instagram
Ver `carousel-generator/`
- Sistema completo para generar carruseles de 8 slides listos para subir
- Input: un tema → Output: PNGs 1080x1350px con copy y diseño
- Colores de marca: crema, negro, blanco + acento naranja/terracota
- Tipografía: serif italic (elegante) + sans-serif bold (impacto)

---

## Archivos en esta carpeta
- `00-contexto.md` — este archivo
- `01-evaluacion-canal-youtube.md` — diagnóstico completo del canal
- `02-analisis-competencia.md` — análisis de Nacho Leo y otros referentes
- `03-plan-de-accion.md` — plan paso a paso para conseguir primeros clientes
- `04-banco-de-ideas.md` — banco de ideas de vídeos y contenido
- `05-analisis-semanal/` — carpeta con un archivo por semana de métricas
- `carousel-generator/` — sistema de generación de carruseles con IA

---

## Prompts de arranque rápido

### Para evaluación del canal:
```
Actúa como estratega de YouTube especializado en canales B2B para agencias digitales.
Mi canal es @CristinaPerisAI (agencia de ecommerce con IA, España).
Objetivo del canal: captar clientes para mi agencia, no views virales.
Cliente ideal: dueños de tiendas online que quieren aplicar IA y n8n.
Tengo [X] suscriptores, [X] vídeos publicados, [X] views de media.
Mis últimos vídeos son: [lista].
Haz un diagnóstico completo: fortalezas, debilidades, y dame un plan de mejora priorizado.
```

### Para análisis semanal de métricas:
```
Actúa como analytics reviewer de un canal de YouTube B2B enfocado en captación de clientes para agencia.
Estas son mis métricas de esta semana en YouTube Studio:
[pegar datos]
Dime: qué funcionó, qué no funcionó, por qué, y qué cambio concreto hago la próxima semana.
```

### Para ideas de contenido con novedades IA:
```
Actúa como content strategist especializado en IA aplicada a ecommerce.
Dame 10 ideas de vídeo para YouTube basadas en las últimas novedades de IA (marzo 2026).
Para cada idea: título optimizado para SEO + hook de apertura (primeros 30 segundos) + estructura del vídeo.
El ángulo siempre debe ser: "cómo esto cambia o mejora una tienda online".
Incluye también 3 ideas de automatizaciones con n8n aplicadas a ecommerce.
```
