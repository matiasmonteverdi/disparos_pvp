import './style.css';
import { Game } from './core/Game';
import { WEAPONS } from './config/constants';

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <div id="game-container">
    <canvas id="game-canvas"></canvas>
    
    <!-- HUD -->
    <div id="hud">
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
    </div>
    
    <!-- Start Menu -->
    <div id="start-menu">
      <h1>DOOM PvP</h1>
      <p>Click to start</p>
      <div id="controls-info">
        <h3>Controls:</h3>
        <ul>
          <li>WASD - Move</li>
          <li>Mouse - Look</li>
          <li>Left Click / Space - Shoot</li>
          <li>1-7 - Switch Weapons</li>
        </ul>
      </div>
    </div>
  </div>
`;

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas')!;
const startMenu = document.querySelector<HTMLDivElement>('#start-menu')!;
const healthValue = document.querySelector<HTMLSpanElement>('#health-value')!;
const armorValue = document.querySelector<HTMLSpanElement>('#armor-value')!;
const ammoValue = document.querySelector<HTMLSpanElement>('#ammo-value')!;
const weaponName = document.querySelector<HTMLSpanElement>('#weapon-name')!;
const scoreValue = document.querySelector<HTMLSpanElement>('#score-value')!;

let game: Game | null = null;

// Start game on click
startMenu.addEventListener('click', async () => {
  startMenu.style.display = 'none';

  game = new Game(canvas);
  await game.start();

  // Update HUD loop
  setInterval(async () => { // Added async here
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
        const hud = document.getElementById('hud');
        if (player.state.health < 25 && hud) {
          hud.classList.add('low-health');
        } else if (hud) {
          hud.classList.remove('low-health');
        }
      }
    }
  }, 100);
});

// Handle page unload
window.addEventListener('beforeunload', () => {
  if (game) {
    game.stop();
  }
});
