// script.js – selsomt.no (modul-versjon)

// Importer værmodulen
import { hentNowcast } from "./nowcast.js";

// --------------------------
// Globale variabler
// --------------------------
let map;
let steder = [];              // alle tettsteder fra lokal fil
let kommuneTilSone = {};      // k_nr -> sone (prisområde)

// --------------------------
// Hjelpefunksjoner
// --------------------------
function normaliser(str) {
  if (!str) return "";
  return str
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function settStatus(tekst, ok = true) {
  const el = document.getElementById("status");
  if (!el) return;
  el.textContent = tekst;
  el.classList.toggle("ok", ok);
  el.classList.toggle("feil", !ok);
}

// Oppdater infoboks
 function oppdaterFelter(entry, pris) {
    if (!entry) {
        if (tettstedEl) tettstedEl.textContent = "";
        if (prisEl) prisEl.textContent = "";
        if (kNrEl) kNrEl.textContent = "";
        if (fylkeEl) fylkeEl.textContent = "";
        if (soneEl) soneEl.textContent = "";
        return;
    }

  if (tettstedEl) tettstedEl.textContent = entry.tettsted || "–";
  if (kNrEl) kNrEl.textContent = entry.k_nr || "–";
  if (fylkeEl) fylkeEl.textContent = entry.fylke || "–";
  if (soneEl) soneEl.textContent = entry.sone || "–";

  if (prisEl) {
    if (pris == null) {
      prisEl.textContent = "–";
    } else {
      // forventer pris i øre/kWh
      prisEl.textContent = `${pris.toFixed(1)} øre/kWh`;
    }
  }

// UTM32 → WGS84
function utm32ToLatLon(northing, easting) {
  const utm32 = "+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs";
  const wgs84 = "+proj=longlat +datum=WGS84 +no_defs";
  const [lon, lat] = proj4(utm32, wgs84, [easting, northing]);
  return { lat, lon };
}

// --------------------------
// Data: tettsteder + sonekart
// --------------------------
async function lastTettsteder() {
    try {
        const resp = await fetch("tettsteder_3.json");
        if (!resp.ok) throw new Error("Klarte ikke laste tettsteder_3.json");
        const data = await resp.json();

        if (!Array.isArray(data)) {
            throw new Error("tettsteder_3.json har feil format");
        }
      
        steder = data;

        // bygg kommune -> sone-oppslag
        kommuneTilSone = {};
        // ... eventuelt mer logikk her
    } catch (error) {
        console.error("Feil ved lasting av tettsteder:", error);
    }
} // ← denne avslutter hele funksjonen

// --------------------------
// Strømpris (tilpass API ved behov)
// --------------------------
async function hentSpotpris(sone) {
  if (!sone) return null;

  try {
    // EKSEMPEL – tilpass til ditt faktiske API
    // Her bruker vi hvakosterstrommen.no sin nåværende time:
    const url = `https://www.hvakosterstrommen.no/api/v1/prices/current_hour_${sone}.json`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error("Klarte ikke hente spotpris");
    const data = await resp.json();

    // Flere API-varianter finnes; her antar vi data[0].NOK_per_kWh
    const first = Array.isArray(data) ? data[0] : null;
    if (!first || typeof first.NOK_per_kWh !== "number") return null;

    // konverter kr/kWh → øre/kWh
    return first.NOK_per_kWh * 100;
  } catch (err) {
    console.error("Feil ved henting av spotpris:", err);
    return null;
  }
}

// --------------------------
// Kartverket SSR
// --------------------------
async function hentStedFraSSR(sok) {
  const url = `https://ws.geonorge.no/SKWS3Index/ssr/sok?navn=${encodeURIComponent(
    sok
  )}&eksakteForst=true&antPerSide=10`;

  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error("SSR-søk feilet");
    const data = await resp.json();

    if (!data || !data.stedsnavn || data.stedsnavn.length === 0) {
      return null;
    }

    const place = data.stedsnavn[0];

    // Koordinater – SSR gir UTM32 (øst/nord)
    let lat = null;
    let lon = null;
    if (place.nord && place.øst) {
      const p = utm32ToLatLon(place.nord, place.øst);
      lat = p.lat;
      lon = p.lon;
    }

    return {
      navn: place.stedsnavn || "",
      k_nr: place.kommunenummer || "",
      kommune: place.kommunenavn || "",
      fylke: place.fylkesnavn || "",
      lat: lat,
      lon: lon
    };
  } catch (err) {
    console.error("Feil ved henting fra SSR:", err);
    return null;
  }
}

// Finn fallback-koordinater for en kommune basert på lokalfilen
function finnFallbackKoordinaterForKommune(k_nr) {
  if (!k_nr || !Array.isArray(steder)) return null;
  return steder.find(e => e.k_nr === k_nr) || null;
}

// --------------------------
// Kart-funksjoner
// --------------------------
let marker;

function visPåKart(map, { lat, lon, navn }) {
  if (typeof lat !== "number" || typeof lon !== "number") return;

  map.setView([lat, lon], 10);

  if (marker) {
    marker.setLatLng([lat, lon]);
    marker.setPopupContent(navn || "");
  } else {
    marker = L.marker([lat, lon]).addTo(map);
    if (navn) marker.bindPopup(navn);
  }
}

// --------------------------
// HOVEDFUNKSJON: VIS TETTSTED / STED
// --------------------------
async function visTettsted(map) {
  const inputEl = document.getElementById("sokInput");
  if (!inputEl) return;

  const input = inputEl.value;
  const sok = normaliser(input);

  if (!sok) {
    settStatus("Skriv inn et stedsnavn først.", false);
    return;
  }

  if (!Array.isArray(steder) || steder.length === 0) {
    settStatus("Tettsteder er ikke lastet ennå.", false);
    return;
  }

  // 1) Prøv lokal liste først
  let entry = steder.find(e => normaliser(e.tettsted || "") === sok);

  if (entry) {
    console.log("Fant tettsted i lokal liste:", entry);

    if (!entry.sone) {
      settStatus(
        `Fant ${entry.tettsted}, men mangler prisområde (sone).`,
        false
      );
      oppdaterFelter(entry, null);
      visPåKart(map, {
        lat: entry.lat_decimal,
        lon: entry.lon_decimal,
        navn: entry.tettsted
      });

      if (
        typeof entry.lat_decimal === "number" &&
        typeof entry.lon_decimal === "number"
      ) {
        hentNowcast(entry.lat_decimal, entry.lon_decimal);
      }
      return;
    }

    const pris = await hentSpotpris(entry.sone);

    if (pris == null) {
      settStatus(
        `Fant ${entry.tettsted} (lokalt), men ingen strømpris for sone ${entry.sone}.`,
        false
      );
    } else {
      settStatus(
        `Fant ${entry.tettsted} (lokalt, sone ${entry.sone}).`,
        true
      );
    }

    oppdaterFelter(entry, pris);
    visPåKart(map, {
      lat: entry.lat_decimal,
      lon: entry.lon_decimal,
      navn: entry.tettsted,
      fylke: entry.fylke,
      k_slagord: entry.k_slagord
    });

    if (
      typeof entry.lat_decimal === "number" &&
      typeof entry.lon_decimal === "number"
    ) {
      hentNowcast(entry.lat_decimal, entry.lon_decimal);
    }
    return;
  }

  // 2) Ikke funnet lokalt → prøv Kartverket (SSR)
  console.log("Fant ikke i lokal liste, prøver Kartverket (SSR) for:", sok);
  const ssr = await hentStedFraSSR(sok);

  if (!ssr) {
    settStatus(
      `Fant verken lokalt tettsted eller stedsnavn i Kartverket for "${input}".`,
      false
    );
    oppdaterFelter(null, null);
    return;
  }

  console.log("Fant stedsnavn via Kartverket:", ssr);

  // Finn sone via kommune-nummer (fra lokalfilen)
  let sone = null;
  if (ssr.k_nr && kommuneTilSone[ssr.k_nr]) {
    sone = kommuneTilSone[ssr.k_nr];
  }

  // Strømpris hvis vi fant sone
  let pris = null;
  if (sone) {
    pris = await hentSpotpris(sone);
  }

  // Koordinater + fallback
  let lat = ssr.lat;
  let lon = ssr.lon;
  let fallbackBrukt = false;

  if (typeof lat !== "number" || typeof lon !== "number") {
    const fallback = finnFallbackKoordinaterForKommune(ssr.k_nr);
    if (fallback) {
      lat = fallback.lat_decimal;
      lon = fallback.lon_decimal;
      fallbackBrukt = true;
      console.log("Bruker kommune-fallback for koordinater:", fallback);
    }
  }

  // Status-tekst
  if (!sone && !fallbackBrukt) {
    settStatus(
      `Fant "${ssr.navn}" via Kartverket (kommune ${ssr.kommune || "ukjent"}), men mangler prisområde og koordinater.`,
      false
    );
  } else if (!sone && fallbackBrukt) {
    settStatus(
      `Fant "${ssr.navn}" via Kartverket – bruker kommunesenter ${ssr.kommune || ""}, men mangler prisområde.`,
      false
    );
  } else if (sone && !fallbackBrukt) {
    settStatus(
      `Fant "${ssr.navn}" via Kartverket (kommune ${ssr.kommune || ""}, sone ${sone}).`,
      true
    );
  } else if (sone && fallbackBrukt) {
    settStatus(
      `Fant "${ssr.navn}" via Kartverket – bruker kommunesenter ${ssr.kommune || ""} (sone ${sone}).`,
      true
    );
  }

  // Entry til infoboks
  const entryFraSSR = {
    tettsted: ssr.navn,
    k_nr: ssr.k_nr || "",
    fylke: ssr.fylke || "",
    sone: sone || "–"
  }

  oppdaterFelter(entryFraSSR, pris);

  if (typeof lat === "number" && typeof lon === "number") {
    visPåKart(map, {
      lat,
      lon,
      navn: ssr.navn,
      fylke: ssr.fylke,
      k_slagord: ""
    });
    hentNowcast(lat, lon);
  }
}

// --------------------------
// Init
// --------------------------
document.addEventListener("DOMContentLoaded", async () => {
  map = L.map("map").setView([62.566, 7.0], 7);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "&copy; OpenStreetMap-bidragsytere"
  }).addTo(map);

  // Last lokal tettstedsliste
  await lastTettsteder();

  const sokInput = document.getElementById("sokInput");
  const visInfoBtn = document.getElementById("visInfoBtn");

  if (!sokInput || !visInfoBtn) {
    console.error("Fant ikke søkefelt eller knapp i DOM.");
    return;
  }

  // Koble søk til visTettsted (ALT A)
  visInfoBtn.addEventListener("click", () => visTettsted(map));
  sokInput.addEventListener("keyup", e => {
    if (e.key === "Enter") visTettsted(map);
  });

  settStatus("Skriv inn et tettsted for å starte.", true);
});

  const tettstedEl = document.getElementById("tettstedDisplay");
  const prisEl = document.getElementById("prisDisplay")};