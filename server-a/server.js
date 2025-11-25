// server.js (Server A - Animals & API Gateway)
const express = require('express');
const path = require('path');
const { db, initDatabase } = require('./database');

const app = express();
const PORT = 3000;

// Parsitaan JSON-bodyt (POST-pyyntöjä varten)
app.use(express.json());

// Palvellaan frontend myöhemmin juuren kautta (../frontend-kansiosta)
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

/*
  POST /animals/:id/adopt
  Tässä vaiheessa tehdään yksinkertainen versio:
  - tarkistaa, että eläin on olemassa ja "available"
  - merkitsee sen adoptoiduksi (status = 'adopted')

  Myöhemmin laajennetaan niin, että tämä
  KUTSUU Server B:tä (POST /adoptions).
*/
app.post('/animals/:id/adopt', (req, res) => {
  const id = req.params.id;
  const { applicantName, applicantEmail, message } = req.body || {};

  // Vähän validointia
  if (!applicantName || !applicantEmail) {
    return res.status(400).json({
      error: 'Hakijan nimi ja sähköposti ovat pakollisia.',
    });
  }

  // Haetaan ensin eläin
  db.get('SELECT * FROM animals WHERE id = ?', [id], (err, animal) => {
    if (err) {
      console.error('Virhe haettaessa eläintä (adoptio):', err);
      return res.status(500).json({ error: 'Palvelinvirhe' });
    }

    if (!animal) {
      return res.status(404).json({ error: 'Eläintä ei löytynyt' });
    }

    if (animal.status === 'adopted') {
      return res
        .status(409)
        .json({ error: 'Eläin on jo adoptoitu, sitä ei voi adoptoida uudestaan.' });
    }

    // Tässä kohtaa _oikeasti_ kutsuttaisiin Server B:tä.
    // Nyt tehdään yksinkertainen versio: päivitetään statukseksi 'adopted'
    db.run(
      'UPDATE animals SET status = ? WHERE id = ?',
      ['adopted', id],
      function (updateErr) {
        if (updateErr) {
          console.error('Virhe päivittäessä eläimen statusta:', updateErr);
          return res.status(500).json({ error: 'Palvelinvirhe' });
        }

        console.log(
          `Eläin ${id} adoptoitu hakijalle: ${applicantName} (${applicantEmail})`
        );

        return res.status(201).json({
          message: 'Adoptiohakemus vastaanotettu ja eläin merkitty adoptoiduksi.',
          animalId: id,
          applicantName,
          applicantEmail,
          note: 'Myöhemmin tämä menee Server B:lle käsiteltäväksi.',
        });
      }
    );
  });
});

// Käynnistetään palvelin
app.listen(PORT, () => {
  console.log(`Server A käynnissä: http://localhost:${PORT}`);
});
