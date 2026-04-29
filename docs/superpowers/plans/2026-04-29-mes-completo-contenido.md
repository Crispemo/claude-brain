# Mes Completo de Contenido — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Producir 27 piezas de contenido del mes: 9 shorts agencia + portadas, 9 carruseles agencia, 9 shorts simulia + portadas, y actualizar el dashboard.

**Architecture:** Cada short es un `guion.md` + `portada.html` en su propia carpeta. Los carruseles se generan con `generate.py`. El dashboard se actualiza añadiendo los 18 shorts a `state.json`.

**Tech Stack:** Markdown, HTML/CSS (portadas standalone), Python + Anthropic SDK (carousel generator), JSON (dashboard state)

---

## File Map

**Crear:**
- `agencia/scripts/shorts/10-ficha-sin-respuesta/guion.md` + `portada.html`
- `agencia/scripts/shorts/11-visitas-sin-ventas/guion.md` + `portada.html`
- `agencia/scripts/shorts/12-dm-sin-responder/guion.md` + `portada.html`
- `agencia/scripts/shorts/13-abandono-carrito/guion.md` + `portada.html`
- `agencia/scripts/shorts/14-descripcion-vieja/guion.md` + `portada.html`
- `agencia/scripts/shorts/15-email-list-muerta/guion.md` + `portada.html`
- `agencia/scripts/shorts/16-anuncio-funciona-tienda-no/guion.md` + `portada.html`
- `agencia/scripts/shorts/17-soporte-mismas-preguntas/guion.md` + `portada.html`
- `agencia/scripts/shorts/18-tienda-igual-que-todas/guion.md` + `portada.html`
- `agencia/carousel-generator/output/[9 carpetas]` (generado por script)
- `simulia/scripts/SS01-barthel/guion.md` + `portada.html`
- `simulia/scripts/SS02-farmacos-sva/guion.md` + `portada.html`
- `simulia/scripts/SS03-upp-estadios/guion.md` + `portada.html`
- `simulia/scripts/SS04-constantes-vitales/guion.md` + `portada.html`
- `simulia/scripts/SS05-braden/guion.md` + `portada.html`
- `simulia/scripts/SS06-dolor-abdominal/guion.md` + `portada.html`
- `simulia/scripts/SS07-diuresis/guion.md` + `portada.html`
- `simulia/scripts/SS08-sgb-embarazo/guion.md` + `portada.html`
- `simulia/scripts/SS09-escalas-dolor/guion.md` + `portada.html`

**Modificar:**
- `dashboard/state.json` — añadir 18 entradas al array `scripts`

---

## Task 1: Agencia Shorts S10–S12 (guiones + portadas)

**Files:**
- Create: `agencia/scripts/shorts/10-ficha-sin-respuesta/guion.md`
- Create: `agencia/scripts/shorts/10-ficha-sin-respuesta/portada.html`
- Create: `agencia/scripts/shorts/11-visitas-sin-ventas/guion.md`
- Create: `agencia/scripts/shorts/11-visitas-sin-ventas/portada.html`
- Create: `agencia/scripts/shorts/12-dm-sin-responder/guion.md`
- Create: `agencia/scripts/shorts/12-dm-sin-responder/portada.html`

- [ ] **Crear carpetas**
```bash
mkdir -p agencia/scripts/shorts/10-ficha-sin-respuesta
mkdir -p agencia/scripts/shorts/11-visitas-sin-ventas
mkdir -p agencia/scripts/shorts/12-dm-sin-responder
```

- [ ] **Escribir S10 guion**

`agencia/scripts/shorts/10-ficha-sin-respuesta/guion.md`:
```
# SHORT S-10: Tu Ficha Tiene la Respuesta y el Cliente Igual se Va

**Duración objetivo: 40-45 segundos**

---

## HOOK

Tu ficha de producto tiene toda la información.

Y el cliente igual se va sin comprar.

¿Por qué?

---

## DESARROLLO

Porque la ficha informa. Pero no resuelve la duda real.

"¿Esto me servirá a mí?"

"¿Qué pasa si no me gusta?"

"¿Tarda mucho?"

Esas preguntas que el cliente tiene y tu ficha no responde.

Con IA podés analizar los mensajes de soporte, detectar qué preguntas se repiten, y convertirlas en texto dentro de la ficha.

Resultado: el cliente compra solo. Sin que le respondas por DM.

---

## CTA FINAL

Comenta **SHOPIFY** y te explico cómo aplicarlo en tu tienda.

---

## NOTAS DE GRABACIÓN
- "¿Esto me servirá a mí?" → texto grande en pantalla, cada pregunta por separado
- "Resultado: el cliente compra solo" → número o checkmark en pantalla
- Tono: diagnóstico directo, sin drama
```

- [ ] **Escribir S10 portada** — `agencia/scripts/shorts/10-ficha-sin-respuesta/portada.html` (ver Task completo en ejecución)

- [ ] **Escribir S11 guion**

`agencia/scripts/shorts/11-visitas-sin-ventas/guion.md`:
```
# SHORT S-11: 200 Visitas al Día y 0 Ventas — El Problema No es el Tráfico

**Duración objetivo: 40-45 segundos**

---

## HOOK

200 visitas al día.

Cero ventas.

El problema no es el tráfico.

---

## DESARROLLO

Si tenés visitas pero no ventas, el problema está en lo que pasa después del click.

La página de producto que no convence.

El precio que no se justifica.

El botón de compra que no genera confianza.

Más anuncios sobre eso solo amplifica la fuga.

Antes de escalar el tráfico, arreglá lo que pasa dentro de la tienda.

Tengo un vídeo donde te explico qué revisar primero y en qué orden.

---

## CTA FINAL

Está en el enlace de la bio.

---

## NOTAS DE GRABACIÓN
- "200 visitas al día. Cero ventas." → números grandes en pantalla
- "amplifica la fuga" → pausa aquí, que aterrice
- Tono: consultor que da un diagnóstico, no alarmista
```

- [ ] **Escribir S12 guion**

`agencia/scripts/shorts/12-dm-sin-responder/guion.md`:
```
# SHORT S-12: Cada DM Sin Responder en 2 Horas es una Venta que se Pierde

**Duración objetivo: 40-45 segundos**

---

## HOOK

Un cliente pregunta por tu producto.

No respondes en 2 horas.

Compra en otro sitio.

---

## DESARROLLO

No es exageración.

El tiempo de respuesta en ecommerce es una palanca de conversión directa.

Y la mayoría de tiendas pierde ventas simplemente por responder tarde.

Un bot bien configurado responde en segundos, con la información correcta, en cualquier horario.

No reemplaza tu criterio.

Gestiona el volumen para que vos te centres en cerrar.

---

## CTA FINAL

Comenta **WHATSAPP** y te cuento cómo montarlo.

---

## NOTAS DE GRABACIÓN
- "Compra en otro sitio." → texto en pantalla con tono de golpe seco
- "responde en segundos" → cronómetro o "< 30s" en pantalla
- Tono: caso real, urgente pero sin nerviosismo
```

- [ ] **Commit Task 1**
```bash
git add agencia/scripts/shorts/10-ficha-sin-respuesta/ agencia/scripts/shorts/11-visitas-sin-ventas/ agencia/scripts/shorts/12-dm-sin-responder/
git commit -m "feat: agencia shorts S10-S12 guiones y portadas"
```

---

## Task 2: Agencia Shorts S13–S15

**Files:**
- Create: `agencia/scripts/shorts/13-abandono-carrito/guion.md` + `portada.html`
- Create: `agencia/scripts/shorts/14-descripcion-vieja/guion.md` + `portada.html`
- Create: `agencia/scripts/shorts/15-email-list-muerta/guion.md` + `portada.html`

- [ ] **Crear carpetas**
```bash
mkdir -p agencia/scripts/shorts/13-abandono-carrito
mkdir -p agencia/scripts/shorts/14-descripcion-vieja
mkdir -p agencia/scripts/shorts/15-email-list-muerta
```

- [ ] **Escribir S13 guion**

`agencia/scripts/shorts/13-abandono-carrito/guion.md`:
```
# SHORT S-13: Tu Carrito Tiene un 70% de Abandono. Aquí lo que Pasa.

**Duración objetivo: 40-45 segundos**

---

## HOOK

El 70% de los carritos se abandonan.

La mayoría de marcas no hace nada al respecto.

---

## DESARROLLO

Recuperar un 10% de ese abandono puede doblar tus ventas sin más tráfico.

La secuencia es simple.

Primer mensaje a las 2 horas.

Segundo al día siguiente.

Tercero con incentivo si es necesario.

Automatizado. Por WhatsApp o email.

Sin intervención manual.

Tengo un vídeo donde explico la secuencia completa paso a paso.

---

## CTA FINAL

Enlace en la bio.

---

## NOTAS DE GRABACIÓN
- "70% de los carritos" → número grande en pantalla
- "doblar tus ventas" → subrayar visualmente
- Tono: solución clara, no dramático
```

- [ ] **Escribir S14 guion**

`agencia/scripts/shorts/14-descripcion-vieja/guion.md`:
```
# SHORT S-14: Llevas 2 Años con la Misma Descripción de Producto

**Duración objetivo: 40-45 segundos**

---

## HOOK

Llevas dos años con la misma descripción de producto.

Y eso te está costando ventas.

---

## DESARROLLO

El mercado cambia.

Las objeciones cambian.

Lo que el cliente necesita entender cambia.

Una descripción escrita en 2023 no habla el idioma de tu cliente en 2026.

Con IA podés analizar qué preguntan ahora, qué les frena, y reescribir la ficha en una tarde.

Sin partir de cero.

---

## CTA FINAL

Comenta **FICHAS** y te mando el proceso exacto.

---

## NOTAS DE GRABACIÓN
- "2023" y "2026" → texto en pantalla, contraste visual
- "en una tarde" → énfasis, que sorprenda
- Tono: directo, no acusatorio
```

- [ ] **Escribir S15 guion**

`agencia/scripts/shorts/15-email-list-muerta/guion.md`:
```
# SHORT S-15: Tu Email List Tiene 3.000 Contactos y No Abre Nadie

**Duración objetivo: 40-45 segundos**

---

## HOOK

Tenés 3.000 suscriptores de email.

Tasa de apertura del 8%.

Eso es dinero dormido.

---

## DESARROLLO

Una lista muerta no es una lista inútil.

Es una lista mal trabajada.

La diferencia entre una lista que vende y una que no, casi siempre está en el primer email de cada secuencia.

Si abre el primero, abre el resto.

Con IA podés reescribir los asuntos y el primer párrafo de toda tu secuencia en una mañana.

---

## CTA FINAL

Comenta **EMAIL** y te envío el framework que uso.

---

## NOTAS DE GRABACIÓN
- "3.000 / 8%" → números en pantalla, pausa entre ellos
- "lista muerta no es lista inútil" → frase clave para texto en pantalla
- Tono: revelación, no reproche
```

- [ ] **Commit Task 2**
```bash
git add agencia/scripts/shorts/13-abandono-carrito/ agencia/scripts/shorts/14-descripcion-vieja/ agencia/scripts/shorts/15-email-list-muerta/
git commit -m "feat: agencia shorts S13-S15 guiones y portadas"
```

---

## Task 3: Agencia Shorts S16–S18

**Files:**
- Create: `agencia/scripts/shorts/16-anuncio-funciona-tienda-no/guion.md` + `portada.html`
- Create: `agencia/scripts/shorts/17-soporte-mismas-preguntas/guion.md` + `portada.html`
- Create: `agencia/scripts/shorts/18-tienda-igual-que-todas/guion.md` + `portada.html`

- [ ] **Crear carpetas**
```bash
mkdir -p agencia/scripts/shorts/16-anuncio-funciona-tienda-no
mkdir -p agencia/scripts/shorts/17-soporte-mismas-preguntas
mkdir -p agencia/scripts/shorts/18-tienda-igual-que-todas
```

- [ ] **Escribir S16 guion**

`agencia/scripts/shorts/16-anuncio-funciona-tienda-no/guion.md`:
```
# SHORT S-16: Tus Anuncios Funcionan. Tu Tienda No Vende. El Problema Está Aquí.

**Duración objetivo: 40-45 segundos**

---

## HOOK

Tu anuncio tiene buenos números.

Pero la tienda no vende.

El fallo está después del click.

---

## DESARROLLO

El anuncio hace que el cliente llegue.

La tienda hace que el cliente compre.

Si el anuncio funciona pero la conversión no llega, el problema está en lo que pasa cuando aterrizan.

Página que no continúa el mensaje del anuncio.

Ficha que no resuelve la objeción principal.

Proceso de compra con fricción.

Tengo un vídeo donde analizo este problema con casos reales.

---

## CTA FINAL

Enlace en la bio.

---

## NOTAS DE GRABACIÓN
- "El fallo está después del click" → texto grande en pantalla
- Listar los tres problemas → aparecen uno a uno en pantalla
- Tono: diagnóstico preciso, no crítica
```

- [ ] **Escribir S17 guion**

`agencia/scripts/shorts/17-soporte-mismas-preguntas/guion.md`:
```
# SHORT S-17: El 80% de Tu Soporte Son las Mismas 5 Preguntas

**Duración objetivo: 40-45 segundos**

---

## HOOK

El 80% de los mensajes que recibís en soporte son las mismas cinco preguntas.

---

## DESARROLLO

Si respondés lo mismo todos los días, ese tiempo se puede automatizar.

No necesitás un equipo de soporte grande.

Necesitás un sistema que filtre bien.

Un bot responde las preguntas frecuentes al instante.

Las complejas llegan a vos ya contextualizadas.

Menos ruido.

Más enfoque en las conversaciones que sí necesitan tu tiempo.

---

## CTA FINAL

Comenta **BOT** y te explico cómo montarlo.

---

## NOTAS DE GRABACIÓN
- "80%" → número grande en pantalla al inicio
- "Las mismas cinco preguntas" → mostrar ejemplos en texto (¿tarda mucho? ¿puedo devolver? etc.)
- Tono: solución de sistema, no queja
```

- [ ] **Escribir S18 guion**

`agencia/scripts/shorts/18-tienda-igual-que-todas/guion.md`:
```
# SHORT S-18: Tu Tienda se Ve Igual que la de Todos

**Duración objetivo: 40-45 segundos**

---

## HOOK

Entrás a tres tiendas del mismo nicho.

Las tres se ven igual.

La tuya probablemente también.

---

## DESARROLLO

Cuando todo parece igual, el cliente compra por precio.

Y esa es una guerra que nadie quiere ganar.

La diferencia no está solo en el diseño.

Está en el copy, en cómo explicás el producto, en la voz que usás, en los detalles que nadie más tiene.

Con IA podés auditar tu tienda y detectar exactamente dónde sos igual que los demás.

---

## CTA FINAL

Comenta **AUDITORIA** y empezamos.

---

## NOTAS DE GRABACIÓN
- Intro: mostrar tres capturas de pantalla genéricas si es posible (b-roll)
- "esa es una guerra que nadie quiere ganar" → pausa, dejar respirar la frase
- Tono: provocador pero propositivo
```

- [ ] **Commit Task 3**
```bash
git add agencia/scripts/shorts/16-anuncio-funciona-tienda-no/ agencia/scripts/shorts/17-soporte-mismas-preguntas/ agencia/scripts/shorts/18-tienda-igual-que-todas/
git commit -m "feat: agencia shorts S16-S18 guiones y portadas"
```

---

## Task 4: Portadas Agencia S10–S18

**Files:** `portada.html` en cada carpeta de short agencia

- [ ] **Generar portadas S10-S18** — ver archivos HTML completos en ejecución (se generan uno a uno con la estructura de `portadas.html`, paleta agencia)

- [ ] **Abrir en navegador para verificar**
```bash
open agencia/scripts/shorts/10-ficha-sin-respuesta/portada.html
open agencia/scripts/shorts/11-visitas-sin-ventas/portada.html
# ... etc.
```

- [ ] **Commit portadas agencia**
```bash
git add agencia/scripts/shorts/1*/portada.html
git commit -m "feat: portadas agencia shorts S10-S18"
```

---

## Task 5: Carruseles C01–C05

**Files:** `agencia/carousel-generator/output/[slug]/`

- [ ] **Ejecutar generate.py × 5**
```bash
cd agencia/carousel-generator
python3 generate.py "Por qué tu conversión está por debajo del 1%"
python3 generate.py "5 automatizaciones post-venta que generan dinero mientras duermes"
python3 generate.py "Cómo saber qué producto optimizar primero sin adivinar"
python3 generate.py "Los 5 emails que toda tienda debería tener automatizados hoy"
python3 generate.py "Cómo subir el ticket medio sin más tráfico ni más anuncios"
```

- [ ] **Verificar output** — cada carpeta debe tener `copy.json` + 8 `slide_XX.png`
```bash
ls output/ | head -20
```

- [ ] **Commit**
```bash
git add carousel-generator/output/
git commit -m "feat: carruseles C01-C05 generados"
```

---

## Task 6: Carruseles C06–C09

- [ ] **Ejecutar generate.py × 4**
```bash
cd agencia/carousel-generator
python3 generate.py "Lo que hacen las tiendas que más convierten que tú no haces"
python3 generate.py "Por qué tu anuncio funciona pero tu tienda no cierra"
python3 generate.py "El error de soporte que te está costando reseñas de 5 estrellas"
python3 generate.py "Cómo usar IA para escribir fichas de producto que convierten"
```

- [ ] **Verificar** — 4 carpetas nuevas en output/

- [ ] **Commit**
```bash
git add carousel-generator/output/
git commit -m "feat: carruseles C06-C09 generados"
```

---

## Task 7: Simulia Shorts SS01–SS03 (guiones + portadas)

**Files:**
- Create: `simulia/scripts/SS01-barthel/guion.md` + `portada.html`
- Create: `simulia/scripts/SS02-farmacos-sva/guion.md` + `portada.html`
- Create: `simulia/scripts/SS03-upp-estadios/guion.md` + `portada.html`

- [ ] **Crear carpetas**
```bash
mkdir -p simulia/scripts/SS01-barthel
mkdir -p simulia/scripts/SS02-farmacos-sva
mkdir -p simulia/scripts/SS03-upp-estadios
```

- [ ] **Escribir SS01 guion**

`simulia/scripts/SS01-barthel/guion.md`:
```
# SHORT SS-01: Escala de Barthel — La Trampa de los Puntos de Corte

**Duración objetivo: 45-55 segundos**
**Fuente:** Mahoney & Barthel, Md State Med J, 1965

---

## HOOK

La escala de Barthel tiene truco.

Y en el EIR caen exactamente esos puntos de corte.

---

## VALOR CLAVE + TRAMPA

La escala mide de 0 a 100. Los cortes que salen en examen:

- Menos de 20: dependencia total
- 20 a 40: dependencia grave
- 45 a 60: dependencia moderada
- 65 a 90: dependencia leve
- 95 o más: independiente

La trampa: muchos memorizan "menos de 60 es dependencia" sin distinguir los grados.

Y en el EIR te dan un caso y te preguntan el nivel exacto.

---

## CTA

Si estás preparando el EIR, en Simulia tienes preguntas de escalas de valoración filtradas por área.

7 días de prueba gratis.

Enlace en bio.

---

## NOTAS DE GRABACIÓN
- Tabla de puntos de corte en pantalla mientras los dices
- "La trampa" → pausa, texto en rojo o subrayado
- Tono: compañero EIR que te da el dato que necesitás
```

- [ ] **Escribir SS02 guion**

`simulia/scripts/SS02-farmacos-sva/guion.md`:
```
# SHORT SS-02: Fármacos SVA — Adrenalina, Amiodarona, Atropina

**Duración objetivo: 50-60 segundos**
**Fuente:** ERC Guidelines 2021 (Soar et al.)

---

## HOOK

Adrenalina, amiodarona, atropina en el SVA.

Tres fármacos. Tres trampas de examen.

---

## VALOR CLAVE + TRAMPA

Adrenalina: 1 mg IV/IO cada 3 a 5 minutos.

En ritmos desfibrilables, la das después del tercer choque.

En no desfibrilables, lo antes posible.

Amiodarona: 300 mg en FV/TV refractaria después de tres choques.

Segundo bolo de 150 mg si es necesario.

Y aquí está la trampa:

Atropina ya NO se recomienda de rutina en asistolia desde ERC 2015.

Pero sigue cayendo en el examen como distractor.

Si ves atropina como opción en una pregunta de asistolia, no la elijas.

---

## CTA

En Simulia practicás esto con preguntas tipo EIR hasta que te sale solo.

7 días gratis. Enlace en bio.

---

## NOTAS DE GRABACIÓN
- Cada fármaco con su dosis → texto en pantalla
- "Atropina ya NO se recomienda" → texto en pantalla con ❌
- Tono: repaso rápido de guardia, sin drama
```

- [ ] **Escribir SS03 guion**

`simulia/scripts/SS03-upp-estadios/guion.md`:
```
# SHORT SS-03: Estadios UPP — La Diferencia entre III y IV que Siempre Cae

**Duración objetivo: 45-55 segundos**
**Fuente:** NPUAP/EPUAP/PPPIA Clinical Practice Guideline 2019

---

## HOOK

Estadio III o estadio IV de úlcera por presión.

Un detalle marca la diferencia en el EIR.

---

## VALOR CLAVE + TRAMPA

La clave es una sola cosa:

Estadio III: pérdida total del grosor de la piel. Se puede ver grasa subcutánea.

Pero NO hay exposición de hueso, tendón ni músculo.

Estadio IV: ya hay exposición ósea, tendinosa o muscular.

Un estadio III puede ser muy profundo y tener necrosis.

Pero mientras no veas hueso o tendón, no es estadio IV.

Ese es el criterio. Ese es el que cae.

---

## CTA

Practica preguntas de úlceras y todos los temas EIR con 7 días gratis en Simulia.

Enlace en bio.

---

## NOTAS DE GRABACIÓN
- Tabla Estadio III vs IV en pantalla lado a lado
- "NO hay exposición" → texto en pantalla con ❌ rojo
- "ya hay exposición" → ✓ en diferente color
- Tono: enfermero explicando al compañero en pasillo
```

- [ ] **Commit Task 7**
```bash
git add simulia/scripts/SS01-barthel/ simulia/scripts/SS02-farmacos-sva/ simulia/scripts/SS03-upp-estadios/
git commit -m "feat: simulia shorts SS01-SS03 guiones y portadas"
```

---

## Task 8: Simulia Shorts SS04–SS06

**Files:**
- Create: `simulia/scripts/SS04-constantes-vitales/guion.md` + `portada.html`
- Create: `simulia/scripts/SS05-braden/guion.md` + `portada.html`
- Create: `simulia/scripts/SS06-dolor-abdominal/guion.md` + `portada.html`

- [ ] **Crear carpetas**
```bash
mkdir -p simulia/scripts/SS04-constantes-vitales
mkdir -p simulia/scripts/SS05-braden
mkdir -p simulia/scripts/SS06-dolor-abdominal
```

- [ ] **Escribir SS04 guion**

`simulia/scripts/SS04-constantes-vitales/guion.md`:
```
# SHORT SS-04: Constantes Vitales Adulto vs Pediátrico

**Duración objetivo: 50-60 segundos**
**Fuente:** PALS Guidelines / Temario EIR semiología

---

## HOOK

En el EIR te dan constantes y te preguntan si son normales.

Sin saber los rangos por edad, es imposible acertar.

---

## VALOR CLAVE + TRAMPA

Los que más caen:

Adulto: FC 60 a 100. FR 12 a 20.

Neonato: FC 120 a 160. FR 40 a 60.

Lactante hasta 1 año: FC 100 a 160. FR 30 a 60.

Preescolar 2 a 6 años: FC 80 a 130. FR 20 a 30.

Tensión arterial normal adulto: por debajo de 120 sobre 80.

La trampa: una FR de 45 en un adulto es taquipnea grave. En un neonato es completamente normal.

Te dan el dato sin decirte la edad y tienes que saberlo.

---

## CTA

En Simulia tienes preguntas filtradas por rango de edad para fijar estos rangos.

7 días gratis. Enlace en bio.

---

## NOTAS DE GRABACIÓN
- Tabla por grupos de edad en pantalla mientras los dices
- "La trampa" → el mismo dato, distintos colores según edad
- Tono: repaso de guardia, ritmo rápido
```

- [ ] **Escribir SS05 guion**

`simulia/scripts/SS05-braden/guion.md`:
```
# SHORT SS-05: Escala de Braden — Qué Puntuación Activa el Protocolo

**Duración objetivo: 45-55 segundos**
**Fuente:** Bergstrom et al., Nursing Research, 1987

---

## HOOK

Braden mide riesgo de úlcera por presión.

Y los puntos de corte son exactamente los que caen en examen.

---

## VALOR CLAVE + TRAMPA

La escala va de 6 a 23.

Igual o menos de 9: riesgo muy alto.

10 a 12: riesgo alto.

13 a 14: riesgo moderado.

15 a 18: riesgo bajo.

19 o más: sin riesgo significativo.

La trampa en el EIR: te dan una puntuación y te preguntan qué medidas activas.

Confundir riesgo alto con muy alto cambia completamente la respuesta.

---

## CTA

Practica Braden y todas las escalas EIR en Simulia.

7 días gratis. Enlace en bio.

---

## NOTAS DE GRABACIÓN
- Tabla de puntos de corte → aparece progresivamente
- Resaltar la zona 10-12 vs 13-14 como la más confusa
- Tono: directo, el dato primero
```

- [ ] **Escribir SS06 guion**

`simulia/scripts/SS06-dolor-abdominal/guion.md`:
```
# SHORT SS-06: Dolor Abdominal por Cuadrantes — Lo que Siempre Confunden

**Duración objetivo: 50-60 segundos**
**Fuente:** Semiología clínica EIR / Harrison's Principles of Internal Medicine

---

## HOOK

Cuadrante superior derecho.

El dolor ahí apunta a dos diagnósticos.

Y uno siempre confunde en el EIR.

---

## VALOR CLAVE + TRAMPA

Cuadrante superior derecho: hígado y vesícula.

El cólico biliar duele aquí y puede irradiar al hombro derecho.

Cuadrante superior izquierdo: bazo y cola del páncreas.

Cuadrante inferior derecho: apéndice y ovario derecho.

Cuadrante inferior izquierdo: sigma y ovario izquierdo.

La trampa más típica: el signo de Murphy está en cuadrante superior derecho, no en el inferior.

Y la irradiación al hombro derecho se llama signo de Kehr, no solo en esplenomegalia.

Mucha gente los mezcla cuando el caso describe dolor en la inspiración.

---

## CTA

7 días gratis en Simulia para practicar casos de abdomen agudo y mucho más.

Enlace en bio.

---

## NOTAS DE GRABACIÓN
- Esquema de abdomen con cuadrantes en pantalla
- Murphy → CSD con flecha
- Irradiación → línea hasta hombro D
- Tono: viñeta clínica rápida
```

- [ ] **Commit Task 8**
```bash
git add simulia/scripts/SS04-constantes-vitales/ simulia/scripts/SS05-braden/ simulia/scripts/SS06-dolor-abdominal/
git commit -m "feat: simulia shorts SS04-SS06 guiones y portadas"
```

---

## Task 9: Simulia Shorts SS07–SS09

**Files:**
- Create: `simulia/scripts/SS07-diuresis/guion.md` + `portada.html`
- Create: `simulia/scripts/SS08-sgb-embarazo/guion.md` + `portada.html`
- Create: `simulia/scripts/SS09-escalas-dolor/guion.md` + `portada.html`

- [ ] **Crear carpetas**
```bash
mkdir -p simulia/scripts/SS07-diuresis
mkdir -p simulia/scripts/SS08-sgb-embarazo
mkdir -p simulia/scripts/SS09-escalas-dolor
```

- [ ] **Escribir SS07 guion**

`simulia/scripts/SS07-diuresis/guion.md`:
```
# SHORT SS-07: Diuresis Normal — Los 3 Valores que Tienes que Saber de Memoria

**Duración objetivo: 45-55 segundos**
**Fuente:** Temario EIR nefrología / KDIGO Guidelines

---

## HOOK

La diuresis tiene tres valores que tienes que saber de memoria para el EIR.

---

## VALOR CLAVE + TRAMPA

Diuresis normal en adulto: 0,5 a 1 mililitro por kilo por hora.

Eso equivale a 800 a 2.000 mililitros en 24 horas.

Oliguria: menos de 0,5 ml por kilo por hora.

O menos de 400 ml en 24 horas.

Anuria: menos de 100 ml en 24 horas.

La trampa típica de UCI: te dan el peso del paciente y el volumen horario y te preguntan si hay oliguria.

Operación: peso multiplicado por 0,5 multiplicado por las horas.

Si el volumen real está por debajo de ese número, oliguria.

---

## CTA

Simulia tiene preguntas de nefrología filtradas por tema.

7 días gratis. Enlace en bio.

---

## NOTAS DE GRABACIÓN
- Los tres valores: normal / oliguria / anuria → tabla en pantalla
- La operación → escribirla mientras la dices: "70 kg × 0,5 × 1h = 35 ml/h"
- Tono: técnico pero claro, como explicando en prácticas
```

- [ ] **Escribir SS08 guion**

`simulia/scripts/SS08-sgb-embarazo/guion.md`:
```
# SHORT SS-08: Estreptococo Grupo B en el Embarazo — Cuándo Hacer Profilaxis

**Duración objetivo: 55-65 segundos**
**Fuente:** SEGO Protocolo SGB 2022 / CDC Guidelines

---

## HOOK

El estreptococo grupo B en el embarazo tiene un protocolo muy concreto.

Y en el EIR siempre preguntan las indicaciones de profilaxis.

---

## VALOR CLAVE + TRAMPA

El screening es universal: cultivo vagino-rectal entre semana 35 y 37.

Si el resultado es positivo: profilaxis intraparto con penicilina G.

Si hay alergia, ampicilina o según sensibilidad.

Pero hay situaciones donde haces profilaxis aunque no tengas el cultivo:

Parto antes de semana 37.

Rotura de membranas más de 18 horas.

Fiebre intraparto de 38 grados o más.

Hijo anterior con sepsis neonatal por SGB.

Bacteriuria por SGB en esta gestación.

La trampa del EIR: te dan una situación sin resultado de cultivo y te preguntan si debes hacer profilaxis.

La respuesta es sí si cumple cualquiera de esas condiciones.

---

## CTA

Practica obstetricia tipo EIR en Simulia.

7 días gratis. Enlace en bio.

---

## NOTAS DE GRABACIÓN
- Lista de indicaciones sin cultivo → aparecen en pantalla una a una
- "La trampa del EIR" → resaltar visualmente
- Tono: protocolo clínico real, firme y claro
```

- [ ] **Escribir SS09 guion**

`simulia/scripts/SS09-escalas-dolor/guion.md`:
```
# SHORT SS-09: EVA, Escala Numérica, CPOT — Cuál Usar y Cuándo

**Duración objetivo: 45-55 segundos**
**Fuente:** IASP Definitions / Temario EIR enfermería crítica

---

## HOOK

EVA, escala numérica, CPOT.

Tres escalas del dolor.

¿Sabes cuál NO usar en un paciente sedado?

---

## VALOR CLAVE + TRAMPA

La EVA y la escala numérica del 0 al 10 requieren que el paciente pueda comunicarse.

Si está sedado, inconsciente o intubado, esas escalas no aplican.

En esos casos usas escalas conductuales: la CPOT o la de Campbell.

Valoran gestos, rigidez muscular, adaptación al respirador.

La trampa del EIR: te dan un caso de UCI con paciente sedado y te preguntan qué escala usar.

La respuesta nunca es EVA.

Nunca.

---

## CTA

En Simulia practicás estos casos clínicos hasta que los tenés automatizados.

7 días gratis. Enlace en bio.

---

## NOTAS DE GRABACIÓN
- Tabla: escalas comunicativas vs escalas conductuales
- "La respuesta nunca es EVA. Nunca." → pausa larga, texto en pantalla
- Tono: compañero que te avisa antes del examen
```

- [ ] **Commit Task 9**
```bash
git add simulia/scripts/SS07-diuresis/ simulia/scripts/SS08-sgb-embarazo/ simulia/scripts/SS09-escalas-dolor/
git commit -m "feat: simulia shorts SS07-SS09 guiones y portadas"
```

---

## Task 10: Dashboard — Añadir 18 shorts a state.json

**Files:** Modify `dashboard/state.json`

- [ ] **Añadir al array `scripts`** los siguientes 18 objetos (insertar después del último elemento existente):

```json
{ "id": "ag-s10", "project": "agencia", "type": "short", "folder": "shorts/10-ficha-sin-respuesta", "title": "Tu ficha tiene la respuesta y el cliente igual se va", "status": "idea", "scheduledDate": null, "notes": "" },
{ "id": "ag-s11", "project": "agencia", "type": "short", "folder": "shorts/11-visitas-sin-ventas", "title": "200 visitas al día y 0 ventas — el problema no es el tráfico", "status": "idea", "scheduledDate": null, "notes": "" },
{ "id": "ag-s12", "project": "agencia", "type": "short", "folder": "shorts/12-dm-sin-responder", "title": "Cada DM sin responder en 2h es una venta que se pierde", "status": "idea", "scheduledDate": null, "notes": "" },
{ "id": "ag-s13", "project": "agencia", "type": "short", "folder": "shorts/13-abandono-carrito", "title": "Tu carrito tiene un 70% de abandono. Aquí lo que pasa.", "status": "idea", "scheduledDate": null, "notes": "" },
{ "id": "ag-s14", "project": "agencia", "type": "short", "folder": "shorts/14-descripcion-vieja", "title": "Llevas 2 años con la misma descripción de producto", "status": "idea", "scheduledDate": null, "notes": "" },
{ "id": "ag-s15", "project": "agencia", "type": "short", "folder": "shorts/15-email-list-muerta", "title": "Tu email list tiene 3.000 contactos y no abre nadie", "status": "idea", "scheduledDate": null, "notes": "" },
{ "id": "ag-s16", "project": "agencia", "type": "short", "folder": "shorts/16-anuncio-funciona-tienda-no", "title": "Tus anuncios funcionan. Tu tienda no vende.", "status": "idea", "scheduledDate": null, "notes": "" },
{ "id": "ag-s17", "project": "agencia", "type": "short", "folder": "shorts/17-soporte-mismas-preguntas", "title": "El 80% del soporte son las mismas 5 preguntas", "status": "idea", "scheduledDate": null, "notes": "" },
{ "id": "ag-s18", "project": "agencia", "type": "short", "folder": "shorts/18-tienda-igual-que-todas", "title": "No tienes más ventas porque tu tienda se ve igual que la de todos", "status": "idea", "scheduledDate": null, "notes": "" },
{ "id": "sim-ss01", "project": "simulia", "type": "short", "folder": "scripts/SS01-barthel", "title": "Escala de Barthel — la trampa de los puntos de corte", "status": "idea", "scheduledDate": null, "notes": "" },
{ "id": "sim-ss02", "project": "simulia", "type": "short", "folder": "scripts/SS02-farmacos-sva", "title": "Fármacos SVA — adrenalina, amiodarona y la trampa de la atropina", "status": "idea", "scheduledDate": null, "notes": "" },
{ "id": "sim-ss03", "project": "simulia", "type": "short", "folder": "scripts/SS03-upp-estadios", "title": "Estadios UPP — la diferencia entre III y IV que siempre cae", "status": "idea", "scheduledDate": null, "notes": "" },
{ "id": "sim-ss04", "project": "simulia", "type": "short", "folder": "scripts/SS04-constantes-vitales", "title": "Constantes vitales adulto vs pediátrico", "status": "idea", "scheduledDate": null, "notes": "" },
{ "id": "sim-ss05", "project": "simulia", "type": "short", "folder": "scripts/SS05-braden", "title": "Escala de Braden — qué puntuación activa el protocolo", "status": "idea", "scheduledDate": null, "notes": "" },
{ "id": "sim-ss06", "project": "simulia", "type": "short", "folder": "scripts/SS06-dolor-abdominal", "title": "Dolor abdominal por cuadrantes — lo que siempre confunden", "status": "idea", "scheduledDate": null, "notes": "" },
{ "id": "sim-ss07", "project": "simulia", "type": "short", "folder": "scripts/SS07-diuresis", "title": "Diuresis normal — oliguria y anuria, los 3 valores de memoria", "status": "idea", "scheduledDate": null, "notes": "" },
{ "id": "sim-ss08", "project": "simulia", "type": "short", "folder": "scripts/SS08-sgb-embarazo", "title": "Estreptococo grupo B — cuándo hacer profilaxis sin cultivo", "status": "idea", "scheduledDate": null, "notes": "" },
{ "id": "sim-ss09", "project": "simulia", "type": "short", "folder": "scripts/SS09-escalas-dolor", "title": "Escalas del dolor — EVA vs CPOT, cuál nunca usar en sedado", "status": "idea", "scheduledDate": null, "notes": "" }
```

- [ ] **Verificar** — abrir dashboard y comprobar que el tab Contenido muestra 18 nuevas entradas en estado "idea"

- [ ] **Commit**
```bash
git add dashboard/state.json
git commit -m "feat: añadir 18 shorts al pipeline del dashboard"
```
