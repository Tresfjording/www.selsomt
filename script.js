
let steder = [];

// -----------------------------
// HENT JSON-DATA
// -----------------------------
async function hentStederdata() {
    try {
        const response = await fetch('/tettsteder.json');
        if (!response.ok) throw new Error('Kunne ikke hente JSON');
        const data = await response.json();
        steder = data; // lagre globalt
        fyllDatalist(steder);
    } catch (error) {
        console.error('Feil ved henting av stededata:', error);
        steder = [];
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
function visTettsted() {
    const søk = document.getElementById('søkInput').value.trim().toLowerCase();
    const entry = steder.find(e => e.tettsted.toLowerCase() === søk);

    if (!entry) {
        visFeilmelding('⚠ Fant ikke kommunenavn');
        return;
    }

    oppdaterInfo(entry);
}

// -----------------------------
// VIS FEILMELDING
// -----------------------------
function visFeilmelding(msg) {
    const el = document.getElementById('statusDisplay');
    if (el) el.textContent = msg;
}

// -----------------------------
// OPPDATER INFOFELTENE
// -----------------------------
function oppdaterInfo(entry) {
    document.getElementById('statusDisplay').textContent = `☑ Fant data for ${entry.tettsted}`;

    document.getElementById('k_nrDisplay').textContent = entry.k_nr ?? 'Ukjent';
    document.getElementById('tettstedDisplay').textContent = entry.tettsted ?? 'Ukjent';
    document.getElementById('fylkeDisplay').textContent = entry.fylke ?? 'Ukjent';
    document.getElementById('soneDisplay').textContent = entry.sone ?? 'Ukjent';
    document.getElementById('antallDisplay').textContent = entry.antall ?? 'Ukjent';
    document.getElementById('arealDisplay').textContent = entry.areal ?? 'Ukjent';
    document.getElementById('sysselsatteDisplay').textContent = entry.sysselsatte ?? 'Ukjent';
    document.getElementById('tilskuddDisplay').textContent = entry.tilskudd ?? 'Ukjent';
    document.getElementById('språkDisplay').textContent = entry.språk ?? 'Ukjent';
    document.getElementById('k_slagordDisplay').textContent = entry.k_slagord || 'Ingen slagord registrert';
    document.getElementById('f_slagordDisplay').textContent = entry.f_slagord || 'Ingen slagord registrert';
}

// -----------------------------
// START NÅR SIDEN ER KLAR
// -----------------------------
document.addEventListener('DOMContentLoaded', async () => {
    await hentStederdata();

    document.getElementById('søkInput').addEventListener('keydown', (event) => {
        if (event.key === 'Enter') visTettsted();
    });

    document.getElementById('visButton').addEventListener('click', visTettsted);
});
// SE3
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

//hentSE3();
console.log("Knapp trykket!");

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

const faktaEl = document.getElementById('faktaDisplay');
faktaEl.classList.remove('vis');
void faktaEl.offsetWidth; // trigger reflow
faktaEl.classList.add('vis');


//hentDK2();
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

hentSE3();   // ← Stockholm
hentDK2();   // ← København 

console.log('Valgt entry:', entry); 