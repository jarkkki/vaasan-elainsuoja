// server-b/database.js
const sqlite3 = require('sqlite3').verbose();

// Tämä tietokanta tallentaa adoptiohakemukset
const db = new sqlite3.Database('adoptions.db');

function initDatabase() {
  db.serialize(() => {
    // Taulu adoptiohakemuksille
    db.run(`
      CREATE TABLE IF NOT EXISTS adoptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        animalId INTEGER NOT NULL UNIQUE, -- sama eläin vain kerran
        applicantName TEXT NOT NULL,
        applicantEmail TEXT NOT NULL,
        message TEXT,
        createdAt TEXT NOT NULL
      )
    `);

    console.log('Adoptions-taulu tarkistettu/luotu.');
  });
}

module.exports = {
  db,
  initDatabase,
};
