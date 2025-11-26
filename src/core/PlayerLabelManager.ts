import * as THREE from 'three';
import { PLAYER_CONFIG } from '../config/game';

export class PlayerLabelManager {
    private labels: Map<string, HTMLDivElement> = new Map();

    constructor() { }

    public createLabel(playerId: string, playerName: string, team?: 'red' | 'blue', health: number = 100): void {
        const nameLabel = document.createElement('div');
        nameLabel.className = 'player-name-label';

        if (team === 'red') {
            nameLabel.classList.add('red-team');
        } else if (team === 'blue') {
            nameLabel.classList.add('blue-team');
        }

        nameLabel.textContent = `${playerName} (${Math.ceil(health)})`;
        nameLabel.style.position = 'absolute';
        nameLabel.style.fontSize = '12px';
        nameLabel.style.fontFamily = "'Press Start 2P', monospace";
        nameLabel.style.textShadow = '2px 2px 0 #000';
        nameLabel.style.pointerEvents = 'none';
        nameLabel.style.whiteSpace = 'nowrap';

        document.body.appendChild(nameLabel);
        this.labels.set(playerId, nameLabel);
    }

    public updateLabel(playerId: string, name: string, health: number): void {
        const label = this.labels.get(playerId);
        if (label) {
            label.textContent = `${name} (${Math.ceil(health)})`;
            if (health < 50) {
                label.style.color = '#f00';
            } else {
                label.style.color = '#fff';
            }
        }
    }

    public removeLabel(playerId: string): void {
        const label = this.labels.get(playerId);
        if (label) {
            label.remove();
            this.labels.delete(playerId);
        }
    }

    public updatePositions(
        playerMeshes: Map<string, THREE.Mesh>,
        camera: THREE.Camera,
        canvas: HTMLCanvasElement
    ): void {
        this.labels.forEach((label, playerId) => {
            const mesh = playerMeshes.get(playerId);
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

    public clear(): void {
        this.labels.forEach(label => label.remove());
        this.labels.clear();
    }
}
