import type { PlayerInput } from '../entities/Player';

export class InputManager {
    private keys: Set<string> = new Set();
    private mouseMovement: { x: number; y: number } = { x: 0, y: 0 };
    private isPointerLocked: boolean = false;
    private canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // Keyboard events
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));

        // Mouse events
        this.canvas.addEventListener('click', () => this.requestPointerLock());
        document.addEventListener('pointerlockchange', () => this.onPointerLockChange());
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('mousedown', (e) => this.onMouseDown(e));
        document.addEventListener('mouseup', (e) => this.onMouseUp(e));
    }

    private onKeyDown(e: KeyboardEvent): void {
        this.keys.add(e.code);

        // Prevent default for game keys
        if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'].includes(e.code)) {
            e.preventDefault();
        }
    }

    private onKeyUp(e: KeyboardEvent): void {
        this.keys.delete(e.code);
    }

    private onMouseMove(e: MouseEvent): void {
        if (this.isPointerLocked) {
            this.mouseMovement.x += e.movementX;
            this.mouseMovement.y += e.movementY;
        }
    }

    private onMouseDown(e: MouseEvent): void {
        if (e.button === 0) { // Left click
            this.keys.add('MouseLeft');
        }
    }

    private onMouseUp(e: MouseEvent): void {
        if (e.button === 0) {
            this.keys.delete('MouseLeft');
        }
    }

    private requestPointerLock(): void {
        this.canvas.requestPointerLock();
    }

    private onPointerLockChange(): void {
        this.isPointerLocked = document.pointerLockElement === this.canvas;
    }

    public getInput(): PlayerInput {
        const input: PlayerInput = {
            forward: this.keys.has('KeyW'),
            backward: this.keys.has('KeyS'),
            left: this.keys.has('KeyA'),
            right: this.keys.has('KeyD'),
            turnLeft: this.keys.has('ArrowLeft'),
            turnRight: this.keys.has('ArrowRight'),
            shoot: this.keys.has('MouseLeft') || this.keys.has('Space'),
            weaponSlot: this.getWeaponSlot(),
        };

        return input;
    }

    public getMouseDelta(): { x: number; y: number } {
        const delta = { ...this.mouseMovement };
        this.mouseMovement = { x: 0, y: 0 };
        return delta;
    }

    private getWeaponSlot(): number | null {
        for (let i = 1; i <= 7; i++) {
            if (this.keys.has(`Digit${i}`)) {
                this.keys.delete(`Digit${i}`); // Consume the key press
                return i;
            }
        }
        return null;
    }

    public isPointerLockedState(): boolean {
        return this.isPointerLocked;
    }

    public dispose(): void {
        window.removeEventListener('keydown', (e) => this.onKeyDown(e));
        window.removeEventListener('keyup', (e) => this.onKeyUp(e));
        document.removeEventListener('mousemove', (e) => this.onMouseMove(e));
        document.removeEventListener('mousedown', (e) => this.onMouseDown(e));
        document.removeEventListener('mouseup', (e) => this.onMouseUp(e));
    }
}
