import './style.css';
import { Game } from './core/Game';

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <div id="game-container">
    <canvas id="game-canvas"></canvas>
    
    <!-- Name Input Screen -->
    <div id="name-screen">
      <h1>DOOM PvP</h1>
      <div id="name-form">
        <label for="player-name">ENTER YOUR NAME:</label>
        <input type="text" id="player-name" maxlength="20" placeholder="Player" autocomplete="off" />
        <button id="join-button">JOIN GAME</button>
        <div id="server-status"></div>
      </div>
      <div id="controls-info">
        <h3>CONTROLS</h3>
        <ul>
          <li>WASD - Move</li>
          <li>Mouse - Look Around</li>
          <li>Left Click / Space - Shoot</li>
          <li>1-9 - Switch Weapons</li>
          <li>T - Open Chat</li>
          <li>ESC - Close Chat</li>
        </ul>
      </div>
    </div>
  </div>
`;

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas')!;
const nameScreen = document.querySelector<HTMLDivElement>('#name-screen')!;
const playerNameInput = document.querySelector<HTMLInputElement>('#player-name')!;
const joinButton = document.querySelector<HTMLButtonElement>('#join-button')!;
const serverStatus = document.querySelector<HTMLDivElement>('#server-status')!;

let game: Game | null = null;

playerNameInput.focus();

playerNameInput.addEventListener('keydown', (e) => {
  if (e.code === 'Enter') {
    e.preventDefault();
    joinButton.click();
  }
});

joinButton.addEventListener('click', async () => {
  const playerName = playerNameInput.value.trim() || 'Player';

  if (playerName.length < 2) {
    serverStatus.textContent = 'Name must be at least 2 characters';
    serverStatus.style.color = '#f00';
    return;
  }

  joinButton.disabled = true;
  serverStatus.textContent = 'Connecting to server...';
  serverStatus.style.color = '#ff0';

  try {
    game = new Game(canvas, playerName);
    await game.start();

    nameScreen.style.display = 'none';

  } catch (error: any) {
    console.error('Failed to start game:', error);
    serverStatus.textContent = error.message || 'Failed to connect to server';
    serverStatus.style.color = '#f00';
    joinButton.disabled = false;
  }
});

window.addEventListener('beforeunload', () => {
  if (game) {
    game.stop();
  }
});