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
    "> Compilando 6 años de esfuerzo...",
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
    poner(unidades.dias, Math.floor(s / 86400));
    poner(unidades.horas, String(Math.floor((s % 86400) / 3600)).padStart(2, "0"));
    poner(unidades.min, String(Math.floor((s % 3600) / 60)).padStart(2, "0"));
    poner(unidades.seg, String(s % 60).padStart(2, "0"));
    return true;
  }
  // Cambia el número con un giro 3D solo cuando su valor cambia
  function poner(el, valor) {
    valor = String(valor);
    if (el.textContent === valor) return;
    el.textContent = valor;
    el.classList.remove("pop");
    void el.offsetWidth;
    el.classList.add("pop");
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

  /* ---------- Tarjeta de regalo ---------- */
  const carta = $("#carta-regalo");
  carta.addEventListener("click", () => {
    const volteada = carta.classList.toggle("carta--volteada");
    carta.setAttribute("aria-pressed", volteada);
  });

  /* ---------- Galería + visor ---------- */
  const galeria = $("#galeria");
  CONFIG.galeria.forEach((foto, i) => {
    const btn = document.createElement("button");
    btn.className = "galeria__item";
    btn.setAttribute("aria-label", `Ver foto: ${foto.alt}`);
    btn.classList.add("tilt");
    btn.innerHTML = `<img src="${foto.src}" alt="${foto.alt}" loading="lazy" width="2048" height="1365"><span class="tilt__brillo" aria-hidden="true"></span>`;
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

  /* ---------- Efecto 3D que sigue al cursor ---------- */
  if (!reducirMovimiento && matchMedia("(hover: hover) and (pointer: fine)").matches) {
    $$(".tilt").forEach((el) => {
      const max = el.classList.contains("portada__foto") ? 12 : 9;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        el.classList.add("tilt--activo");
        el.style.setProperty("--ry", `${(x - 0.5) * 2 * max}deg`);
        el.style.setProperty("--rx", `${(0.5 - y) * 2 * max}deg`);
        el.style.setProperty("--gx", `${x * 100}%`);
        el.style.setProperty("--gy", `${y * 100}%`);
      });
      el.addEventListener("pointerleave", () => {
        el.classList.remove("tilt--activo");
        el.style.setProperty("--rx", "0deg");
        el.style.setProperty("--ry", "0deg");
      });
    });
  }

  /* ---------- Fondo: red de partículas neón ---------- */
  (function particulas() {
    const lienzo = $("#estrellas");
    const ctx = lienzo.getContext("2d");
    const colores = ["46,243,255", "139,92,255", "255,79,216", "240,216,154"];
    let ancho, alto, puntos = [], raton = { x: -9999, y: -9999 };

    function ajustar() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ancho = lienzo.clientWidth;
      alto = lienzo.clientHeight;
      lienzo.width = ancho * dpr;
      lienzo.height = alto * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cantidad = Math.round(Math.min(110, (ancho * alto) / 9000));
      puntos = Array.from({ length: cantidad }, () => ({
        x: Math.random() * ancho,
        y: Math.random() * alto,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.6,
        c: colores[Math.floor(Math.random() * colores.length)],
        fase: Math.random() * Math.PI * 2,
      }));
    }

    function dibujar(t) {
      ctx.clearRect(0, 0, ancho, alto);
      const enlace = 120;
      for (let i = 0; i < puntos.length; i++) {
        const p = puntos[i];
        if (!reducirMovimiento) {
          p.x += p.vx; p.y += p.vy;
          // el cursor empuja suavemente las partículas
          const dx = p.x - raton.x, dy = p.y - raton.y, d2 = dx * dx + dy * dy;
          if (d2 < 10000) { p.x += dx * 0.02; p.y += dy * 0.02; }
          if (p.x < 0 || p.x > ancho) p.vx *= -1;
          if (p.y < 0 || p.y > alto) p.vy *= -1;
        }
        for (let j = i + 1; j < puntos.length; j++) {
          const q = puntos[j];
          const dx = p.x - q.x, dy = p.y - q.y, d = Math.hypot(dx, dy);
          if (d < enlace) {
            ctx.strokeStyle = `rgba(${p.c},${(1 - d / enlace) * 0.28})`;
            ctx.lineWidth = 0.7;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
        const brillo = 0.55 + Math.sin(t / 700 + p.fase) * 0.45;
        ctx.fillStyle = `rgba(${p.c},${brillo})`;
        ctx.shadowColor = `rgba(${p.c},1)`;
        ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }
      if (!reducirMovimiento && !document.hidden) requestAnimationFrame(dibujar);
    }

    ajustar();
    let idRedim;
    window.addEventListener("resize", () => { clearTimeout(idRedim); idRedim = setTimeout(ajustar, 200); });
    window.addEventListener("pointermove", (e) => { raton = { x: e.clientX, y: e.clientY }; }, { passive: true });
    document.addEventListener("visibilitychange", () => { if (!document.hidden && !reducirMovimiento) requestAnimationFrame(dibujar); });
    requestAnimationFrame(dibujar);
  })();

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
    }, { threshold: 0.12 });
    revelar.forEach((el) => obs.observe(el));
  }
})();
