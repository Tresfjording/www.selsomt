
console.log("Prøver å hente kommuneliste...");

async function hentStederdata() {
  try {
    const response = await fetch('/kommuner_soner_slagord.json');
    if (!response.ok) throw new Error('Kunne ikke hente JSON');

    const dataObj = await response.json();
    const data = Object.entries(dataObj).map(([kommunenavn, info]) => ({
      kommunenavn,
      ...info
    }));

    return data;
  } catch (error) {
    console.error('Feil ved henting av stederdata:', error);
    return null;
  }
}


function fyllDatalist(data) {
  const datalist = document.getElementById('kommune');
  datalist.innerHTML = '';
  data.forEach(entry => {
    const option = document.createElement('option');
    option.value = entry.kommunenavn;
    datalist.appendChild(option);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const data = await hentStederdata();
  fyllDatalist(data);
  visRandomFakta();

  // Klikk på knappen
  document.getElementById('visInfoBtn').addEventListener('click', () => {
    const kommune = document.getElementById('kommuneInput').value.trim();
    oppdaterInfo(kommune, data);
    visRandomFakta();
  });

  // 👉 ENTER-FUNKSJONEN – lim inn her
  document.getElementById('kommuneInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('visInfoBtn').click();
    }
  });
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
}

async function oppdaterInfo(kommuneNavn, data) {
  if (!data || data.length === 0) {
    visFeilmelding("Ingen stededata tilgjengelig.");
    return;
  }

  const entry = data.find(x => x.kommunenavn?.toLowerCase() === kommuneNavn.toLowerCase());
  if (!entry) {
    visFeilmelding("Fant ikke kommunen i stededata.");
    return;
  }

  document.getElementById('statusDisplay').textContent =
    `✅ Fant data for ${entry.kommunenavn}`;

  document.getElementById('fylkeDisplay').textContent = entry.fylke ?? 'Ukjent';
  document.getElementById('folketallDisplay').textContent = entry.folketall?.toLocaleString('no-NO') ?? ' ';
  document.getElementById('soneDisplay').textContent = entry.sone ?? 'Ukjent';
  document.getElementById('slagordDisplay').textContent = entry.slagord || 'Ingen slagord registrert';

  const pris = await hentSpotpris(entry.sone);
  document.getElementById('prisDisplay').textContent =
    pris ? `${pris} øre/kWh ekskl. MVA` : 'Ingen pris tilgjengelig';
}

document.addEventListener('DOMContentLoaded', async () => {
  const data = await hentStederdata();
  fyllDatalist(data);

  document.getElementById('visInfoBtn').addEventListener('click', () => {
    const kommune = document.getElementById('kommuneInput').value.trim();
    oppdaterInfo(kommune, data);
  });
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
