
//window.location.href = "/404.html";

async function hentStederdata() {
  try {
    const response = await fetch('/steder.json');
    if (!response.ok) throw new Error('Kunne ikke hente JSON');
    return await response.json();
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
    option.value = entry["kommunenavn"];
    datalist.appendChild(option);
  });
}

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

  const entry = data.find(x => x["kommunenavn"]?.toLowerCase() === kommuneNavn.toLowerCase());
  if (!entry) {
    visFeilmelding("Fant ikke kommunen i stededata.");
    return;
  }
  document.getElementById('statusDisplay').textContent =
    `✅ Fant data for ${entry.kommunenavn}`;

  document.getElementById('fylkeDisplay').textContent = entry["fylke"] ?? 'Ukjent';
  document.getElementById('folketallDisplay').textContent = entry["folketall"]?.toLocaleString('no-NO') ?? '�';
  document.getElementById('soneDisplay').textContent = entry.sone ?? 'Ukjent';
  document.getElementById('slagordDisplay').textContent = entry.slagord || 'Ingen slagord registrert';
 

  const pris = await hentSpotpris(entry.sone);
  document.getElementById('prisDisplay').textContent = pris ? `${pris} �re/kWh ekskl. MVA` : 'Ingen pris tilgjengelig';
}
document.addEventListener('DOMContentLoaded', async () => {
  const data = await hentStederdata();
  fyllDatalist(data);

  document.getElementById('visInfoBtn').addEventListener('click', () => {
    const kommune = document.getElementById('kommuneInput').value.trim();
    oppdaterInfo(kommune, data);
document.getElementById('fylkeDisplay').textContent = entry["fylke"] ?? 'Ukjent';
document.getElementById('folketallDisplay').textContent = entry["folketall"]?.toLocaleString();
  });
});
function visFeilmelding(msg) {
  document.getElementById('fylkeDisplay').textContent = '�';
  document.getElementById('folketallDisplay').textContent = '�';
  document.getElementById('soneDisplay').textContent = '�';
  document.getElementById('slagordDisplay').textContent = msg;
  document.getElementById('prisDisplay').textContent = '�';
}

// /api/se3-now.js
async function hentSE3() {
  try {
    const url = "https://api.energidataservice.dk/dataset/Elspotprices?filter=%7B%22PriceArea%22%3A%20%22SE3%22%7D&limit=1&sort=HourUTC%20desc";

    const res = await fetch(url);
    const data = await res.json();

    // Pris kommer i EUR/MWh → vi gjør om til øre/kWh
    const eurMWh = data.records[0].SpotPriceEUR;
    const nokPerKWh = eurMWh * 11.5 / 1000 * 100; // 11.5 = ca. NOK/EUR

    const avrundet = Math.round(nokPerKWh);

    document.getElementById("se3-price").innerHTML =
      `🇸🇪 Sverige (SE3 – Stockholm): <strong>${avrundet}</strong> øre/kWh akkurat nå`;

  } catch (e) {
    document.getElementById("se3-price").innerHTML =
      "🇸🇪 Sverige (SE3 – Stockholm): ikke tilgjengelig";
  }
}

hentSE3();