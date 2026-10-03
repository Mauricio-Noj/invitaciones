(() => {
  "use strict";

  const $ = (sel, raiz = document) => raiz.querySelector(sel);
  const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];
  const reducirMovimiento = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Rellenar textos desde CONFIG ---------- */
  $$("[data-campo]").forEach((el) => {
    el.textContent = CONFIG[el.dataset.campo] || "";
  });
  $$("[data-requiere]").forEach((el) => {
    if (!CONFIG[el.dataset.requiere]) el.remove();
  });

  /* ---------- Pantalla de entrada ---------- */
  const intro = $("#intro");
  const audio = $("#audio");
  const btnMusica = $("#btn-musica");

  const lineas = [
    "$ ./graduacion.sh --usuario brandon",
    "> Compilando 5 años de esfuerzo...",
    "> Ejecutando pruebas finales......  OK",
    "> Tesis aprobada ✔",
    "> Título: Ingeniero en Ciencias y Sistemas",
    "> Build exitoso. Hora de celebrar 🎉",
  ];

  function escribirIntro() {
    const pre = $("#intro-codigo");
    if (reducirMovimiento) {
      pre.textContent = lineas.join("\n");
      return;
    }
    let l = 0, c = 0;
    (function paso() {
      if (l >= lineas.length) return;
      if (c <= lineas[l].length) {
        pre.textContent = lineas.slice(0, l).join("\n") + (l ? "\n" : "") + lineas[l].slice(0, c);
        c++;
        setTimeout(paso, l === 0 ? 45 : 22);
      } else {
        l++; c = 0;
        setTimeout(paso, 260);
      }
    })();
  }
  escribirIntro();

  $("#btn-abrir").addEventListener("click", () => {
    intro.classList.add("intro--fuera");
    document.body.classList.remove("bloqueado");
    setTimeout(() => intro.remove(), 900);
    btnMusica.hidden = false;
    audio.volume = 0.6;
    audio.play().then(() => actualizarMusica(true)).catch(() => actualizarMusica(false));
  });

  function actualizarMusica(sonando) {
    btnMusica.classList.toggle("musica--pausa", !sonando);
    btnMusica.setAttribute("aria-label", sonando ? "Pausar música" : "Reproducir música");
  }
  btnMusica.addEventListener("click", () => {
    if (audio.paused) audio.play().then(() => actualizarMusica(true));
    else { audio.pause(); actualizarMusica(false); }
  });

  /* ---------- Cuenta regresiva ---------- */
  const fecha = new Date(CONFIG.fechaEvento);
  const unidades = Object.fromEntries($$("#cuenta [data-u]").map((el) => [el.dataset.u, el]));

  function tic() {
    const resta = fecha - Date.now();
    if (resta <= 0) {
      $("#cuenta").hidden = true;
      $("#cuenta-fin").hidden = false;
      return false;
    }
    const s = Math.floor(resta / 1000);
    unidades.dias.textContent = Math.floor(s / 86400);
    unidades.horas.textContent = String(Math.floor((s % 86400) / 3600)).padStart(2, "0");
    unidades.min.textContent = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    unidades.seg.textContent = String(s % 60).padStart(2, "0");
    return true;
  }
  if (tic()) {
    const id = setInterval(() => { if (!tic()) clearInterval(id); }, 1000);
  }

  /* ---------- Calendario, mapa y enlaces ---------- */
  const aUTC = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const fin = new Date(fecha.getTime() + CONFIG.duracionHoras * 3600e3);
  const lugarCompleto = `${CONFIG.lugarNombre}, ${CONFIG.lugarDireccion}`;
  const busqueda = encodeURIComponent(CONFIG.mapaBusqueda);

  $("#btn-calendario").href =
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    "&text=" + encodeURIComponent(`Graduación de ${CONFIG.nombre}`) +
    "&dates=" + aUTC(fecha) + "/" + aUTC(fin) +
    "&details=" + encodeURIComponent(`Celebración de graduación como ${CONFIG.titulo}.`) +
    "&location=" + encodeURIComponent(lugarCompleto);

  $("#mapa").src = `https://www.google.com/maps?q=${busqueda}&output=embed`;
  $("#btn-maps").href = CONFIG.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${busqueda}`;
  $("#btn-waze").href = CONFIG.coordenadas
    ? `https://waze.com/ul?ll=${CONFIG.coordenadas}&navigate=yes`
    : `https://waze.com/ul?q=${busqueda}&navigate=yes`;
  $("#btn-tesis").href = CONFIG.tesisUrl;

  /* ---------- Familias ---------- */
  const listaFamilias = $("#familias");
  CONFIG.familias.forEach((f) => {
    const li = document.createElement("li");
    li.textContent = `Familia ${f}`;
    listaFamilias.appendChild(li);
  });

  /* ---------- Galería + visor ---------- */
  const galeria = $("#galeria");
  CONFIG.galeria.forEach((foto, i) => {
    const btn = document.createElement("button");
    btn.className = "galeria__item";
    btn.setAttribute("aria-label", `Ver foto: ${foto.alt}`);
    btn.innerHTML = `<img src="${foto.src}" alt="${foto.alt}" loading="lazy" width="2048" height="1365">`;
    btn.addEventListener("click", () => abrirVisor(i));
    galeria.appendChild(btn);
  });

  const visor = $("#visor");
  const visorImg = $("img", visor);
  let actual = 0;

  function mostrar(i) {
    actual = (i + CONFIG.galeria.length) % CONFIG.galeria.length;
    visorImg.src = CONFIG.galeria[actual].src;
    visorImg.alt = CONFIG.galeria[actual].alt;
  }
  function abrirVisor(i) {
    mostrar(i);
    visor.hidden = false;
    document.body.classList.add("bloqueado");
    $(".visor__cerrar").focus();
  }
  function cerrarVisor() {
    visor.hidden = true;
    document.body.classList.remove("bloqueado");
  }
  $(".visor__cerrar").addEventListener("click", cerrarVisor);
  $(".visor__nav--ant").addEventListener("click", () => mostrar(actual - 1));
  $(".visor__nav--sig").addEventListener("click", () => mostrar(actual + 1));
  visor.addEventListener("click", (e) => { if (e.target === visor) cerrarVisor(); });
  document.addEventListener("keydown", (e) => {
    if (visor.hidden) return;
    if (e.key === "Escape") cerrarVisor();
    if (e.key === "ArrowLeft") mostrar(actual - 1);
    if (e.key === "ArrowRight") mostrar(actual + 1);
  });
  // Deslizar en celular
  let toqueX = null;
  visor.addEventListener("touchstart", (e) => { toqueX = e.touches[0].clientX; }, { passive: true });
  visor.addEventListener("touchend", (e) => {
    if (toqueX === null) return;
    const dx = e.changedTouches[0].clientX - toqueX;
    if (Math.abs(dx) > 50) mostrar(actual + (dx < 0 ? 1 : -1));
    toqueX = null;
  });

  /* ---------- Animación al hacer scroll ---------- */
  const revelar = $$(".revelar");
  if (reducirMovimiento || !("IntersectionObserver" in window)) {
    revelar.forEach((el) => el.classList.add("visible"));
  } else {
    const obs = new IntersectionObserver((entradas) => {
      entradas.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("visible");
          obs.unobserve(en.target);
        }
      });
    }, { threshold: 0.15 });
    revelar.forEach((el) => obs.observe(el));
  }
})();
