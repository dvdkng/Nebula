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
    const badge = game.source === 'steam' ? '<span class="steam-badge">STEAM</span>' : '';

    card.innerHTML = `
            ${badge}
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

    card.onclick = () => api.launchGame(game);
    gameGrid.appendChild(card);
  });
}

async function removeGame(event, id) {
  event.stopPropagation();
  api.removeGame(id);
  init();
}

searchBar.oninput = (e) => {
  const term = e.target.value.toLowerCase();
  const filtered = library.filter(g => g.name.toLowerCase().includes(term));
  render(filtered);
};

addGameBtn.onclick = async () => {
  showGameSourceMenu();
};

let currentModal = null;

async function showGameSourceMenu() {
  const steamGames = await api.getSteamGames();

  if (steamGames.length === 0) {
    const res = await api.addGame();
    if (res) init();
    return;
  }

  const modal = document.createElement('div');
  modal.className = 'source-menu';
  currentModal = modal;

  const content = document.createElement('div');
  content.className = 'source-menu-content';

  const sourceScreen = createSourceScreen();
  content.appendChild(sourceScreen);

  modal.appendChild(content);
  document.body.appendChild(modal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
      currentModal = null;
    }
  });
}

function createSourceScreen() {
  const screen = document.createElement('div');
  screen.className = 'modal-screen';

  screen.innerHTML = `
    <h2>Add Game</h2>
    <p>Choose how you'd like to add a game to your library.</p>
    <div class="source-menu-buttons">
      <button class="source-menu-btn" onclick="handleLocalGame()">
        <div class="source-menu-btn-label">
          <div class="source-menu-btn-title">Local Game</div>
          <div class="source-menu-btn-desc">Browse from your computer</div>
        </div>
        <div class="source-menu-btn-arrow">→</div>
      </button>
      <button class="source-menu-btn" onclick="handleSteamSelection()">
        <div class="source-menu-btn-label">
          <div class="source-menu-btn-title">Steam Game</div>
          <div class="source-menu-btn-desc">From your Steam library</div>
        </div>
        <div class="source-menu-btn-arrow">→</div>
      </button>
    </div>
  `;

  return screen;
}

async function handleLocalGame() {
  const res = await api.addGame();
  if (res) {
    currentModal?.remove();
    currentModal = null;
    init();
  }
}

async function handleSteamSelection() {
  const steamGames = await api.getSteamGames();
  if (!currentModal) return;

  const content = currentModal.querySelector('.source-menu-content');
  const currentScreen = content.querySelector('.modal-screen');

  if (currentScreen) {
    currentScreen.classList.add('exit');
    await new Promise(resolve => {
      currentScreen.addEventListener('animationend', resolve, { once: true });
      setTimeout(resolve, 350);
    });
  }

  const steamScreen = createSteamScreen(steamGames);
  content.innerHTML = '';
  content.appendChild(steamScreen);
}

function createSteamScreen(steamGames) {
  const screen = document.createElement('div');
  screen.className = 'modal-screen';

  let gameItemsHtml = steamGames.map(game => {
    const safeName = game.name.replace(/'/g, "\\'");
    return `<div class="steam-game-item" onclick="addSteamGameToLibrary('${game.appid}', '${safeName}', event)">${game.name}</div>`;
  }).join('');

  screen.innerHTML = `
    <div class="modal-header">
      <button class="modal-back-btn" onclick="goBackToSourceMenu()">←</button>
      <h2>Steam Games</h2>
      <div style="width: 40px;"></div>
    </div>
    <div class="steam-games-list">
      ${gameItemsHtml}
    </div>
  `;

  return screen;
}

async function goBackToSourceMenu() {
  if (!currentModal) return;

  const content = currentModal.querySelector('.source-menu-content');
  const currentScreen = content.querySelector('.modal-screen');

  if (currentScreen) {
    currentScreen.classList.add('exit');
    await new Promise(resolve => {
      currentScreen.addEventListener('animationend', resolve, { once: true });
      setTimeout(resolve, 350);
    });
  }

  const sourceScreen = createSourceScreen();
  content.innerHTML = '';
  content.appendChild(sourceScreen);
}

async function addLocalGame() {
  const res = await api.addGame();
  if (res) {
    currentModal?.remove();
    currentModal = null;
    init();
  }
}

async function addSteamGameToLibrary(appid, name, event) {
  if (event) event.stopPropagation();
  const res = await api.addSteamGame({ appid, name });
  if (res) {
    currentModal?.remove();
    currentModal = null;
    init();
  }
}

init();