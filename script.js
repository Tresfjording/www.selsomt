// === KONFIG ===
const VALUTAKURS_EUR_TIL_NOK = 11.5; // juster ved behov

let steder = []; // fylles fra tettsteder_3.json når siden lastes

// === STARTUP ===
document.addEventListener('DOMContentLoaded', () => {
  console.log("✅ Init startet");

  // koble søkeknappen
  document.getElementById('visInfoBtn').addEventListener('click', visTettsted);

  // last tettsteder
  fetch('tettsteder_3.json')
    .then(res => res.json())
    .then(data => {
      steder = data;
      window.steder = data; // gjør tilgjengelig i konsollen
      console.log(`✅ Lastet tettsteder_3.json – ${steder.length} poster`);
    })
    .catch(err => {
      console.error("🚨 Klarte ikke å laste tettsteder_3.json:", err);
      settStatus("Klarte ikke å laste tettsted-data.", false);
    });
});



// === HJELPERE ===
function settStatus(tekst, ok) {
  const el = document.getElementById('status');
  el.textContent = tekst;
  el.className = 'status ' + (ok ? 'status-ok' : 'status-error');
}

function normaliserTettstedNavn(str) {
  return str.trim().toLowerCase();
}

// === HOVEDFUNKSJON – vis info om tettsted ===   
async function visTettsted() {
  console.log("✅ visTettsted() ble kalt");
  const input = document.getElementById('sokInput').value;
  const søk = normaliserTettstedNavn(input);

  if (!søk) {
    settStatus("Skriv inn et tettsted først.", false);
    return;
  }

  if (!steder || steder.length === 0) {
    settStatus("Tettstedsdata ikke lastet ennå.", false);
    return;
  }

  const entry = steder.find(e => normaliserTettstedNavn(e.tettsted) === søk);

  if (!entry) {
    settStatus(`Fant ikke tettstedet "${input}".`, false);
    oppdaterFelter(null, null);
    return;
  }

  console.log("✅ Fant entry:", entry);

  const pris = await hentSpotpris(entry.sone);

  if (pris == null) {
    settStatus(`Fant data for ${entry.tettsted}, men ingen strømpris for sone ${entry.sone}.`, false);
  } else {
    settStatus(`Fant data for ${entry.tettsted} (sone ${entry.sone}).`, true);
  }

  oppdaterFelter(entry, pris);
  visKart(entry);
}

// === HENT SPOTPRIS FRA hvakosterstrommen.no ===
async function hentSpotpris(sone) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  const url = `https://www.hvakosterstrommen.no/api/v1/prices/${year}/${month}-${day}_${sone}.json`;

  console.log("Henter norsk spotpris fra hvakosterstrommen.no:", url);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn("⚠ API svarte ikke OK:", response.status);
      return null;
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      console.warn("⚠ Ingen prisdata i JSON for sone:", sone);
      return null;
    }

    // Finn gjeldende time
    const currentHour = now.getHours();
    const entry = data.find(e => {
      const t = new Date(e.time_start);
      return t.getHours() === currentHour;
    });

    if (!entry) {
      console.warn("⚠ Fant ikke pris for gjeldende time i sone:", sone);
      return null;
    }

    // API gir pris i NOK per kWh direkte
    const nokPerKWh = entry.NOK_per_kWh;

    console.log(`Sone ${sone}: ${nokPerKWh} NOK/kWh`);
    return nokPerKWh;

  } catch (error) {
    console.error("🚨 Feil ved henting av spotpris:", error);
    return null;
  }
}
function settTekst(id, verdi) {
  const el = document.getElementById(id);
  if (!el) return;

  if (verdi == null || verdi === "") {
    el.textContent = "";
    el.classList.add("mangler");
  } else {
    el.textContent = verdi;
    el.classList.remove("mangler");
  }
}
function oppdaterFelter(entry, pris) {
  settTekst('tettstedDisplay', entry?.tettsted);
  settTekst('kNrDisplay', entry?.k_nr);
  settTekst('fylkeDisplay', entry?.fylke);
  settTekst('soneDisplay', entry?.sone);
  settTekst('antallDisplay', entry?.antall);
  settTekst('arealDisplay', entry?.areal);
  settTekst('sysselsatteDisplay', entry?.sysselsatte);
  settTekst('tilskuddDisplay', entry?.tilskudd);
  settTekst('sprakDisplay', entry?.språk);
  settTekst('kSlagordDisplay', entry?.k_slagord);
  settTekst('fSlagordDisplay', entry?.f_slagord);

  settTekst(
    'prisDisplay',
    pris == null
      ? "Pris ikke tilgjengelig (helligdag?)"
      : `${(pris * 100).toFixed(2)} øre/kWh (inkl. MVA, ca.)`
  );
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("Init startet");

    // Opprett kartet
    const map = L.map('map').setView([65.0, 15.0], 5);

    // Bakgrunnskart
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Last JSON én gang
    fetch("tettsteder_3.json")
        .then(r => r.json())
        .then(data => {
            console.log("Lastet tettsteder_3.json –", data.length, "poster");

            // Vis alle tettsteder ved oppstart
            data.forEach(item => {
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

            // Funksjon: vis kun ett tettsted
            window.visSoktTettsted = function () {
                const query = document.getElementById("searchInput").value.trim().toLowerCase();

                const entry = data.find(item =>
                    item.tettsted.toLowerCase() === query
                );

                console.log("Søkte etter:", query);
                console.log("Fant entry:", entry);

                if (!entry) {
                    alert("Fant ikke tettstedet");
                    return;
                }

                // Fjern gamle markører
                map.eachLayer(layer => {
                    if (layer instanceof L.Marker) map.removeLayer(layer);
                });

                // Legg til kun dette tettstedet
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
            };

            // Koble Enter-tasten til søk
            document.getElementById("searchInput").addEventListener("keyup", function (e) {
                if (e.key === "Enter") {
                    visSoktTettsted();
                }
            });
        })
        .catch(err => console.error("Feil ved lasting av JSON:", err));
});