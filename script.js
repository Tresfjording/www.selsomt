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
  } catch (error) {
    console.error('Feil ved henting av stederdata:', error);
  }
}

// -----------------------------
// FYLL DATALIST
// -----------------------------
function fyllDatalist(data) {
  const liste = document.getElementById('stedListe');
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
console.log("Sone som sendes til API:", entry.sone);
async function visTettsted() {
  const søk = document.getElementById('søkInput').value.trim().toLowerCase();
  const entry = steder.find(e => e.tettsted.toLowerCase() === søk);

  if (!entry) {
    visFeilmelding('⚠ Fant ikke kommunenavn');
    return;
  }

  oppdaterInfo(entry);

  // hent spotpris

  const pris = await hentSpotpris(entry.sone);
  document.getElementById('prisDisplay').textContent =
    pris ? `${(pris * 100).toFixed(2)} øre/kWh inkl. MVA` : 'Ingen pris tilgjengelig';
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

  document.getElementById("valgtKommuneDisplay").textContent = entry.tettsted ?? 'Ukjent';
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
  document.getElementById('f_slagordDisplay').textContent = entry.f_slagord ?? 'Ingen slagord regitrert';
  
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
document.addEventListener('DOMContentLoaded', async () => {
  await hentStederdata();
  hentSE3();
  hentDK2();

  document.getElementById('søkInput').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') visTettsted();
  });

  document.getElementById('visButton').addEventListener('click', visTettsted);
});
console.log("URL som brukes:", url);
async function hentSpotpris(sone) {
    const url = `https://www.forbrukerradet.no/strompris/api/spotpris?omrade=${sone}`;
    const response = await fetch(url);
    const data = await response.json();

    // Forbrukerrådet returnerer en liste, vi tar første element
    const pris = data[0]?.pris;

    return pris; // Pris inkl. MVA
};

