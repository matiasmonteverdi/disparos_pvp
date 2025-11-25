import { Player } from '../entities/Player';
import { Renderer } from '../renderer/Renderer';
import { InputManager } from '../input/InputManager';
import { NetworkManager, type NetworkPlayer, type ChatMessage } from '../network/NetworkManager';
import { DM_MAP_1, getCollisionMap, getRandomSpawnPoint } from '../world/Map';
import { WEAPONS, PLAYER_CONFIG } from '../config/constants';
import * as THREE from 'three';

export class Game {
    private renderer: Renderer;
    private inputManager: InputManager;
    private networkManager: NetworkManager;
    private localPlayer: Player | null = null;
    private otherPlayerMeshes: Map<string, THREE.Mesh> = new Map();
    private lastTime: number = 0;
    private running: boolean = false;
    private collisionMap: boolean[][] = [];
    private playerName: string;

    constructor(canvas: HTMLCanvasElement, playerName: string) {
        this.playerName = playerName;
        this.renderer = new Renderer(canvas);
        this.inputManager = new InputManager(canvas);
        this.networkManager = new NetworkManager();

        // Setup network callbacks
        this.networkManager.onPlayerJoin((player) => this.onPlayerJoin(player));
        this.networkManager.onPlayerLeave((playerId) => this.onPlayerLeave(playerId));
        this.networkManager.onPlayerUpdate((player) => this.onPlayerUpdate(player));
    }

    public async start(): Promise<void> {
        console.log('Starting game...');

        // Connect to server
        try {
            await this.networkManager.connect();
            console.log('Connected to server');
        } catch (error) {
            console.error('Failed to connect to server:', error);
            throw error; // Re-throw to handle in main.ts
        }

        // Join game with player name
        this.networkManager.joinGame(this.playerName);

        // Load map
        this.renderer.loadMap(DM_MAP_1);
        this.collisionMap = getCollisionMap(DM_MAP_1);

        // Create local player
        const spawn = getRandomSpawnPoint(DM_MAP_1);
        this.localPlayer = new Player(
            this.networkManager.getPlayerId(),
            this.playerName,
            spawn.x,
            spawn.z
        );

        // Start game loop
        this.running = true;
        this.lastTime = performance.now();
        this.gameLoop();
    }

    private gameLoop = (): void => {
        if (!this.running) return;

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame(this.gameLoop);
    };

    private update(deltaTime: number): void {
        if (!this.localPlayer) return;

        // Get input
        const input = this.inputManager.getInput();
        const mouseDelta = this.inputManager.getMouseDelta();

        // Apply mouse look
        if (this.inputManager.isPointerLockedState()) {
            this.localPlayer.state.angle -= mouseDelta.x * 0.002;
        }

        // Handle weapon switching
        if (input.weaponSlot !== null) {
            const weaponKeys = Object.keys(WEAPONS);
            if (input.weaponSlot > 0 && input.weaponSlot <= weaponKeys.length) {
                const weaponId = Object.values(WEAPONS)[input.weaponSlot - 1].id;
                this.localPlayer.switchWeapon(weaponId);
            }
        }

        // Handle shooting
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
                // TODO: Handle hitscan/projectile logic
            }
        }

        // Update player
        this.localPlayer.setInput(input);
        this.localPlayer.update(deltaTime, this.collisionMap);

        // Send state to server
        this.networkManager.sendPlayerState(this.localPlayer.state);

        // Update other players
        this.updateOtherPlayers();
    }

    private render(): void {
        if (!this.localPlayer) return;

        // Update camera
        this.renderer.updateCamera(
            this.localPlayer.state.position.x,
            this.localPlayer.state.position.y,
            this.localPlayer.state.position.z,
            this.localPlayer.state.angle
        );

        // Render scene
        this.renderer.render();
    }

    private onPlayerJoin(player: NetworkPlayer): void {
        console.log('Player joined:', player.id, player.state.name);

        // Create mesh for other player
        const geometry = new THREE.CapsuleGeometry(
            PLAYER_CONFIG.RADIUS,
            PLAYER_CONFIG.HEIGHT,
            4,
            8
        );
        const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(
            player.state.position.x,
            player.state.position.y,
            player.state.position.z
        );

        this.renderer.getScene().add(mesh);
        this.otherPlayerMeshes.set(player.id, mesh);
    }

    private onPlayerLeave(playerId: string): void {
        console.log('Player left:', playerId);

        const mesh = this.otherPlayerMeshes.get(playerId);
        if (mesh) {
            this.renderer.getScene().remove(mesh);
            this.otherPlayerMeshes.delete(playerId);
        }
    }

    private onPlayerUpdate(player: NetworkPlayer): void {
        const mesh = this.otherPlayerMeshes.get(player.id);
        if (mesh) {
            mesh.position.set(
                player.state.position.x,
                player.state.position.y,
                player.state.position.z
            );
            mesh.rotation.y = player.state.angle;
        }
    }

    private updateOtherPlayers(): void {
        const otherPlayers = this.networkManager.getOtherPlayers();
        otherPlayers.forEach((player, id) => {
            const mesh = this.otherPlayerMeshes.get(id);
            if (mesh) {
                // Simple interpolation for smooth movement
                mesh.position.lerp(
                    new THREE.Vector3(
                        player.state.position.x,
                        player.state.position.y,
                        player.state.position.z
                    ),
                    0.3
                );
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
    }
}
