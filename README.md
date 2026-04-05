# Claude Brain — Centro de mando
> Tu como director. Claude como orquestador + ejecutor.

---

## Los 3 proyectos

### Simulia (PRIORITARIO)
Plataforma de oposiciones de enfermería. Producto listo, usuarios reales. Reto: captación y posicionamiento.
→ [simulia/](simulia/)

### Agencia — IA + Ecommerce
Canal de contenido en español. La audiencia alimenta los otros proyectos.
→ [agencia/](agencia/)

### Mocca
Ecommerce de complementos para perros. Pre-lanzamiento, sin presupuesto. Estrategia: comunidad primero.
→ [mocca/](mocca/)

---

## Cómo usar este sistema

Cada carpeta tiene:
- `00-contexto.md` — qué es el proyecto y estado actual
- `01-analisis-*.md` — análisis con datos reales
- `02/03-plan-de-accion.md` — plan paso a paso con tareas concretas

**Para trabajar con Claude en cualquier proyecto:**
1. Abre el archivo de contexto y plan del proyecto
2. Copia el prompt sugerido en ese documento
3. Pégalo en una nueva conversación con Claude
4. Guarda el output en el archivo correspondiente de esa carpeta

---

## Estado actual (abril 2026)

| Proyecto | Estado | KPI |
|---|---|---|
| Simulia | Activo — prioritario | 347€ MRR → objetivo 1.000€ |
| Agencia | Activo | 0 clientes → objetivo 5/mes |
| Mocca | Pausado | Retomar cuando Simulia > 800€ MRR |

## Dashboard personal
Panel de control en `dashboard/` — accesible desde iPhone vía Cloudflare Tunnel (`dash.simulia.es`).
Incluye: métricas en tiempo real (Stripe, YouTube), tareas semanales, chat con Claude, habit tracker.
