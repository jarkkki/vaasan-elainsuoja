// database.js
const sqlite3 = require('sqlite3').verbose();

// Luodaan yhteys tietokantaan (tiedosto luodaan jos ei ole olemassa)
// Tämä luo animals.db -tiedoston server-a -kansioon
const db = new sqlite3.Database('animals.db');

// Funktio, joka alustaa tietokannan ja lisää esimerkkieläimet
function initDatabase() {
  db.serialize(() => {
    // 1. Luodaan animals-taulu, jos sitä ei vielä ole
    db.run(`
      CREATE TABLE IF NOT EXISTS animals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,           -- esim. kissa / koira
        age INTEGER,                  -- ikä vuosina
        breed TEXT,                   -- rotu
        description TEXT,             -- kuvaus
        imageUrl TEXT,                -- kuvan URL
        status TEXT NOT NULL DEFAULT 'available'  -- available / adopted
      )
    `);

    // 2. Tarkistetaan onko taulussa jo dataa
    db.get('SELECT COUNT(*) AS count FROM animals', (err, row) => {
      if (err) {
        console.error('Virhe laskettaessa eläinten määrää:', err);
        return;
      }

      if (row.count === 0) {
        console.log('Animals-taulu tyhjä, lisätään esimerkkieläimet...');

        const insertStmt = db.prepare(`
          INSERT INTO animals (name, type, age, breed, description, imageUrl, status)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        // Esimerkkieläimet
        insertStmt.run(
          'Misu',
          'kissa',
          2,
          'Eurooppalainen lyhytkarva',
          'Rauhallinen sisäkissa, tykkää rapsutuksista ja ikkunalaudasta.',
          'https://placekitten.com/250/250',
          'available'
        );

        insertStmt.run(
          'Rekku',
          'koira',
          4,
          'Sekarotu',
          'Energiaa täynnä, tarvitsee paljon ulkoilua ja leikkiä.',
          'https://placedog.net/400/300',
          'available'
        );

        insertStmt.run(
          'Luna',
          'kissa',
          1,
          'Maine Coon -sekoitus',
          'Leikkisä nuori kissa, tulee hyvin toimeen lasten kanssa.',
          'https://placekitten.com/260/260',
          'available'
        );

        insertStmt.run(
          'Max',
          'koira',
          6,
          'Labradorinnoutaja',
          'Lempeä ja ihmisrakas, sopii ensimmäiseksi koiraksi.',
          'https://placedog.net/410/300',
          'available'
        );

        insertStmt.run(
          'Nuppu',
          'kissa',
          3,
          'Siamilainen sekoitus',
          'Sosiaalinen ja äänekäs kissa, tykkää olla mukana kaikessa.',
          'https://placekitten.com/255/255',
          'available'
        );

        insertStmt.finalize(() => {
          console.log('Esimerkkieläimet lisätty animals-tauluun.');
        });
      } else {
        console.log(`Animals-taulussa on jo ${row.count} eläintä, ei lisätä testidataa.`);
      }
    });
  });
}

// Exportataan db ja initDatabase, jotta server.js voi käyttää näitä
module.exports = {
  db,
  initDatabase,
};
