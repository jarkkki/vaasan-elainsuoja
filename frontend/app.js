const statusEl = document.getElementById('status');
const listView = document.getElementById('list-view');
const detailView = document.getElementById('detail-view');
const animalsContainer = document.getElementById('animals');
const animalDetailEl = document.getElementById('animal-detail');
const backButton = document.getElementById('back-button');
const adoptionForm = document.getElementById('adoption-form');
const adoptionResultEl = document.getElementById('adoption-result');

let currentAnimal = null;

// Hae kaikki eläimet listanäkymää varten
async function loadAnimals() {
  try {
    const res = await fetch('/animals');
    if (!res.ok) throw new Error('Virhe haettaessa eläimiä');
    const animals = await res.json();

    statusEl.textContent = '';

    if (animals.length === 0) {
      statusEl.textContent = 'Ei adoptoitavia eläimiä tällä hetkellä.';
      return;
    }

    animalsContainer.innerHTML = '';
    animals.forEach((animal) => {
      const card = document.createElement('div');
      card.className = 'animal-card';

      const img = document.createElement('img');
      img.src = animal.imageUrl || 'https://placehold.co/300x200?text=Eläin';
      img.alt = animal.name;

      const name = document.createElement('div');
      name.className = 'animal-name';
      name.textContent = animal.name;

      const meta = document.createElement('div');
      meta.className = 'animal-meta';
      meta.textContent = `${animal.type} • ${animal.age ?? '?'} v • ${
        animal.breed || 'tuntematon rotu'
      }`;

      const badges = document.createElement('div');
      const typeBadge = document.createElement('span');
      typeBadge.className = 'badge type';
      typeBadge.textContent = animal.type;

      const statusBadge = document.createElement('span');
      statusBadge.className =
        'badge ' +
        (animal.status === 'adopted' ? 'status-adopted' : 'status-status-available');
      statusBadge.textContent =
        animal.status === 'adopted' ? 'Adoptoitu' : 'Vapaa adoptoitavaksi';

      badges.appendChild(typeBadge);
      badges.appendChild(statusBadge);

      const actions = document.createElement('div');
      actions.className = 'card-actions';

      const button = document.createElement('button');
      button.className = 'button view';
      button.textContent = 'Katso lisää';
      button.disabled = animal.status === 'adopted';
      button.addEventListener('click', () => showAnimalDetail(animal.id));

      actions.appendChild(button);

      card.appendChild(img);
      card.appendChild(name);
      card.appendChild(meta);
      card.appendChild(badges);
      card.appendChild(actions);

      animalsContainer.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    statusEl.textContent = 'Virhe ladattaessa eläimiä.';
  }
}

// Näytä yksittäisen eläimen tiedot ja adoptiolomake
async function showAnimalDetail(id) {
  try {
    const res = await fetch(`/animals/${id}`);
    if (!res.ok) throw new Error('Eläintä ei löytynyt');
    const animal = await res.json();
    currentAnimal = animal;

    listView.classList.add('hidden');
    detailView.classList.remove('hidden');
    adoptionResultEl.textContent = '';
    adoptionForm.reset();

    const imgUrl = animal.imageUrl || 'https://placehold.co/400x300?text=Eläin';

    animalDetailEl.innerHTML = `
      <div class="detail-header">
        <img src="${imgUrl}" alt="${animal.name}" />
        <div class="detail-info">
          <h2>${animal.name}</h2>
          <p><strong>Tyyppi:</strong> ${animal.type}</p>
          <p><strong>Ikä:</strong> ${animal.age ?? '?'} vuotta</p>
          <p><strong>Rotu:</strong> ${animal.breed || 'tuntematon'}</p>
          <p><strong>Status:</strong> ${
            animal.status === 'adopted' ? 'Adoptoitu' : 'Vapaa'
          }</p>
        </div>
      </div>
      <p>${animal.description || 'Ei kuvausta.'}</p>
    `;

    if (animal.status === 'adopted') {
      adoptionForm.querySelector('button[type="submit"]').disabled = true;
      adoptionResultEl.textContent =
        'Tämä eläin on jo adoptoitu, et voi jättää uutta hakemusta.';
    } else {
      adoptionForm.querySelector('button[type="submit"]').disabled = false;
    }
  } catch (err) {
    console.error(err);
    alert('Eläimen tietojen lataus epäonnistui.');
  }
}

// Takaisin listaan
backButton.addEventListener('click', () => {
  detailView.classList.add('hidden');
  listView.classList.remove('hidden');
  currentAnimal = null;
});

// Lähetä adoptiohakemus
adoptionForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentAnimal) return;

  const applicantName = document.getElementById('applicantName').value;
  const applicantEmail = document.getElementById('applicantEmail').value;
  const message = document.getElementById('message').value;

  try {
    const res = await fetch(`/animals/${currentAnimal.id}/adopt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicantName, applicantEmail, message }),
    });

    const data = await res.json();

    if (!res.ok) {
      adoptionResultEl.textContent = data.error || 'Adoptio epäonnistui.';
      adoptionResultEl.style.color = '#b91c1c';
    } else {
      adoptionResultEl.textContent = data.message || 'Adoptiohakemus lähetetty!';
      adoptionResultEl.style.color = '#166534';

      // Päivitetään listanäkymä taustalla
      await loadAnimals();
    }
  } catch (err) {
    console.error(err);
    adoptionResultEl.textContent = 'Virhe yhteydessä palvelimeen.';
    adoptionResultEl.style.color = '#b91c1c';
  }
});

// Käynnistetään: haetaan eläinlista kun sivu latautuu
document.addEventListener('DOMContentLoaded', loadAnimals);
