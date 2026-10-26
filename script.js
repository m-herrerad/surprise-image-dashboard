// ── Configuración — mismos valores que en script.js ──
const SUPABASE_URL      = "https://qkpqxijqlkoxrgtnraai.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrcHF4aWpxbGtveHJndG5yYWFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5ODA3OTUsImV4cCI6MjEwODU1Njc5NX0.S_Wc6CqlOu3ECQpAH1KkYKseCXpOOXkbfeZtTh2GHWo";

let registrosActuales = [];

// Posición estable y reproducible: el mismo id siempre da la misma posición
function idToPos(id, W, H) {
  const margin = Math.min(W, H) * 0.08;
  const rx = Math.abs((Math.sin(id * 127.1 + 1) * 43758.5453) % 1);
  const ry = Math.abs((Math.sin(id * 311.7 + 2) * 43758.5453) % 1);
  return {
    x: margin + rx * (W - margin * 2),
    y: margin + ry * (H - margin * 2)
  };
}

// ── Renderiza el diagrama de Voronoi con las caras ──
function renderVoronoi(registros) {
  const galeria     = document.getElementById("galeria");
  const estadoVacio = document.getElementById("estado-vacio");
  const contador    = document.getElementById("contador");

  if (registros.length === 0) {
    estadoVacio.classList.remove("hidden");
    galeria.innerHTML = "";
    contador.textContent = "Esperando participantes…";
    return;
  }

  estadoVacio.classList.add("hidden");

  const W = galeria.clientWidth  || window.innerWidth;
  const H = galeria.clientHeight || (window.innerHeight - document.getElementById("header").offsetHeight);

  // Punto semilla por participante
  const puntos = registros.map(r => ({ ...idToPos(r.id, W, H), r }));

  // Diagrama de Voronoi real con D3
  const delaunay = d3.Delaunay.from(puntos.map(p => [p.x, p.y]));
  const voronoi  = delaunay.voronoi([0, 0, W, H]);

  // Tamaño de imagen: se adapta a cuántas celdas hay
  const IMG = Math.max(180, Math.min(700, Math.sqrt((W * H) / registros.length) * 1.9));

  let defs = "<defs>";
  let celdas = "";
  let etiquetas = "";

  puntos.forEach((p, i) => {
    const cellPath = voronoi.renderCell(i);
    if (!cellPath) return;

    defs += `<clipPath id="vc${i}"><path d="${cellPath}"/></clipPath>`;

    celdas += `
      <g clip-path="url(#vc${i})">
        <rect width="${W}" height="${H}" fill="#060606"/>
        ${p.r.foto ? `
        <image href="${p.r.foto}"
          x="${p.x - IMG / 2}" y="${p.y - IMG / 2}"
          width="${IMG}" height="${IMG}"
          preserveAspectRatio="xMidYMid slice"
          style="filter:brightness(0.82) contrast(1.08) saturate(0.9)"/>
        ` : ''}
        <path d="${cellPath}" fill="none" stroke="#e8007a" stroke-width="1.5" opacity="0.55"/>
      </g>`;

    // Nombre encima de todo, con contorno negro para legibilidad
    etiquetas += `
      <text x="${p.x}" y="${p.y + 7}"
            text-anchor="middle"
            fill="rgba(232,0,122,0.9)"
            font-size="${Math.max(9, Math.min(13, IMG * 0.055))}px"
            font-family="Courier New, monospace"
            letter-spacing="0.05em"
            style="paint-order:stroke;stroke:#000;stroke-width:4px;stroke-linejoin:round;pointer-events:none">
        ${p.r.nombre} ${p.r.apellido}
      </text>`;
  });

  defs += "</defs>";

  galeria.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      <rect width="${W}" height="${H}" fill="#000"/>
      ${defs}${celdas}${etiquetas}
    </svg>`;

  const n = registros.length;
  contador.textContent = `${n} nodo${n !== 1 ? "s" : ""} en la red`;
}

// ── Carga datos de Supabase ────────────────────────
async function cargarRegistros() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/registros?select=id,nombre,apellido,foto&order=id.asc`,
      { headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` } }
    );
    const data = await res.json();
    if (!Array.isArray(data)) return;

    if (data.length !== registrosActuales.length) {
      registrosActuales = data;
      renderVoronoi(registrosActuales);
    }
  } catch(err) {
    console.error("Error cargando registros:", err);
  }
}

// ── Pantalla completa ──────────────────────────────
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

// Recalcula al cambiar tamaño de ventana
window.addEventListener("resize", () => {
  if (registrosActuales.length > 0) renderVoronoi(registrosActuales);
});

// Carga inicial y refresco cada 8 segundos
cargarRegistros();
setInterval(cargarRegistros, 8000);
