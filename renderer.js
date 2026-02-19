const gameGrid = document.getElementById('game-grid');
const addGameBtn = document.getElementById('add-game-btn');
const searchBar = document.getElementById('search-bar');

let library = [];

async function init() {
  library = await api.getGames();
  render(library);
}

function render(games) {
  gameGrid.innerHTML = '';

  games.forEach(game => {
    const card = document.createElement('div');
    card.className = 'game-card';

    const imgSrc = game.image ? `file://${game.image}` : '';

    card.innerHTML = `
            <button class="remove-btn" onclick="removeGame(event, ${game.id})" title="Remove from Library">
               <svg width="10" height="10" viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L9 9M9 1L1 9" stroke="white" stroke-width="1" stroke-linecap="round"/>
              </svg>
            </button>
            <div class="poster-wrapper">
                ${imgSrc ? `<img src="${imgSrc}" class="poster">` : `<div class="poster" style="display:flex;align-items:center;justify-content:center;font-size:10px;color:#333">NO COVER</div>`}
            </div>
            <div class="game-title">${game.name}</div>
        `;

    card.onclick = () => api.launchGame(game.path);
    gameGrid.appendChild(card);
  });
}

async function removeGame(event, id) {
  event.stopPropagation(); // Prevents launching the game when clicking delete
  api.removeGame(id);
  init();
}

searchBar.oninput = (e) => {
  const term = e.target.value.toLowerCase();
  const filtered = library.filter(g => g.name.toLowerCase().includes(term));
  render(filtered);
};

addGameBtn.onclick = async () => {
  const res = await api.addGame();
  if (res) init();
};

init();