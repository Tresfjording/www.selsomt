// === GLOBALT DATASETT ===
let steder = []; // fylles når JSON lastes


// === STARTUP ===
document.addEventListener("DOMContentLoaded", () => {
  console.log("Init startet");

  const sokInput = document.getElementById("sokInput");
  const visInfoBtn = document.getElementById("visInfoBtn");

  if (!sokInput || !visInfoBtn) {
    console.error("Fant ikke sokInput eller visInfoBtn i DOM");
    return;
  }

  // Opprett kartet
  const map = L.map('map').setView([65.0, 15.0], 5);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Last tettsteder
  fetch("tettsteder_3.json")
    .then(r => r.json())
    .then(data => {
      steder = data;
      console.log("Lastet tettsteder_3.json –", steder.length, "poster");

      // Vis alle tettsteder ved oppstart
      steder.forEach(item => {
        if (item.lat_decimal && item.lon_decimal) {
          L.marker([item.lat_decimal, item.lon_decimal])
            .addTo(map)
            .bindPopup(`
              <strong>${item.tettsted}</strong><br>
              ${item.fylke}<br>
              ${item.k_slagord || ""}
            `);
        }
      });

      // Koble søk
      visInfoBtn.addEventListener("click", () => visTettsted(map));
      sokInput.addEventListener("keyup", e => {
        if (e.key === "Enter") visTettsted(map);
      });
    })
    .catch(err => {
      console.error("Feil ved lasting av tettsteder:", err);
      settStatus("Kunne ikke laste tettsteder.", false);
    });
});


// === STATUSVISNING ===
function settStatus(tekst, ok) {
  const el = document.getElementById("status");
  el.textContent = tekst;
  el.className = "status " + (ok ? "status-ok" : "status-error");
}


// === NORMALISERING ===
function normaliser(str) {
  return str.trim().toLowerCase();
}


// === HOVEDFUNKSJON: VIS TETTSTED ===
async function visTettsted(map) {
  const input = document.getElementById("sokInput").value;
  const søk = normaliser(input);

  if (!søk) {
    settStatus("Skriv inn et tettsted først.", false);
    return;
  }

  if (!steder.length) {
    settStatus("Tettsteder ikke lastet ennå.", false);
    return;
  }

  const entry = steder.find(e => normaliser(e.tettsted) === søk);

  if (!entry) {
    settStatus(`Fant ikke tettstedet "${input}".`, false);
    oppdaterFelter(null, null);
    return;
  }

  console.log("Fant tettsted:", entry);

  // Hent spotpris
  const pris = await hentSpotpris(entry.sone);

  if (pris == null) {
    settStatus(`Fant ${entry.tettsted}, men ingen strømpris for sone ${entry.sone}.`, false);
  } else {
    settStatus(`Fant ${entry.tettsted} (sone ${entry.sone}).`, true);
  }

  // Oppdater info-kort
  oppdaterFelter(entry, pris);

  // Oppdater kart
  visPåKart(map, entry);
}


// === VIS PÅ KART ===
function visPåKart(map, entry) {
  // Fjern gamle markører
  map.eachLayer(layer => {
    if (layer instanceof L.Marker) map.removeLayer(layer);
  });

  // Legg til markør
  L.marker([entry.lat_decimal, entry.lon_decimal])
    .addTo(map)
    .bindPopup(`
      <strong>${entry.tettsted}</strong><br>
      ${entry.fylke}<br>
      ${entry.k_slagord || ""}
    `)
    .openPopup();

  // Zoom inn
  map.setView([entry.lat_decimal, entry.lon_decimal], 12);
}


// === HENT SPOTPRIS ===
async function hentSpotpris(sone) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  const url = `https://www.hvakosterstrommen.no/api/v1/prices/${year}/${month}-${day}_${sone}.json`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (!Array.isArray(data) || !data.length) return null;

    const currentHour = now.getHours();
    const entry = data.find(e => new Date(e.time_start).getHours() === currentHour);

    return entry ? entry.NOK_per_kWh : null;

  } catch (err) {
    console.error("Feil ved henting av spotpris:", err);
    return null;
  }
}


// === OPPDATER INFO-KORT ===
function settTekst(id, verdi) {
  const el = document.getElementById(id);
  if (!el) return;

  if (verdi == null || verdi === "") {
    el.textContent = "–";
    el.classList.add("mangler");
  } else {
    el.textContent = verdi;
    el.classList.remove("mangler");
  }
}

function oppdaterFelter(entry, pris) {
  settTekst("tettstedDisplay", entry?.tettsted);
  settTekst("kNrDisplay", entry?.k_nr);
  settTekst("fylkeDisplay", entry?.fylke); 
  settTekst("soneDisplay", entry?.sone);
  settTekst("antallDisplay", entry?.antall);
  settTekst("arealDisplay", entry?.areal);
  settTekst("sysselsatteDisplay", entry?.sysselsatte);
  settTekst("tilskuddDisplay", entry?.tilskudd);
  settTekst("sprakDisplay", entry?.språk);
  settTekst("kSlagordDisplay", entry?.k_slagord);
  settTekst("fSlagordDisplay", entry?.f_slagord);

  settTekst(
    "prisDisplay",
    pris == null
      ? "Pris ikke tilgjengelig"
      : `${(pris * 100).toFixed(2)} øre/kWh`
  );
}