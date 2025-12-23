
let steder = []; 

async function hentStederdata() {
  try {
    const response = await fetch('/tettsteder.json');
    if (!response.ok) throw new Error('Kunne ikke hente JSON');
    steder = await response.json();
    fyllDatalist(steder);
  } catch (error) {
    console.error('Feil ved henting av stededata:', error);
  }
}

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

function visTettsted() {
  const søk = document.getElementById('søkInput').value.trim().toLowerCase();
  const entry = steder.find(e => e.tettsted.toLowerCase() === søk);

  if (!entry) {
    visFeilmelding('⚠ Fant ikke kommunenavn');
    return;
  }

function oppdaterInfo(entry) {
  // ✅ nå er entry definert
  document.getElementById('statusDisplay').textContent = `Fant ${entry.tettsted}`;
  // ...
}

function visFeilmelding(msg) {
  const el = document.getElementById('statusDisplay');
  if (el) el.textContent = msg;
}

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

document.addEventListener('DOMContentLoaded', async () => {
    await hentStederdata();

    document.getElementById('søkInput').addEventListener('keydown', (event) => {
        if (event.key === 'Enter') visTettsted();
    });

    document.getElementById('visButton').addEventListener('click', visTettsted);
});

async function hentSpotpris(sone) {
  const dato = new Date();
  const year = dato.getFullYear();
  const month = String(dato.getMonth() + 1).padStart(2, '0');
  const day = String(dato.getDate()).padStart(2, '0');

  const url = `https://www.hvakosterstrommen.no/api/v1/prices/${year}/${month}-${day}_${sone}.json`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Kunne ikke hente spotpris");
    const data = await response.json();
    const priser = data.map(p => p.NOK_per_kWh);
    const gjennomsnitt = (priser.reduce((a, b) => a + b, 0) / priser.length) * 100;
    return gjennomsnitt.toFixed(2);
  } catch (error) {
    console.error("Feil ved henting av spotpris:", error);
    return null;
  }


//function oppdaterInfo(entry) {
//  document.getElementById('statusDisplay').textContent =
//    `☑ Fant data for ${entry.tettsted}`;
  // osv...


  const entry = data.find(x => x.kommunenavn?.toLowerCase() === kommuneNavn.toLowerCase());
  if (!entry) {
    visFeilmelding("Fant ikke kommunen i stededata.");
    return;
  }

  document.getElementById('statusDisplay').textContent =
    `☑ Fant data for ${entry.tettsted}`);

document.getElementById('k_nrDisplay').textContent = entry.k_nr ?? 'Ukjent';
document.getElementById('tettstedDisplay').textContent = entry.tettsted ?? 'Ukjent';
document.getElementById('fylkeDisplay').textContent = entry.fylke ?? 'Ukjent';
document.getElementById('soneDisplay').textContent = entry.sone ?? 'Ukjent';

document.getElementById('antallDisplay').textContent = entry.antall ?? 'Ukjent';
document.getElementById('arealDisplay').textContent = entry.areal?.toLocaleString('no') ?? 'Ukjent';
document.getElementById('sysselsatteDisplay').textContent = entry.sysselsatte?.toLocaleString('no') ?? 'Ukjent';
document.getElementById('tilskuddDisplay').textContent = entry.tilskudd ?? 'Ukjent';
document.getElementById('språkDisplay').textContent = entry.språk ?? 'Ukjent';

document.getElementById('k_slagordDisplay').textContent = entry.k_slagord || 'Ingen slagord registrert';
document.getElementById('f_slagordDisplay').textContent = entry.f_slagord || 'Ingen slagord registrert';

async function init() {
  steder = await hentStederdata();
  // videre oppsett
}
init();

  const pris = await hentSpotpris(entry.sone);
  document.getElementById('prisDisplay').textContent =
    pris ? `${pris} øre/kWh ekskl. MVA` : 'Ingen pris tilgjengelig';
}

document.addEventListener('DOMContentLoaded', async () => {
  await hentStederdata(); // ✅ nå er await lov
});

  document.getElementById('visInfoBtn').addEventListener('click', () => {
    const kommune = document.getElementById('kommuneInput').value.trim();
    oppdaterInfo(kommune, data);
  });


function visFeilmelding(msg) {
  document.getElementById('fylkeDisplay').textContent = ' ';
  document.getElementById('folketallDisplay').textContent = ' ';
  document.getElementById('soneDisplay').textContent = ' ';
  document.getElementById('slagordDisplay').textContent = msg;
  document.getElementById('prisDisplay').textContent = ' ';
}

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