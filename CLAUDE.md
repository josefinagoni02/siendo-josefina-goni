# Siendo · Josefina Goñi

Landing personal de Josefina Goñi. Es una sola página HTML estática, publicada en Vercel desde este repo.
Cada push a `main` se publica solo.

- Repo: `josefinagoni02/siendo-josefina-goni`
- Sitio: `siendo-josefina-goni.vercel.app` (dominio propio: pendiente)
- Idioma: español rioplatense (voseo). Tono cálido, simple, sin frases rebuscadas.

## Archivos

- `index.html`: toda la página (HTML + CSS + JS en un solo archivo).
- `atlas-motion.js`: el video animado del Atlas (canvas, ~6 MB, trae las fotos adentro). Se carga recién cuando hace falta (hover o apertura del modal de Atlas). Sale del artifact "Atlas en movimiento" y no se edita a mano.
- `img/`: fotos usadas en la página.
  - Atlas: `obelisco`, `el-viaje`, `tantos-angulos`, `atlas-home` (captura del mapa del Atlas, sin panel derecho)
  - Atardeceres: `arcoiris`, `expansion-naranja`, `inmersos`
  - Creadora de ropa: `vestido`
  - Álbum: `familia`, `amigas`, `companero`

## Cómo trabajar acá

- Editar `index.html` directo. Después de cada cambio: revisar que el script no tenga errores, probar en compu (~1300 px) y celular (390 px), y verificar que no haya scroll horizontal.
- No armar zips ni mandar archivos salvo que Josefina lo pida.
- Hacer commit y push solo cuando ella lo pida.
- No inventar datos. Lo que falta va como `[placeholder]` y se avisa.
- No reproducir logos de marcas (Instagram, WhatsApp): usar íconos genéricos.

## Diseño

- **Fondo:** cielo en canvas con nubes suaves que se mueven. El cursor da paralaje y "viento". De día por defecto.
- **Hora:** el cielo sigue la hora de Buenos Aires solo si se elige "Ver hora local".
  - Momentos: noche (sin nubes, solo estrellas y la constelación de Acuario), amanecer, día, atardecer (violeta, rosa y naranja; nubes con luz cálida abajo).
  - Abajo a la derecha: chip "Located in Buenos Aires, AR". Con hover/clic abre la línea de tiempo del cielo. Al lado, botón "Ver hora local".
  - "✦ Mi hora favorita" (abajo a la izquierda, aparece después del intro) lleva el cielo a las 18:50. Al activarla aparece "Colección de atardeceres", un carrusel con fotos del Atlas y un CTA al probador.
  - Al bajar hacia la frase final, el cielo pasa solo del día al atardecer.
- **Tipografía:** Instrument Serif (display e itálicas), Figtree (texto), Caveat (manuscrita: polaroids, notas).
- **Colores:** tinta `#14284a`, vidrio blanco translúcido para las cards, pin rosa `#e0607e`, noche `#121a40`.
- **Intro:** el nombre entra letra por letra, grande. Con scroll se achica, aparece la frase y las cards se condensan de niebla a vidrio.

## Contenido

**Hero:** "Hola, soy / Josefina Goñi / Siendo, un poquito de todo. Integrando todas mis versiones aquí." Debajo va el chip "Acuariana", que de noche se mueve al centro de la constelación.

**Acuariana (modal "Mi carta"):** carta astral que se dibuja. Sol en Acuario, Luna en Escorpio, Ascendente en Cáncer, con íconos en vez de palabras en las cajitas. Fecha: 03.02.2002. "Tengo 24 y estoy viviendo mi año 25." (Actualizar la edad después del 3 de febrero.)

**Cards.** Cada una tiene una interacción en hover y abre un modal con zoom.

1. **Atlas** (Fotografía). "Un pedacito fotográfico del mundo en mi mapa personal."
   - Hover: grilla de mapa con cruz y coordenadas reales de Buenos Aires.
   - Modal: video `atlas-motion.js` en loop. Bloque "Abrir el Atlas" con la captura `atlas-home` y "23 obras · 5 países". Después la sección **Cuadros** (Impresiones Fine Art, a pedido), con 3 obras que se enmarcan solas, toggle Marco negro / blanco y paspartú blanco:
     - Ciudad Emblemática · Buenos Aires, Argentina
     - El viaje · El Bolsón, Argentina
     - Tantos ángulos · San Francisco, Estados Unidos
   - CTAs: Probar en mi pared, Ver impresiones.
   - Links: `https://atlas-josefina-goni.vercel.app/#catalogo`, `#impresion`, `#probador`.
2. **Lunática** (Fanática de la luna). Línea "Próximo: Luna Llena en Tauro · dom 25.10". Pie: "Talleres".
   - Hover: la card se hace de noche, una luna sigue al cursor y tiene reflejo transparente (sin ondas).
   - Modal: se abre directo de noche y la luna sigue al cursor. Texto: "El ciclo lunar y la astrología como herramienta de autoconocimiento. Una invitación a reconocer nuestra naturaleza cíclica y la energía disponible de cada uno."
   - Caja de vidrio "Próximo taller":
     - Luna Llena en Tauro. "Reflexionar sobre qué sostengo por comodidad y costumbre, para actualizarnos y vivir en más coherencia con quien somos hoy."
     - Domingo 25.10 · 17 a 18 h · Café Convite, San Isidro · Con Dos Mitades · Pop Up.
     - Botón "Sacá tu entrada" (`https://app.produtik.com/evento/V5KmkXcUjDllpNNj56jUnA`), con la nota "Acceso al evento. El taller es gratuito."
     - Mini mapa a Google Maps: Av. Juan Segundo Fernández 59, Lomas de San Isidro.
   - Afuera de la caja: "Unirme a la comunidad" (`https://chat.whatsapp.com/E16ZKquB4Uj5HLRH1IPvfQ?mode=gi_t`) y "Ver todos los talleres" (Notion: `https://app.notion.com/p/Talleres-Presenciales-3a57e0424373817b9af5dd4986c2c283`).
   - **Después del 25.10 hay que cambiar el próximo taller a mano** (card y modal).
3. **Profesional** · Product Owner / Manager.
   - Chips "Apasionada por": resolver problemas, data, growth, tecnología, AI, innovación, creatividad, equipo, agilidad. En hover se corren del cursor.
   - Modal: primero los chips (que se ordenan solos), después "Hoy en Amalgama · Hace 2 años · Consultoría y desarrollo de software" (píxeles que reaccionan al cursor y `> creating awesome products` tipeado), y el botón Ver LinkedIn.
   - Link: `https://www.linkedin.com/in/josefina-go%C3%B1i-a26767215/`.
4. **Jousie** (Diario · Instagram, @jou__sie).
   - Card: solo "Posts de…", que se termina de escribir con el movimiento del cursor.
   - Modal: se tipea "Posts de mi diario y registros." Después, en itálica, "Un pedacito de lo que hay en mi colección de cuadernos, en versión redes." Chips: 328 publicaciones · Desde 2020. Hoja rayada borrosa con "Mandame follow ;)" (cuenta privada: no poner posts).
   - Botón: Ver en Instagram (`https://www.instagram.com/jou__sie/`).
5. **Creadora de ropa** (Mis obras). Cita con barrita: "Feliz de materializar mi visión y disfrutar del proceso de evolución."
   - Hover: el cursor deja una puntada.
   - Modal: foto `vestido` borrosa que se desbloquea cosiendo encima con el cursor (puntada punteada, sin botón). Polaroid con "Esta soy yo." a mano.
   - Bloque "Comenzó con… The Night Co · 2019 – 2023" (`https://www.instagram.com/thenight.co/`).
   - "Últimas joyitas…": Vestido de gamuza · Cinturón con hebilla en bronce. Sin números, sin flechas, sin aros.

**Cierre**, en este orden:
1. Nube que se condensa: "Siempre ideando cositas… / y materializando".
2. Frase sobre el atardecer: "No sé dónde voy a estar en 10 años. Sí sé que voy a estar redescubriéndome, aprendiendo y creando." Firma: Jousie.
3. "Gracias" con el botón "Abrir álbum". Modal: "No sería nada de esto sin mi gente." Pila de polaroids que se pasan tocando:
   - Gracias a mi familia
   - Gracias a mis amigas
   - Gracias a mi compañero
   - Gracias a todos los que me acompañan (corazón tipo emoji que late)
4. Contacto: postal que se da vuelta.
   - Frente: "¿Hablamos?" con 34°36′ S · 58°23′ O · Buenos Aires.
   - Dorso: "Escribime y charlamos." Mail josefinagoni02@gmail.com · Número +54 9 11 5348-3183 · Instagram @josefinagoni__, cada uno con botón Copiar. Al copiar aparece el sello "¡Enviado al cielo!".

## Referencias (artifacts en claude.ai)

- Landing (versión de trabajo anterior al repo): https://claude.ai/artifact/Tv3fWNE4DKHaPT68SAsE3y
- Exploraciones de interacción (opciones elegidas, ideas y pendientes): https://claude.ai/artifact/8yxZgJyhXi7J58fMDN2Mtp
- Atlas en movimiento (fuente de `atlas-motion.js`): https://claude.ai/artifact/7MrMcgwYMNnmnKQ4CR5Xkm
- Mapa Luna Llena en Tauro (estética de mapa a mano para Lunática): https://claude.ai/artifact/RXVAzLEdSBNf87wHL7Bb63

Desde ahora, **este repo es la versión oficial**. El artifact de la landing quedó como referencia.

## Pendientes e ideas

- **Flowry:** app vibecodeada de hábitos de conciencia y gratitud, para cultivar intención y dirección. Está en Exploraciones: teléfono interactivo con pantallas genéricas (Hoy, Hábitos, Gratitud, Jardín) y CTA "Anotarme en la beta". Idea: card propia "Side project · Beta" más una línea en Profesional, "Fuera del trabajo también construyo: Flowry →". Falta: screenshots de la app (usar diseño genérico, sin datos personales) y el link real del formulario de lista de espera (Tally o Google Forms).
- **Unir los puntos:** línea de tiempo en Exploraciones. 2018 costura · 2019 The Night Co · Minnesota · Madrid · 2020 Jousie · 2023 cierra The Night Co · 2024 Amalgama · Atlas · Lunática · 2025 joyería · 2026 vestido y Flowry → todo se une en "Hoy". Faltan los años de Minnesota, Madrid, Atlas y Lunática.
- **Lunática:** mapa genérico "cómo leo una luna" que se completa con flechas, y calendario lunar con talleres cargados a mano.
- **Guardado para después:** frase rotativa con todas las versiones (fotógrafa, product owner, lunática, Jousie, viajera, fanática de la playa, runner); barra vertical de km para runner (hasta 15 km, "Corro para poder viajar"); libros, música, tarot; cafecitos con ranking y recorrido; mapa de pendientes; "Located in" con Minnesota y Madrid.
- **Dominio propio** (por ejemplo `josefinagoni.com` o `.com.ar`).
- **Probador del Atlas:** ver si acepta un dato en el link para abrir directo con una foto elegida.
