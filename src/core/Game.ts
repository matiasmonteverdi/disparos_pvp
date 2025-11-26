import { Player } from '../entities/Player';
import { Renderer } from '../renderer/Renderer';
import { InputManager } from '../input/InputManager';
import { NetworkManager, type NetworkPlayer, type ChatMessage, type LeaderboardEntry, type ItemSpawn } from '../network/NetworkManager';
import { DM_MAP_1, getCollisionMap, getRandomSpawnPoint } from '../world/Map';
import { WEAPONS, PLAYER_CONFIG } from '../config/constants';
import * as THREE from 'three';
import { UIManager } from '../ui/UIManager';

export class Game {
    private uiManager: UIManager;
    private renderer: Renderer;
    private inputManager: InputManager;
    private networkManager: NetworkManager;
    private localPlayer: Player | null = null;
    private otherPlayerMeshes: Map<string, THREE.Mesh> = new Map();
    private otherPlayerNameLabels: Map<string, HTMLDivElement> = new Map();
    private items: Map<string, THREE.Mesh> = new Map();
    private lastTime: number = 0;
    private running: boolean = false;
    private collisionMap: boolean[][] = [];
    private playerName: string;
    private projectiles: Array<{
        mesh: THREE.Mesh;
        velocity: THREE.Vector3;
        damage: number;
        playerId: string;
        weaponId: string;
        startTime: number;
    }> = [];

    private lastNetworkUpdate: number = 0;
    private readonly NETWORK_UPDATE_RATE: number = 30; // ms (approx 33Hz)

    constructor(canvas: HTMLCanvasElement, playerName: string) {
        this.playerName = playerName;
        this.renderer = new Renderer(canvas);
        this.inputManager = new InputManager(canvas);
        this.networkManager = new NetworkManager();
        this.uiManager = new UIManager();

        // Setup network callbacks
        this.networkManager.onPlayerJoin((player) => this.onPlayerJoin(player));
        this.networkManager.onPlayerLeave((playerId) => this.onPlayerLeave(playerId));
        this.networkManager.onPlayerUpdate((player) => this.onPlayerUpdate(player));
        this.networkManager.onLocalPlayerUpdate((state) => {
            if (this.localPlayer) {
                this.localPlayer.state.health = state.health;
                this.localPlayer.state.armor = state.armor;
                this.localPlayer.state.kills = state.kills;
                this.localPlayer.state.deaths = state.deaths;
                this.localPlayer.state.ammo = state.ammo;
                this.localPlayer.state.team = state.team;
                this.localPlayer.state.ping = state.ping;

                if (state.position) {
                    const serverPos = new THREE.Vector3(state.position.x, state.position.y, state.position.z);
                    if (serverPos.distanceTo(this.localPlayer.state.position) > 100) {
                        console.warn('Position corrected by server');
                        this.localPlayer.state.position.copy(serverPos);
                    }
                }
            }
        });

        this.networkManager.onPingUpdate((ping) => {
            this.uiManager.updatePing(ping);
        });

        this.networkManager.onLeaderboard((leaderboard: LeaderboardEntry[]) => {
            this.uiManager.updateLeaderboard(leaderboard);
        });

        // Handle projectile sync from other players
        this.networkManager.onShoot((data) => {
            this.createProjectileEffect(data);
        });

        this.networkManager.onReconnecting((attempt) => {
            this.uiManager.showReconnecting(attempt);
        });

        this.networkManager.onReconnected(() => {
            this.uiManager.hideReconnecting();
        });

        // Chat integration
        this.networkManager.onChatMessage((message: ChatMessage) => {
            this.uiManager.addChatMessage(message);
        });

        this.uiManager.onMessageSend((message: string) => {
            this.networkManager.sendChatMessage(message);
        });

        // Item synchronization
        this.networkManager.onItemSpawn((item) => {
            this.createItem(item);
        });

        this.networkManager.onItemCollected((itemId) => {
            this.removeItem(itemId);
        });
    }

    public async start(): Promise<void> {
        console.log('Starting game...');

        try {
            await this.networkManager.connect();
        } catch (error) {
            console.error('Failed to connect to server:', error);
            throw error;
        }

        this.networkManager.joinGame(this.playerName);
        this.uiManager.setCurrentPlayerId(this.networkManager.getPlayerId());

        this.renderer.loadMap(DM_MAP_1);
        this.collisionMap = getCollisionMap(DM_MAP_1);

        const spawn = getRandomSpawnPoint(DM_MAP_1);
        this.localPlayer = new Player(
            this.networkManager.getPlayerId(),
            this.playerName,
            spawn.x,
            spawn.z
        );

        this.running = true;
        this.lastTime = performance.now();
        this.gameLoop();
    }

    private gameLoop = (): void => {
        if (!this.running) return;

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame(this.gameLoop);
    };

    private update(deltaTime: number): void {
        if (!this.localPlayer) return;

        // Block input if chat is open
        if (this.uiManager.isChatOpen()) {
            return;
        }

        const input = this.inputManager.getInput();
        const mouseDelta = this.inputManager.getMouseDelta();

        if (this.inputManager.isPointerLockedState()) {
            this.localPlayer.state.angle -= mouseDelta.x * 0.002;
        }

        if (input.weaponSlot !== null) {
            const weaponKeys = Object.keys(WEAPONS);
            if (input.weaponSlot > 0 && input.weaponSlot <= weaponKeys.length) {
                const weaponId = Object.values(WEAPONS)[input.weaponSlot - 1].id;
                this.localPlayer.switchWeapon(weaponId);
            }
        }

        if (input.shoot) {
            const weapon = Object.values(WEAPONS).find(w => w.id === this.localPlayer!.state.currentWeapon);
            if (weapon && this.localPlayer.canShoot(weapon)) {
                this.localPlayer.shoot(weapon);
                this.networkManager.sendShoot(
                    weapon.id,
                    this.localPlayer.state.angle,
                    {
                        x: this.localPlayer.state.position.x,
                        y: this.localPlayer.state.position.y,
                        z: this.localPlayer.state.position.z,
                    }
                );

                if (weapon.type === 'hitscan' || weapon.type === 'melee') {
                    this.checkHitscan(weapon);
                    this.renderer.showMuzzleFlash();
                } else if (weapon.type === 'projectile') {
                    this.createProjectile(weapon);
                }
            }
        }

        this.localPlayer.setInput(input);
        this.localPlayer.update(deltaTime, this.collisionMap);

        // Throttle network updates
        const now = Date.now();
        if (now - this.lastNetworkUpdate > this.NETWORK_UPDATE_RATE) {
            this.networkManager.sendPlayerState(this.localPlayer.state);
            this.lastNetworkUpdate = now;
        }

        this.updateOtherPlayers();
        this.updateProjectiles(deltaTime);
        this.updateNameLabels();
    }

    private createProjectile(weapon: any): void {
        if (!this.localPlayer) return;

        const direction = new THREE.Vector3(
            -Math.sin(this.localPlayer.state.angle),
            0,
            -Math.cos(this.localPlayer.state.angle)
        );

        let color = 0xffaa00;
        let size = 0.3;

        if (weapon.id === 'plasma') {
            color = 0x00ff00;
            size = 0.4;
        } else if (weapon.id === 'bfg') {
            color = 0x00ff00;
            size = 0.8;
        } else if (weapon.id === 'rocket') {
            color = 0xff4400;
            size = 0.5;
        }

        const geometry = new THREE.SphereGeometry(size, 8, 8);
        const material = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 1
        });
        const mesh = new THREE.Mesh(geometry, material);

        mesh.position.copy(this.localPlayer.state.position);
        mesh.position.y = this.localPlayer.state.position.y;

        const light = new THREE.PointLight(color, 2, 50);
        mesh.add(light);

        this.renderer.getScene().add(mesh);

        this.projectiles.push({
            mesh: mesh,
            velocity: direction.multiplyScalar(weapon.projectileSpeed),
            damage: weapon.damage,
            playerId: this.localPlayer.state.id,
            weaponId: weapon.id,
            startTime: Date.now()
        });
    }

    private createProjectileEffect(data: any): void {
        const weapon = Object.values(WEAPONS).find(w => w.id === data.weaponId);
        if (!weapon || weapon.type !== 'projectile') return;

        const direction = new THREE.Vector3(
            -Math.sin(data.angle),
            0,
            -Math.cos(data.angle)
        );

        let color = 0xffaa00;
        let size = 0.3;

        if (weapon.id === 'plasma') {
            color = 0x00ff00;
            size = 0.4;
        } else if (weapon.id === 'bfg') {
            color = 0x00ff00;
            size = 0.8;
        } else if (weapon.id === 'rocket') {
            color = 0xff4400;
            size = 0.5;
        }

        const geometry = new THREE.SphereGeometry(size, 8, 8);
        const material = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 1
        });
        const mesh = new THREE.Mesh(geometry, material);

        mesh.position.set(data.position.x, data.position.y, data.position.z);

        const light = new THREE.PointLight(color, 2, 50);
        mesh.add(light);

        this.renderer.getScene().add(mesh);

        this.projectiles.push({
            mesh: mesh,
            velocity: direction.multiplyScalar(weapon.projectileSpeed),
            damage: weapon.damage,
            playerId: data.playerId,
            weaponId: weapon.id,
            startTime: Date.now()
        });
    }

    private updateProjectiles(deltaTime: number): void {
        const now = Date.now();

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];

            // Remove old projectiles (5 seconds max lifetime)
            if (now - proj.startTime > 5000) {
                this.renderer.getScene().remove(proj.mesh);
                this.projectiles.splice(i, 1);
                continue;
            }

            // Update position
            proj.mesh.position.add(proj.velocity.clone().multiplyScalar(deltaTime));

            // Check collision with walls
            const cellSize = 64;
            const gridX = Math.floor(proj.mesh.position.x / cellSize);
            const gridZ = Math.floor(proj.mesh.position.z / cellSize);

            if (
                gridZ < 0 || gridZ >= this.collisionMap.length ||
                gridX < 0 || gridX >= this.collisionMap[0].length ||
                this.collisionMap[gridZ][gridX]
            ) {
                this.createExplosion(proj.mesh.position, proj.weaponId);
                if (proj.playerId === this.localPlayer?.state.id) {
                    this.applySplashDamage(proj.mesh.position, proj.weaponId);
                }
                this.renderer.getScene().remove(proj.mesh);
                this.projectiles.splice(i, 1);
                continue;
            }

            // Check collision with players
            if (proj.playerId === this.localPlayer?.state.id) {
                const otherPlayers = this.networkManager.getOtherPlayers();
                for (const [targetId, player] of otherPlayers) {
                    const distance = proj.mesh.position.distanceTo(player.state.position);
                    if (distance < PLAYER_CONFIG.RADIUS * 2) {
                        this.createExplosion(proj.mesh.position, proj.weaponId);
                        this.applySplashDamage(proj.mesh.position, proj.weaponId);
                        this.renderer.getScene().remove(proj.mesh);
                        this.projectiles.splice(i, 1);
                        break;
                    }
                }
            }
        }
    }

    private applySplashDamage(position: THREE.Vector3, weaponId: string): void {
        const weapon = Object.values(WEAPONS).find(w => w.id === weaponId);
        if (!weapon || !weapon.splashRadius) return;

        const otherPlayers = this.networkManager.getOtherPlayers();
        for (const [targetId, player] of otherPlayers) {
            const distance = position.distanceTo(player.state.position);
            if (distance < weapon.splashRadius) {
                const damageRatio = 1 - (distance / weapon.splashRadius);
                const damage = weapon.damage * damageRatio;
                if (damage > 0) {
                    this.networkManager.sendHit(targetId, damage);
                    this.createBloodEffect(player.state.position);
                }
            }
        }
    }

    private createExplosion(position: THREE.Vector3, weaponId: string): void {
        let color = 0xff4400;
        let size = 2;

        if (weaponId === 'bfg') {
            color = 0x00ff00;
            size = 5;
        } else if (weaponId === 'plasma') {
            color = 0x00ff00;
            size = 1.5;
        }

        const geometry = new THREE.SphereGeometry(size, 16, 16);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8
        });
        const explosion = new THREE.Mesh(geometry, material);
        explosion.position.copy(position);

        const light = new THREE.PointLight(color, 5, 100);
        light.position.copy(position);

        this.renderer.getScene().add(explosion);
        this.renderer.getScene().add(light);

        let scale = 1;
        const interval = setInterval(() => {
            scale += 0.3;
            explosion.scale.set(scale, scale, scale);
            material.opacity -= 0.1;
            light.intensity -= 0.5;

            if (material.opacity <= 0) {
                this.renderer.getScene().remove(explosion);
                this.renderer.getScene().remove(light);
                clearInterval(interval);
            }
        }, 50);
    }

    private checkHitscan(weapon: any): void {
        if (!this.localPlayer) return;

        const raycaster = new THREE.Raycaster();
        const direction = new THREE.Vector3(
            -Math.sin(this.localPlayer.state.angle),
            0,
            -Math.cos(this.localPlayer.state.angle)
        );

        raycaster.set(this.localPlayer.state.position, direction);
        raycaster.far = weapon.range;

        const otherPlayers = this.networkManager.getOtherPlayers();
        const meshes: THREE.Mesh[] = [];
        otherPlayers.forEach((player, id) => {
            const mesh = this.otherPlayerMeshes.get(id);
            if (mesh) meshes.push(mesh);
        });

        const intersects = raycaster.intersectObjects(meshes);

        if (intersects.length > 0) {
            const hitMesh = intersects[0].object as THREE.Mesh;
            for (const [targetId, player] of otherPlayers) {
                if (this.otherPlayerMeshes.get(targetId) === hitMesh) {
                    const damagePerShot = weapon.damage / (weapon.pellets || 1);
                    this.networkManager.sendHit(targetId, damagePerShot);
                    this.createBloodEffect(intersects[0].point);
                }
            }

            // Create bullet tracer for visual feedback
            if (weapon.type === 'hitscan') {
                const endPoint = intersects.length > 0 ?
                    intersects[0].point :
                    this.localPlayer.state.position.clone().add(direction.multiplyScalar(weapon.range));

                this.createBulletTracer(
                    this.localPlayer.state.position.clone(),
                    endPoint
                );
            }
        }
    }

    private createBulletTracer(start: THREE.Vector3, end: THREE.Vector3): void {
        // Validate vectors to prevent NaN errors
        if (!start || !end ||
            isNaN(start.x) || isNaN(start.y) || isNaN(start.z) ||
            isNaN(end.x) || isNaN(end.y) || isNaN(end.z)) {
            console.warn('Invalid vector values in createBulletTracer, skipping');
            return;
        }

        const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
        const material = new THREE.LineBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.6
        });
        const line = new THREE.Line(geometry, material);

        this.renderer.getScene().add(line);

        setTimeout(() => {
            this.renderer.getScene().remove(line);
        }, 50);
    }

    private createBloodEffect(position: THREE.Vector3): void {
        const geometry = new THREE.SphereGeometry(0.3, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.8
        });
        const blood = new THREE.Mesh(geometry, material);
        blood.position.copy(position);

        this.renderer.getScene().add(blood);

        let scale = 1;
        const interval = setInterval(() => {
            scale += 0.2;
            blood.scale.set(scale, scale, scale);
            material.opacity -= 0.1;

            if (material.opacity <= 0) {
                this.renderer.getScene().remove(blood);
                clearInterval(interval);
            }
        }, 50);
    }

    private render(): void {
        if (!this.localPlayer) return;

        this.renderer.updateCamera(
            this.localPlayer.state.position.x,
            this.localPlayer.state.position.y,
            this.localPlayer.state.position.z,
            this.localPlayer.state.angle
        );

        this.renderer.render();
    }

    private onPlayerJoin(player: NetworkPlayer): void {
        console.log('Player joined:', player.id, player.state.name);

        const geometry = new THREE.CapsuleGeometry(
            PLAYER_CONFIG.RADIUS,
            PLAYER_CONFIG.HEIGHT,
            4,
            8
        );
        const material = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0x440000,
            emissiveIntensity: 0.3
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(
            player.state.position.x,
            player.state.position.y,
            player.state.position.z
        );

        this.renderer.getScene().add(mesh);
        this.otherPlayerMeshes.set(player.id, mesh);

        // Create name label
        const nameLabel = document.createElement('div');
        nameLabel.className = 'player-name-label';

        if (player.state.team === 'red') {
            nameLabel.classList.add('red-team');
        } else if (player.state.team === 'blue') {
            nameLabel.classList.add('blue-team');
        }

        nameLabel.textContent = `${player.state.name} (${Math.ceil(player.state.health)})`;
        nameLabel.style.position = 'absolute';
        nameLabel.style.fontSize = '12px';
        nameLabel.style.fontFamily = "'Press Start 2P', monospace";
        nameLabel.style.textShadow = '2px 2px 0 #000';
        nameLabel.style.pointerEvents = 'none';
        nameLabel.style.whiteSpace = 'nowrap';
        document.body.appendChild(nameLabel);
        this.otherPlayerNameLabels.set(player.id, nameLabel);
    }

    private onPlayerLeave(playerId: string): void {
        console.log('Player left:', playerId);

        const mesh = this.otherPlayerMeshes.get(playerId);
        if (mesh) {
            this.renderer.getScene().remove(mesh);
            this.otherPlayerMeshes.delete(playerId);
        }

        const label = this.otherPlayerNameLabels.get(playerId);
        if (label) {
            label.remove();
            this.otherPlayerNameLabels.delete(playerId);
        }
    }

    private onPlayerUpdate(player: NetworkPlayer): void {
        // Update health display
        const label = this.otherPlayerNameLabels.get(player.id);
        if (label) {
            label.textContent = `${player.state.name} (${Math.ceil(player.state.health)})`;
            if (player.state.health < 50) {
                label.style.color = '#f00';
            } else {
                label.style.color = '#fff';
            }
        }
    }

    private updateOtherPlayers(): void {
        const otherPlayers = this.networkManager.getOtherPlayers();
        const now = Date.now();
        const INTERPOLATION_PERIOD = 100; // ms - how long to interpolate between states

        otherPlayers.forEach((player, id) => {
            const mesh = this.otherPlayerMeshes.get(id);
            if (!mesh) return;

            // If we have interpolation data
            if (player.previousState && player.targetState && player.lastUpdateTime) {
                const timeSinceUpdate = now - player.lastUpdateTime;

                if (timeSinceUpdate < INTERPOLATION_PERIOD) {
                    // Interpolate between previous and target state
                    const t = timeSinceUpdate / INTERPOLATION_PERIOD;
                    // Use hermite interpolation for smoother movement
                    const smoothT = t * t * (3 - 2 * t);

                    // Interpolate position
                    const prevPos = player.previousState.position;
                    const targetPos = player.targetState.position;
                    mesh.position.x = prevPos.x + (targetPos.x - prevPos.x) * smoothT;
                    mesh.position.y = prevPos.y + (targetPos.y - prevPos.y) * smoothT;
                    mesh.position.z = prevPos.z + (targetPos.z - prevPos.z) * smoothT;

                    // Interpolate rotation (handle angle wrapping)
                    let prevAngle = player.previousState.angle;
                    let targetAngle = player.targetState.angle;
                    let angleDiff = targetAngle - prevAngle;

                    // Normalize angle difference to [-PI, PI]
                    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

                    mesh.rotation.y = prevAngle + angleDiff * smoothT;

                    // Update current state for rendering
                    player.state.position.x = mesh.position.x;
                    player.state.position.y = mesh.position.y;
                    player.state.position.z = mesh.position.z;
                    player.state.angle = mesh.rotation.y;
                } else {
                    // Interpolation period ended, apply dead reckoning
                    // Predict movement based on last known velocity
                    const extraTime = (timeSinceUpdate - INTERPOLATION_PERIOD) / 1000;

                    if (player.targetState) {
                        // Calculate velocity from last two states
                        if (player.previousState) {
                            const dx = player.targetState.position.x - player.previousState.position.x;
                            const dz = player.targetState.position.z - player.previousState.position.z;
                            const dt = INTERPOLATION_PERIOD / 1000;

                            // Apply predicted movement (with damping to avoid going too far)
                            const damping = Math.exp(-extraTime * 2); // Exponential decay
                            mesh.position.x = player.targetState.position.x + (dx / dt) * extraTime * damping;
                            mesh.position.z = player.targetState.position.z + (dz / dt) * extraTime * damping;
                            mesh.position.y = player.targetState.position.y;
                            mesh.rotation.y = player.targetState.angle;
                        } else {
                            // No previous state, just use target
                            mesh.position.set(
                                player.targetState.position.x,
                                player.targetState.position.y,
                                player.targetState.position.z
                            );
                            mesh.rotation.y = player.targetState.angle;
                        }

                        // Update current state
                        player.state.position.x = mesh.position.x;
                        player.state.position.y = mesh.position.y;
                        player.state.position.z = mesh.position.z;
                        player.state.angle = mesh.rotation.y;
                    }
                }
            } else {
                // No interpolation data, just use current state
                mesh.position.set(
                    player.state.position.x,
                    player.state.position.y,
                    player.state.position.z
                );
                mesh.rotation.y = player.state.angle;
            }
        });
    }

    private updateNameLabels(): void {
        if (!this.localPlayer) return;

        const camera = this.renderer.getCamera();
        const canvas = this.renderer.getCanvas();

        this.otherPlayerNameLabels.forEach((label, playerId) => {
            const mesh = this.otherPlayerMeshes.get(playerId);
            if (!mesh) return;

            const position = mesh.position.clone();
            position.y += PLAYER_CONFIG.HEIGHT + 20;

            position.project(camera);

            const x = (position.x * 0.5 + 0.5) * canvas.clientWidth;
            const y = (position.y * -0.5 + 0.5) * canvas.clientHeight;

            if (position.z < 1) {
                label.style.display = 'block';
                label.style.left = `${x}px`;
                label.style.top = `${y}px`;
                label.style.transform = 'translate(-50%, -50%)';
            } else {
                label.style.display = 'none';
            }
        });
    }

    public sendChatMessage(message: string): void {
        this.networkManager.sendChatMessage(message);
    }

    public onChatMessage(callback: (message: ChatMessage) => void): void {
        this.networkManager.onChatMessage(callback);
    }

    public onPlayerCount(callback: (count: number) => void): void {
        this.networkManager.onPlayerCount(callback);
    }

    public getLocalPlayer(): Player | null {
        return this.localPlayer;
    }

    public stop(): void {
        this.running = false;
        this.networkManager.disconnect();
        this.renderer.dispose();
        this.inputManager.dispose();

        // Clean up name labels
        this.otherPlayerNameLabels.forEach(label => label.remove());
        this.otherPlayerNameLabels.clear();
    }

    private createItem(item: ItemSpawn): void {
        if (this.items.has(item.id)) return;

        let color = 0xffffff;
        let size = 0.5;

        switch (item.type) {
            case 'health':
                color = 0x00ff00; // Green
                break;
            case 'armor':
                color = 0x0000ff; // Blue
                break;
            case 'ammo':
                color = 0xffff00; // Yellow
                size = 0.3;
                break;
            case 'weapon':
                color = 0xff0000; // Red
                size = 0.4;
                break;
        }

        const geometry = new THREE.BoxGeometry(size, size, size);
        const material = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.5,
            roughness: 0.4,
            metalness: 0.6
        });
        const mesh = new THREE.Mesh(geometry, material);

        mesh.position.set(item.position.x, item.position.y, item.position.z);

        this.renderer.getScene().add(mesh);
        this.items.set(item.id, mesh);
    }

    private removeItem(itemId: string): void {
        const mesh = this.items.get(itemId);
        if (mesh) {
            this.renderer.getScene().remove(mesh);
            this.items.delete(itemId);
        }
    }
}