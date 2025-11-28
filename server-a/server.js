// server.js (Server A - Animals & API Gateway)
const express = require('express');
const path = require('path');
const axios = require('axios'); // kutsutaan Server B:tä tällä
const { db, initDatabase } = require('./database');

const app = express();
const PORT = 3000;

// Parsitaan JSON-bodyt (POST-pyyntöjä varten)
app.use(express.json());

// Palvellaan frontend juuren kautta (../frontend-kansiosta)
app.use(express.static(path.join(__dirname, '../frontend')));

// Alustetaan tietokanta kun serveri käynnistyy
initDatabase();

// GET /animals - hae kaikki eläimet
app.get('/animals', (req, res) => {
  db.all('SELECT * FROM animals', [], (err, rows) => {
    if (err) {
      console.error('Virhe haettaessa eläimiä:', err);
      return res.status(500).json({ error: 'Palvelinvirhe' });
    }
    res.json(rows);
  });
});

// GET /animals/:id - hae yksittäinen eläin
app.get('/animals/:id', (req, res) => {
  const id = req.params.id;

  db.get('SELECT * FROM animals WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Virhe haettaessa eläintä:', err);
      return res.status(500).json({ error: 'Palvelinvirhe' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Eläintä ei löytynyt' });
    }

    res.json(row);
  });
});

// POST /animals/:id/adopt – välittää hakemuksen Server B:lle
app.post('/animals/:id/adopt', async (req, res) => {
  const id = req.params.id;
  const { applicantName, applicantEmail, message } = req.body || {};

  // Perusvalidointi
  if (!applicantName || !applicantEmail) {
    return res.status(400).json({
      error: 'Hakijan nimi ja sähköposti ovat pakollisia.',
    });
  }

  try {
    // 1. Haetaan eläin tietokannasta
    const animal = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM animals WHERE id = ?', [id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });

    if (!animal) {
      return res.status(404).json({ error: 'Eläintä ei löytynyt.' });
    }

    if (animal.status === 'adopted') {
      return res
        .status(409)
        .json({ error: 'Eläin on jo adoptoitu, sitä ei voi adoptoida uudestaan.' });
    }

    // 2. Lähetetään adoptiohakemus Server B:lle
    let adoptionResponse;
    try {
      adoptionResponse = await axios.post('http://localhost:4000/adoptions', {
        animalId: Number(id),
        applicantName,
        applicantEmail,
        message,
      });
    } catch (err) {
      // Jos Server B palauttaa virhekoodin (409, 400, 500, ...)
      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;

        return res.status(status).json({
          error:
            data && data.error
              ? data.error
              : 'Adoptio epäonnistui adoptiopalvelimessa (Server B).',
        });
      } else {
        console.error('Virhe yhteydessä Server B:hen:', err.message);
        return res
          .status(502)
          .json({ error: 'Virhe yhteydessä adoptiopalvelimeen (Server B).' });
      }
    }

    // 3. Jos Server B hyväksyi (esim. 201), päivitetään eläimen status
    if (adoptionResponse.status === 201) {
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE animals SET status = ? WHERE id = ?',
          ['adopted', id],
          function (err) {
            if (err) return reject(err);
            resolve();
          }
        );
      });

      return res.status(201).json({
        message: 'Adoptiohakemus lähetetty ja eläin merkitty adoptoiduksi.',
        animalId: id,
        applicantName,
        applicantEmail,
      });
    } else {
      return res
        .status(500)
        .json({ error: 'Odottamaton vastaus adoptiopalvelimelta.' });
    }
  } catch (err) {
    console.error('Virhe adoptio-prosessissa Server A:ssa:', err);
    return res.status(500).json({ error: 'Palvelinvirhe adoptio-prosessissa.' });
  }
});

// Käynnistetään palvelin
app.listen(PORT, () => {
  console.log(`Server A käynnissä: http://localhost:${PORT}`);
});
