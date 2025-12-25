let steder = [];

// -----------------------------
// HENT TETTSTEDER
// -----------------------------
async function hentStederdata() {
  try {
    const response = await fetch('/tettsteder.json');
    if (!response.ok) throw new Error('Kunne ikke hente JSON');
    steder = await response.json();
    fyllDatalist(steder);
    console.error('Feil ved henting av stederdata:', error);
  } catch (error) {
    
  window.steder = data; // gjør 'steder' tilgjengelig i konsollen}
}

// -----------------------------
// FYLL DATALIST
// -----------------------------
function fyllDatalist(data) {
  const liste = document.getElementById('tettstedListe');
  if (!liste || !Array.isArray(data)) return;

  liste.innerHTML = '';
  data.forEach(entry => {
    const option = document.createElement('option');
    option.value = entry.tettsted;
    liste.appendChild(option);
  });
}

// -----------------------------
// VIS TETTSTED
// -----------------------------

async function visTettsted() {
  const søk = document.getElementById('søkInput').value.trim().toLowerCase();
  const entry = steder.find(e =>e.tettsted.toLowerCase().startsWith(søk));
console.log("✅ visTettsted() ble kalt");
  if (!entry) {
    visFeilmelding('⚠ Fant ikke tettsted');
    return;
  }

  console.log("Sone som sendes til API:", entry.sone);

  oppdaterInfo(entry);

  // hent spotpris
async function hentSpotpris(sone) {
  try {
    // Først: prøv Norge
    const urlNO = `https://api.energidataservice.dk/dataset/Elspotprices?filter={"PriceArea":"${sone}"}&limit=1&sort=HourUTC desc`;
    const resNO = await fetch(urlNO);
    const dataNO = await resNO.json();

    if (dataNO.records?.length > 0) {
      return dataNO.records[0].SpotPriceEUR * 11.5 / 1000;
    }

    console.warn("Norsk pris feilet, prøver DK2…");

    // Fallback: DK2
    const urlDK = `https://api.energidataservice.dk/dataset/Elspotprices?filter={"PriceArea":"DK2"}&limit=1&sort=HourUTC desc`;
    const resDK = await fetch(urlDK);
    const dataDK = await resDK.json();

    if (dataDK.records?.length > 0) {
      return dataDK.records[0].SpotPriceEUR * 11.5 / 1000;
    }

    return null;

  } catch (e) {
    console.error("Feil ved henting av spotpris:", e);
    return null;
  }
}
// -----------------------------
// VIS FEILMELDING
// -----------------------------
function visFeilmelding(msg) {
  document.getElementById('statusDisplay').textContent = msg;
}

// -----------------------------
// OPPDATER INFOFELTENE
// -----------------------------
function oppdaterInfo(entry) {
 document.getElementById('statusDisplay').textContent =
 `☑ Fant data for ${entry.tettsted}`;

  document.getElementById("valgttettstedDisplay").textContent = entry.tettsted ?? 'Ukjent';
  document.getElementById('k_nrDisplay').textContent = entry.k_nr ?? 'Ukjent';
  document.getElementById('tettstedDisplay').textContent = entry.tettsted ?? 'Ukjent';
  document.getElementById('fylkeDisplay').textContent = entry.fylke ?? 'Ukjent';
  document.getElementById('soneDisplay').textContent = entry.sone ?? 'Ukjent';
  document.getElementById('antallDisplay').textContent = entry.antall ?? 'Ukjent';
  document.getElementById('arealDisplay').textContent = entry.areal ?? 'Ukjent';
  document.getElementById('sysselsatteDisplay').textContent = entry.sysselsatte ?? 'Ukjent';
  document.getElementById('tilskuddDisplay').textContent = entry.tilskudd ?? 'Ukjent';
  document.getElementById('språkDisplay').textContent = entry.språk ?? 'Ukjent';
  document.getElementById('k_slagordDisplay').textContent = entry.k_slagord ?? 'Ingen slagord registrert';
  document.getElementById('f_slagordDisplay').textContent = entry.f_slagord ?? 'Ingen slagord registrert';
  
}


// -----------------------------
// HENT SE3
// -----------------------------
async function hentSE3() {
  try {
    const url = "https://api.energidataservice.dk/dataset/Elspotprices?filter=%7B%22PriceArea%22%3A%20%22SE3%22%7D&limit=1&sort=HourUTC%20desc";
    const res = await fetch(url);
    const data = await res.json();

    const eurMWh = data.records[0].SpotPriceEUR;
    const nokPerKWh = eurMWh * 11.5 / 1000 * 100;
    const avrundet = Math.round(nokPerKWh);

    document.getElementById("se3-price").innerHTML =
      `🇸🇪 Sverige (SE3 – Stockholm): <strong>${avrundet}</strong> øre/kWh akkurat nå`;
  } catch (e) {
    document.getElementById("se3-price").innerHTML =
      "🇸🇪 Sverige (SE3 – Stockholm): ikke tilgjengelig";
  }
}

// -----------------------------
// HENT DK2
// -----------------------------
async function hentDK2() {
  try {
    const url = "https://api.energidataservice.dk/dataset/Elspotprices?filter=%7B%22PriceArea%22%3A%20%22DK2%22%7D&limit=1&sort=HourUTC%20desc";
    const res = await fetch(url);
    const data = await res.json();

    const eurMWh = data.records[0].SpotPriceEUR;
    const nokPerKWh = eurMWh * 11.5 / 1000 * 100;
    const avrundet = Math.round(nokPerKWh);

    document.getElementById("dk2-price").innerHTML =
      `🇩🇰 Danmark (DK2 – København): <strong>${avrundet}</strong> øre/kWh akkurat nå`;
  } catch (e) {
    document.getElementById("dk2-price").innerHTML =
      "🇩🇰 Danmark (DK2 – København): ikke tilgjengelig";
  }
}

// -----------------------------
// RANDOM FAKTA
// -----------------------------
async function visRandomFakta() {
  try {
    const res = await fetch('/facts.json');
    if (!res.ok) throw new Error("Kunne ikke hente facts.json");
    const fakta = await res.json();

    const tilfeldig = fakta[Math.floor(Math.random() * fakta.length)];
    document.getElementById('faktaDisplay').textContent = tilfeldig;
  } catch (e) {
    console.error("Feil ved henting av fakta:", e);
  }
}

// -----------------------------
// INIT
// -----------------------------


async function initApp() {
  try {
    await hentStederdata(); // ✅ nå er await inne i async-funksjon
    hentSE3();
    hentDK2();

    document.getElementById('søkInput').addEventListener('keydown', (event) => {
      if (event.key === 'Enter') visTettsted();
    });

    document.getElementById('visButton').addEventListener('click', visTettsted);

    console.log("✅ Init fullført");
  } catch (error) {
    console.error("🚨 Feil under init:", error);
  }
}
visRandomFakta();


async function hentSpotpris(sone) {
  const url = `https://www.forbrukerradet.no/strompris/api/spotpris?omrade=${sone}`;
  console.log("URL som brukes:", url);
    const response = await fetch(url);
    const data = await response.json();
    // Forbrukerrådet returnerer en liste, vi tar første element
    if (!Array.isArray(data) || data.length === 0) return null;

    return pris; // Pris inkl. MVA
};

document.addEventListener("DOMContentLoaded", initApp);
