# Diseño — Mes completo de contenido (Abril–Mayo 2026)

**Fecha:** 2026-04-28  
**Estado:** Aprobado

---

## Resumen

Producción de un mes completo de contenido para dos canales:
- **Agencia** (IA + ecommerce): 9 shorts + portadas + 9 carruseles
- **Simulia** (enfermería EIR): 9 shorts + portadas
- **Dashboard**: añadir los 18 shorts al pipeline de contenido (tab Contenido)

Videos largos: ya están listos, no se producen en este ciclo.

---

## Estructura de archivos

```
agencia/scripts/shorts/
  10-XX-nombre-short/
    guion.md
    portada.html

agencia/carousel-generator/output/
  [generado automáticamente por generate.py × 9]

simulia/scripts/
  01-XX-nombre-short/
    guion.md
    portada.html
```

---

## Piezas a producir

### AGENCIA — 9 Shorts (dolores ecommerce)

Formato: HOOK / DESARROLLO / CTA FINAL / NOTAS DE GRABACIÓN  
Duración: 40-45 segundos (~100 palabras)  
CTA: "Comenta [PALABRA] abajo" O redirección a vídeo YT concreto  
Portada: 1080×1920, paleta agencia (cream #F5F0E8 / black #1A1A1A / accent #C4611A)

| # | Título / Ángulo | CTA |
|---|---|---|
| S10 | Tu ficha de producto hace una pregunta y no la responde | Comenta SHOPIFY |
| S11 | Tienes 200 visitas al día y 0 ventas. El problema no es el tráfico | → vídeo YT fichas producto |
| S12 | Cada DM sin responder en 2h es una venta que se pierde | Comenta WHATSAPP |
| S13 | Tu carrito tiene un 70% de abandono. Aquí lo que pasa | → vídeo YT carritos abandonados |
| S14 | Llevas 2 años con la misma descripción de producto | Comenta FICHAS |
| S15 | Tu email list tiene 3.000 contactos y no abre nadie | Comenta EMAIL |
| S16 | Tus anuncios funcionan. Tu tienda no vende. El problema está aquí | → vídeo YT CRO |
| S17 | El 80% del soporte que recibes son las mismas 5 preguntas | Comenta BOT |
| S18 | No tienes más ventas porque tu tienda se ve igual que la de todos | Comenta AUDITORIA |

### AGENCIA — 9 Carruseles ecommerce

Ejecutados con `python generate.py "tema" --style a` (estilo editorial).  
Output: `agencia/carousel-generator/output/[slug]/`  
Se puede variar el diseño con elementos visuales según el tema.

| # | Tema |
|---|---|
| C01 | Por qué tu conversión está por debajo del 1% |
| C02 | 5 automatizaciones post-venta que generan dinero mientras duermes |
| C03 | Cómo saber qué producto optimizar primero |
| C04 | Los 5 emails que toda tienda debería tener automatizados |
| C05 | Cómo subir el ticket medio sin más tráfico ni más anuncios |
| C06 | Lo que hacen las tiendas que más convierten |
| C07 | Por qué tu anuncio funciona pero tu tienda no cierra |
| C08 | El error de soporte que te está costando reseñas de 5 estrellas |
| C09 | Cómo usar IA para escribir fichas de producto que convierten |

### SIMULIA — 9 Shorts enfermería EIR

Formato: HOOK / VALOR CLAVE + TRAMPA / CONTEXTO / CTA  
CTA: siempre redirección a "7 días de prueba gratis en Simulia"  
Portada: 1080×1920, paleta Simulia (bg #2a3438 / accent #7c9fa6 / slide #3f5056)  
Contenido clínicamente fundado con fuente citada en cada guion.

| # | Tema | Fuente |
|---|---|---|
| SS01 | Escala de Barthel — corte dependencia | Mahoney & Barthel, Md State Med J 1965 |
| SS02 | Fármacos SVA — adrenalina, amiodarona, atropina | ERC Guidelines 2021 |
| SS03 | Estadios UPP NPUAP/EPUAP — III vs IV | NPUAP/EPUAP/PPPIA Clinical Practice Guideline 2019 |
| SS04 | Constantes vitales adulto vs pediátrico | PALS Guidelines / Temario EIR |
| SS05 | Escala de Braden — puntos de corte | Bergstrom et al., Nurs Res 1987 |
| SS06 | Dolor abdominal por cuadrantes | Semiología clínica EIR / Harrison's |
| SS07 | Diuresis normal — oliguria y anuria | Temario EIR nefrología / KDIGO |
| SS08 | Estreptococo grupo B en embarazo | SEGO Protocolo SGB 2022 / CDC |
| SS09 | Escalas del dolor — EVA, numérica, CPOT | IASP / Temario EIR crítica |

---

## Dashboard

Añadir los 18 shorts al `STATE.scripts` en `dashboard/state.json` con:
- `status: "idea"`
- `project: "agencia"` o `"simulia"`
- `type: "short"`
- `title`: título del short

Aparecen en el tab "Contenido" del dashboard bajo la sección "idea" del pipeline.

---

## Convenciones de formato

**Guiones cortos agencia:**
- Voseo (tenés, podés, fijate)
- Frases de 1 línea
- Resultado antes que proceso
- CTA siempre la misma estructura

**Guiones cortos simulia:**
- Tono directo, como compañero EIR
- Dato clínico preciso + trampa de examen
- CTA hacia prueba gratuita de 7 días

**Portadas agencia:** Inter 900 + Playfair Display italic, decoraciones con círculos difuminados  
**Portadas simulia:** misma estructura pero paleta teal oscura

---

## Lo que NO se produce

- Videos largos (ya están listos: 12 guiones en `agencia/scripts/01-12`)
- Contenido para Mocca (proyecto pausado)
