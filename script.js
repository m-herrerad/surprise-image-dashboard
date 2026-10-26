// ── Configuración — mismos valores que en script.js ──
const SUPABASE_URL        = "https://qkpqxijqlkoxrgtnraai.supabase.co";       
const SUPABASE_ANON_KEY   = "sb_publishable_BgXuHgceRbmyumEoeS85MQ_cYe9KurO";

let idsVistos = new Set();

async function cargarRegistros() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/registros?select=id,nombre,apellido,foto&order=id.asc`,
      { headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` } }
    );
    const data = await res.json();
    if (!Array.isArray(data)) return;

    const nuevos = data.filter(r => !idsVistos.has(r.id));
    if (nuevos.length === 0) return;

    const galeria     = document.getElementById("galeria");
    const estadoVacio = document.getElementById("estado-vacio");

    estadoVacio.classList.add("hidden");

    nuevos.forEach((r, i) => {
      idsVistos.add(r.id);
      const div = document.createElement("div");
      div.className = "cara nueva";
      div.style.animationDelay = `${i * 0.07}s`;
      div.innerHTML = `
        <img src="${r.foto || ''}" alt="${r.nombre}" onerror="this.style.background='#111'">
        <p class="cara-nombre">${r.nombre} ${r.apellido}</p>
      `;
      galeria.appendChild(div);
      // Quita el resaltado después de 3 segundos
      setTimeout(() => div.classList.remove("nueva"), 3000 + i * 70);
    });

    const total = idsVistos.size;
    document.getElementById("contador").textContent =
      `${total} nodo${total !== 1 ? "s" : ""} en la red`;

    if (idsVistos.size === 0) estadoVacio.classList.remove("hidden");

  } catch(err) {
    console.error("Error cargando registros:", err);
  }
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

// Carga inicial y refresco cada 8 segundos
cargarRegistros();
setInterval(cargarRegistros, 8000);
