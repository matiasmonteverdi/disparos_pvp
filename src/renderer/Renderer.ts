import * as THREE from 'three';
import type { MapData } from '../world/Map';
import { WORLD_CONFIG, COLORS } from '../config/game';

export class Renderer {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private mapMesh: THREE.Group;

    constructor(canvas: HTMLCanvasElement) {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(COLORS.CEILING_DARK);
        this.scene.fog = new THREE.Fog(COLORS.CEILING_DARK, 500, 1500);

        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            90,
            window.innerWidth / window.innerHeight,
            0.1,
            2000
        );

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: false, // Retro look
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(1); // Pixelated retro look

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);

        this.mapMesh = new THREE.Group();
        this.scene.add(this.mapMesh);

        // Handle window resize
        window.addEventListener('resize', () => this.onResize());
    }

    public loadMap(map: MapData): void {
        // Clear existing map
        this.mapMesh.clear();

        const cellSize = WORLD_CONFIG.CELL_SIZE;
        const wallHeight = WORLD_CONFIG.WALL_HEIGHT;

        // Create floor
        const floorGeometry = new THREE.PlaneGeometry(
            map.width * cellSize,
            map.height * cellSize
        );
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: COLORS.FLOOR_DARK,
            roughness: 0.8,
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(
            (map.width * cellSize) / 2,
            0,
            (map.height * cellSize) / 2
        );
        this.mapMesh.add(floor);

        // Create walls
        const wallMaterials = [
            new THREE.MeshStandardMaterial({ color: COLORS.WALL_GRAY }),
            new THREE.MeshStandardMaterial({ color: COLORS.WALL_BROWN }),
            new THREE.MeshStandardMaterial({ color: COLORS.WALL_RED }),
        ];

        for (let z = 0; z < map.height; z++) {
            for (let x = 0; x < map.width; x++) {
                const cell = map.cells[z][x];
                if (cell.type === 'wall') {
                    const wallGeometry = new THREE.BoxGeometry(
                        cellSize,
                        wallHeight,
                        cellSize
                    );
                    const material = wallMaterials[cell.wallTexture || 0];
                    const wall = new THREE.Mesh(wallGeometry, material);
                    wall.position.set(
                        x * cellSize + cellSize / 2,
                        wallHeight / 2,
                        z * cellSize + cellSize / 2
                    );
                    this.mapMesh.add(wall);
                }
            }
        }
    }

    public updateCamera(x: number, y: number, z: number, angle: number): void {
        this.camera.position.set(x, y, z);
        this.camera.rotation.y = angle;
    }

    public getCamera(): THREE.PerspectiveCamera {
        return this.camera;
    }

    public getCanvas(): HTMLCanvasElement {
        return this.renderer.domElement;
    }

    public dispose(): void {
        this.renderer.dispose();
        window.removeEventListener('resize', () => this.onResize());
    }

    public render(): void {
        this.renderer.render(this.scene, this.camera);
    }

    public getScene(): THREE.Scene {
        return this.scene;
    }

    public showMuzzleFlash(): void {
        // Create a point light at the camera position
        const flash = new THREE.PointLight(0xffffaa, 2, 100);
        flash.position.copy(this.camera.position);
        // Move it slightly forward
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        flash.position.add(direction.multiplyScalar(1));

        this.scene.add(flash);

        // Remove after 50ms
        setTimeout(() => {
            this.scene.remove(flash);
        }, 50);
    }

    private onResize(): void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}
