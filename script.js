async function hentKommunedata() {
  try {
    const response = await fetch('steder.json');
    if (!response.ok) throw new Error('Kunne ikke hente JSON');
    return await response.json();
  } catch (error) {
    console.error('Feil ved henting av kommunedata:', error);
    return {};
  }
}

function fyllDatalist(data) {
  const datalist = document.getElementById('kommuner');
  datalist.innerHTML = '';
  Object.keys(data).forEach(kommune => {
    const option = document.createElement('option');
    option.value = kommune;
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

    // API gir timespriser – vi tar gjennomsnitt
    const priser = data.map(p => p.NOK_per_kWh);
    const gjennomsnitt = (priser.reduce((a, b) => a + b, 0) / priser.length) * 100; // til øre
    return gjennomsnitt.toFixed(2);
  } catch (error) {
    console.error("Feil ved henting av spotpris:", error);
    return null;
  }
}

async function oppdaterInfo(kommune, data) {
  const entry = data[kommune.toLowerCase()];
  if (!entry) {
    document.getElementById('soneDisplay').textContent = 'Ukjent';
    document.getElementById('slagordDisplay').textContent = 'Ingen slagord registrert';
    document.getElementById('prisDisplay').textContent = '–';
    return;
  }

  document.getElementById('soneDisplay').textContent = entry.sone ?? 'Ukjent';
  document.getElementById('slagordDisplay').textContent = entry.slagord ?? 'Ingen slagord registrert';

  const pris = await hentSpotpris(entry.sone);
  document.getElementById('prisDisplay').textContent = pris ? `${pris} øre/kWh` : 'Ingen pris tilgjengelig';
}

document.addEventListener('DOMContentLoaded', async () => {
  const data = await hentKommunedata();
  fyllDatalist(data);

  document.getElementById('visInfoBtn').addEventListener('click', () => {
    const kommune = document.getElementById('kommuneInput').value.trim();
    oppdaterInfo(kommune, data);
  });
});