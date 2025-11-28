// server-b/server.js
const express = require('express');
const { db, initDatabase } = require('./database');

const app = express();
const PORT = 4000;

// JSON-bodyjen parsinta
app.use(express.json());

// Alustetaan tietokanta
initDatabase();

/*
  POST /adoptions

  Odottaa bodyssa:
  {
    "animalId": 1,
    "applicantName": "Testihakija",
    "applicantEmail": "testi@example.com",
    "message": "Haluaisin adoptoida tämän eläimen."
  }
*/
app.post('/adoptions', (req, res) => {
  const { animalId, applicantName, applicantEmail, message } = req.body || {};

  // Perusvalidoinnit
  if (!animalId || !applicantName || !applicantEmail) {
    return res.status(400).json({
      error: 'animalId, applicantName ja applicantEmail ovat pakollisia kenttiä.',
    });
  }

  // Tarkistetaan, onko tälle eläimelle jo adoptio olemassa
  db.get(
    'SELECT * FROM adoptions WHERE animalId = ?',
    [animalId],
    (err, row) => {
      if (err) {
        console.error('Virhe tarkistettaessa olemassa olevaa adoptiota:', err);
        return res.status(500).json({ error: 'Palvelinvirhe' });
      }

      if (row) {
        // Eläin on jo adoptoitu
        return res.status(409).json({
          error: 'Tälle eläimelle on jo olemassa adoptiohakemus / se on adoptoitu.',
        });
      }

      const createdAt = new Date().toISOString();

      // Ei aiempaa adoptiota → lisätään uusi
      db.run(
        `
        INSERT INTO adoptions (animalId, applicantName, applicantEmail, message, createdAt)
        VALUES (?, ?, ?, ?, ?)
        `,
        [animalId, applicantName, applicantEmail, message || '', createdAt],
        function (insertErr) {
          if (insertErr) {
            console.error('Virhe tallennettaessa adoptiota:', insertErr);
            return res.status(500).json({ error: 'Palvelinvirhe' });
          }

          console.log(
            `Uusi adoptio: eläin ${animalId}, hakija ${applicantName} (${applicantEmail})`
          );

          return res.status(201).json({
            id: this.lastID,
            animalId,
            applicantName,
            applicantEmail,
            message: message || '',
            createdAt,
          });
        }
      );
    }
  );
});

// Käynnistetään Server B
app.listen(PORT, () => {
  console.log(`Server B (Adoption service) käynnissä: http://localhost:${PORT}`);
});
