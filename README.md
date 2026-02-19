# Nebula Game Launcher

A lightweight, elegant desktop application for managing and launching your local game library. Built with Electron and modern web technologies.

## Description

Nebula is a minimalist game launcher that helps you organize and launch your favorite games from a single, beautiful interface. Add games to your library, search through your collection, and launch them with a single click. Each game can have custom cover art for a polished library experience.

## Features

- 🎮 **Game Management** - Add, remove, and organize your game library
- 🔍 **Search Functionality** - Quickly find games in your collection
- 🖼️ **Custom Cover Art** - Display cover images for each game
- 🎨 **Modern UI** - Clean, minimalist dark theme interface
- ⚡ **Fast Launch** - Launch games directly from the app
- 🪟 **Frameless Window** - Sleek custom window controls

## Installation

### Requirements

- Node.js (v14 or higher)
- npm or yarn

### Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd GameLauncher
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the application**
   ```bash
   npm start
   ```

## Build for Distribution

To create a standalone installer for Windows:

```bash
npm run dist
```

The installer will be created in the `dist/` directory.

## Usage

1. **Launch the app** - Run `npm start`
2. **Add a Game** - Click the **+** button to select a game executable and optional cover art
3. **Search** - Use the search bar to filter games by name
4. **Launch** - Click any game card to launch it
5. **Remove** - Hover over a game and click the **×** button to remove it from your library

## Project Structure

```
.
├── main.js           # Electron main process
├── renderer.js       # Frontend logic
├── preload.js        # Secure IPC bridge
├── index.html        # HTML structure
├── style.css         # Styling
├── package.json      # Project metadata and scripts
└── assets/           # Logo and icons
```

## Technologies

- **Electron** - Cross-platform desktop application framework
- **Node.js** - Backend runtime
- **HTML/CSS/JavaScript** - Frontend
- **IPC** - Inter-process communication for secure API calls

## License

MIT

## Author

Shifu


