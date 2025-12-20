// JavaScript source code
const express = require("express");
const fetch = require("node-fetch");
const { JSDOM } = require("jsdom");

const app = express();
const PORT = 3000;

app.use(express.static("public"));

app.get("/api/se3-now", async (req, res) => {
  try {
    const response = await fetch("https://www.elekt.com/no/spotpriser/sverige/se3");
    const html = await response.text();
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    const now = doc.querySelector(".price-now .value")?.textContent.trim();

    res.json({ now: now || null });
  } catch (error) {
    res.status(500).json({ error: "Kunne ikke hente SE3-prisen" });
  }
});

app.listen(PORT, () => {
  console.log(`Server kjører på http://localhost:${PORT}`);
});