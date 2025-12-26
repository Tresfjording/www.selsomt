document.addEventListener("DOMContentLoaded", () => {
  console.log("Init startet");

  const sokInput = document.getElementById("sokInput");
  const visInfoBtn = document.getElementById("visInfoBtn");

  if (!sokInput || !visInfoBtn) {
    console.error("Fant ikke sokInput eller visInfoBtn");
    return;
  }

  const map = L.map('map').setView([65.0, 15.0], 5);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  fetch("tettsteder_3.json")
    .then(r => r.json())
    .then(data => {
      console.log("Lastet tettsteder_3.json –", data.length, "poster");

      // Vis alle ved oppstart
      data.forEach(item => {
        if (item.lat_decimal && item.lon_decimal) {
          L.marker([item.lat_decimal, item.lon_decimal])
            .addTo(map)
            .bindPopup(`<strong>${item.tettsted}</strong><br>${item.fylke}<br>${item.k_slagord || ""}`);
        }
      });

      // Søkefunksjon
      window.visSoktTettsted = function () {
        const query = sokInput.value.trim().toLowerCase();
        const entry = data.find(item => item.tettsted.toLowerCase() === query);

        console.log("Søkte etter:", query);
        console.log("Fant entry:", entry);

        if (!entry) {
          alert("Fant ikke tettstedet");
          return;
        }

        map.eachLayer(layer => {
          if (layer instanceof L.Marker) map.removeLayer(layer);
        });

        L.marker([entry.lat_decimal, entry.lon_decimal])
          .addTo(map)
          .bindPopup(`<strong>${entry.tettsted}</strong><br>${entry.fylke}<br>${entry.k_slagord || ""}`)
          .openPopup();

        map.setView([entry.lat_decimal, entry.lon_decimal], 12);
      };

      // Koble knapp og Enter-tast
      visInfoBtn.addEventListener("click", window.visSoktTettsted);
      sokInput.addEventListener("keyup", e => {
        if (e.key === "Enter") window.visSoktTettsted();
      });
    })
    .catch(err => console.error("Feil ved lasting av JSON:", err));
});