const gameGrid = document.getElementById('game-grid');
const addGameBtn = document.getElementById('add-game-btn');
const searchBar = document.getElementById('search-bar');
const editModeBtn = document.getElementById('edit-mode-btn');

let library = [];
let isEditMode = false;

async function init() {
  library = await api.getGames();
  render(library);
}

// Toggle Edit Mode
editModeBtn.onclick = () => {
  isEditMode = !isEditMode;
  editModeBtn.classList.toggle('active', isEditMode);

  if (isEditMode) {
    searchBar.value = ''; // Clear search to avoid mixing up indexes while saving
    searchBar.disabled = true;
    searchBar.style.opacity = '0.3';
  } else {
    searchBar.disabled = false;
    searchBar.style.opacity = '1';
  }

  render(library);
};

function render(games) {
  gameGrid.innerHTML = '';

  if (isEditMode) {
    // --- LIST VIEW (EDIT MODE) ---
    gameGrid.className = 'game-list';

    games.forEach(game => {
      const item = document.createElement('div');
      item.className = 'game-list-item';
      item.dataset.id = game.id;

      const imgSrc = game.image ? `file://${game.image}` : '';
      const badge = game.source === 'steam' ? '<span class="steam-badge-list">STEAM</span>' : '';

      item.innerHTML = `
        <div class="drag-handle" draggable="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="4" y1="9" x2="20" y2="9"></line>
            <line x1="4" y1="15" x2="20" y2="15"></line>
          </svg>
        </div>
        <div class="list-poster-wrapper">
            ${badge}
            ${imgSrc ? `<img src="${imgSrc}" class="list-poster">` : `<div class="list-poster" style="display:flex;align-items:center;justify-content:center;font-size:8px;color:#333">NO COVER</div>`}
        </div>
        <input type="text" class="edit-name-input" value="${game.name}" placeholder="Game Title" spellcheck="false" />
        <button class="remove-btn-list" onclick="removeGame(event, ${game.id})" title="Remove from Library">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M18 6L6 18M6 6l12 12"></path>
          </svg>
        </button>
      `;

      // Live Name Updating
      const input = item.querySelector('.edit-name-input');
      input.addEventListener('change', (e) => {
        const targetGame = library.find(g => g.id === game.id);
        if (targetGame) {
          targetGame.name = e.target.value;
          api.saveGames(library);
        }
      });

      // Drag and Drop Events - Only on drag handle
      const dragHandle = item.querySelector('.drag-handle');
      dragHandle.addEventListener('dragstart', () => {
        item.classList.add('dragging');
      });

      dragHandle.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        updateLibraryOrder();
      });

      gameGrid.appendChild(item);
    });

  } else {
    // --- GRID VIEW (NORMAL MODE) ---
    gameGrid.className = 'game-grid';

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
}

// Global Drag Over handler to calculate insert position dynamically
gameGrid.addEventListener('dragover', (e) => {
  if (!isEditMode) return;
  e.preventDefault();

  const afterElement = getDragAfterElement(gameGrid, e.clientY);
  const draggable = document.querySelector('.dragging');
  if (afterElement == null) {
    gameGrid.appendChild(draggable);
  } else {
    gameGrid.insertBefore(draggable, afterElement);
  }
});

// Helper function to find the right spot to drop the item
function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.game-list-item:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Synchronize DOM order to the Array and save it
function updateLibraryOrder() {
  const newOrderIds = Array.from(gameGrid.children).map(child => parseInt(child.dataset.id));
  const newLibrary = [];

  newOrderIds.forEach(id => {
    const foundGame = library.find(g => g.id === id);
    if (foundGame) newLibrary.push(foundGame);
  });

  library = newLibrary;
  api.saveGames(library);
}

async function removeGame(event, id) {
  event.stopPropagation();
  api.removeGame(id);
  init();
}

searchBar.oninput = (e) => {
  if (isEditMode) return;
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