import './style.css';
import { Game } from './core/Game';
import { WEAPONS } from './config/constants';
import { ChatManager, type ChatMessage } from './ui/ChatManager';

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <div id="game-container">
    <canvas id="game-canvas"></canvas>
    
    <!-- HUD -->
    <div id="hud" style="display: none;">
      <div id="hud-bottom">
        <div id="hud-left">
          <div id="health-display">
            <span class="hud-label">HEALTH</span>
            <span id="health-value" class="hud-value">100</span>
          </div>
          <div id="armor-display">
            <span class="hud-label">ARMOR</span>
            <span id="armor-value" class="hud-value">0</span>
          </div>
        </div>
        
        <div id="hud-center">
          <div id="weapon-display">
            <span id="weapon-name" class="hud-weapon">PISTOL</span>
          </div>
        </div>
        
        <div id="hud-right">
          <div id="ammo-display">
            <span class="hud-label">AMMO</span>
            <span id="ammo-value" class="hud-value">50</span>
          </div>
          <div id="score-display">
            <span class="hud-label">FRAGS</span>
            <span id="score-value" class="hud-value">0</span>
          </div>
        </div>
      </div>
      
      <!-- Crosshair -->
      <div id="crosshair"></div>
      
      <!-- Player Count -->
      <div id="player-count">
        <span id="player-count-value">1/8</span> Players
      </div>
    </div>
    
    <!-- Chat -->
    <div id="chat-container">
      <div id="chat-messages"></div>
      <input type="text" id="chat-input" placeholder="Press T to chat..." maxlength="200" />
      <div id="chat-hint">Press T to chat, ESC to close</div>
    </div>
    
    <!-- Name Input Screen -->
    <div id="name-screen">
      <h1>DOOM PvP</h1>
      <div id="name-form">
        <label for="player-name">Enter Your Name:</label>
        <input type="text" id="player-name" maxlength="20" placeholder="Player" autocomplete="off" />
        <button id="join-button">JOIN GAME</button>
        <div id="server-status"></div>
      </div>
      <div id="controls-info">
        <h3>Controls:</h3>
        <ul>
          <li>WASD - Move</li>
          <li>Mouse - Look</li>
          <li>Left Click / Space - Shoot</li>
          <li>1-7 - Switch Weapons</li>
          <li>T - Chat</li>
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
const hud = document.querySelector<HTMLDivElement>('#hud')!;
const healthValue = document.querySelector<HTMLSpanElement>('#health-value')!;
const armorValue = document.querySelector<HTMLSpanElement>('#armor-value')!;
const ammoValue = document.querySelector<HTMLSpanElement>('#ammo-value')!;
const weaponName = document.querySelector<HTMLSpanElement>('#weapon-name')!;
const scoreValue = document.querySelector<HTMLSpanElement>('#score-value')!;
const playerCountValue = document.querySelector<HTMLSpanElement>('#player-count-value')!;

let game: Game | null = null;
let chatManager: ChatManager | null = null;

// Focus on name input
playerNameInput.focus();

// Handle Enter key on name input
playerNameInput.addEventListener('keydown', (e) => {
  if (e.code === 'Enter') {
    e.preventDefault();
    joinButton.click();
  }
});

// Start game on join button click
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

    // Hide name screen, show HUD
    nameScreen.style.display = 'none';
    hud.style.display = 'block';

    // Initialize chat
    chatManager = new ChatManager();
    chatManager.onSend((message) => {
      game?.sendChatMessage(message);
    });

    // Setup chat message handler
    game.onChatMessage((message: ChatMessage) => {
      chatManager?.addMessage(message);
    });

    // Setup player count handler
    game.onPlayerCount((count: number) => {
      playerCountValue.textContent = `${count}/8`;
    });

    // Update HUD loop
    setInterval(() => {
      if (game) {
        const player = game.getLocalPlayer();
        if (player) {
          healthValue.textContent = Math.floor(player.state.health).toString();
          armorValue.textContent = Math.floor(player.state.armor).toString();
          weaponName.textContent = player.state.currentWeapon.toUpperCase();
          scoreValue.textContent = player.state.kills.toString();

          // Update ammo display
          const currentWeapon = player.state.currentWeapon;
          const weaponData = Object.values(WEAPONS).find(w => w.id === currentWeapon);
          if (weaponData && weaponData.ammoType) {
            ammoValue.textContent = (player.state.ammo[weaponData.ammoType] || 0).toString();
          } else {
            ammoValue.textContent = '∞';
          }

          // Low health warning
          if (player.state.health < 25) {
            hud.classList.add('low-health');
          } else {
            hud.classList.remove('low-health');
          }
        }
      }
    }, 100);

  } catch (error: any) {
    console.error('Failed to start game:', error);
    serverStatus.textContent = error.message || 'Failed to connect to server';
    serverStatus.style.color = '#f00';
    joinButton.disabled = false;
  }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
  if (game) {
    game.stop();
  }
});
