async function hentKommunedata() {
  try {
    const response = await fetch('kommuner_soner_slagord.json');
    if (!response.ok) throw new Error('Kunne ikke hente JSON');
    return await response.json();
  } catch (error) {
    console.error('Feil ved henting av kommunedata:', error);
    return {};
  }
}

function fyllDatalist(data) {
  const datalist = document.getElementById('kommuner');
  datalist.innerHTML = ''; // rydder opp
  Object.keys(data).forEach(kommune => {
    const option = document.createElement('option');
    option.value = kommune;
    datalist.appendChild(option);
  });
}

function oppdaterInfo(kommune, data) {
  const entry = data[kommune.toLowerCase()];
  if (!entry) {
    document.getElementById('soneDisplay').textContent = 'Ukjent';
    document.getElementById('slagordDisplay').textContent = 'Ingen slagord registrert';
    return;
  }
  document.getElementById('soneDisplay').textContent = entry.sone ?? 'Ukjent';
  document.getElementById('slagordDisplay').textContent = entry.slagord ?? 'Ingen slagord registrert';
}

document.addEventListener('DOMContentLoaded', async () => {
  const data = await hentKommunedata();
  fyllDatalist(data);

  document.getElementById('visInfoBtn').addEventListener('click', () => {
    const kommune = document.getElementById('kommuneInput').value.trim();
    oppdaterInfo(kommune, data);
  });
});