import * as THREE from 'three';
import { PLAYER_CONFIG } from '../config/game';
import type { PlayerInput, PlayerState, PlayerPowerups } from '../../shared/types/player.types';
import type { WeaponConfig } from '../../shared/types/weapon.types';

export type { PlayerInput, PlayerState, PlayerPowerups };

export class Player {
    public state: PlayerState;
    private input: PlayerInput;

    constructor(id: string, name: string, spawnX: number, spawnZ: number) {
        this.state = {
            id,
            name,
            position: new THREE.Vector3(spawnX, PLAYER_CONFIG.HEIGHT, spawnZ),
            angle: 0,
            velocity: new THREE.Vector3(0, 0, 0),
            health: PLAYER_CONFIG.SPAWN_HEALTH,
            armor: PLAYER_CONFIG.SPAWN_ARMOR,
            currentWeapon: 'pistol',
            ammo: {
                bullets: 50,
                shells: 0,
                rockets: 0,
                cells: 0,
            },
            weapons: ['fists', 'pistol'],
            powerups: {},
            lastShootTime: 0,
            kills: 0,
            deaths: 0,
        };

        this.input = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            turnLeft: false,
            turnRight: false,
            shoot: false,
            weaponSlot: null,
        };
    }

    public setInput(input: Partial<PlayerInput>): void {
        this.input = { ...this.input, ...input };
    }

    public update(deltaTime: number, collisionMap: boolean[][]): void {
        // Update powerups
        const now = Date.now();
        Object.keys(this.state.powerups).forEach((key) => {
            const expiry = this.state.powerups[key as keyof typeof this.state.powerups];
            if (expiry && expiry < now) {
                delete this.state.powerups[key as keyof typeof this.state.powerups];
            }
        });

        // Handle rotation
        if (this.input.turnLeft) {
            this.state.angle += PLAYER_CONFIG.TURN_SPEED * deltaTime;
        }
        if (this.input.turnRight) {
            this.state.angle -= PLAYER_CONFIG.TURN_SPEED * deltaTime;
        }

        // Calculate movement direction (FIXED - controls were inverted)
        const moveDir = new THREE.Vector3(0, 0, 0);

        if (this.input.forward) {
            moveDir.x -= Math.sin(this.state.angle);
            moveDir.z -= Math.cos(this.state.angle);
        }
        if (this.input.backward) {
            moveDir.x += Math.sin(this.state.angle);
            moveDir.z += Math.cos(this.state.angle);
        }
        if (this.input.left) {
            moveDir.x -= Math.cos(this.state.angle);
            moveDir.z += Math.sin(this.state.angle);
        }
        if (this.input.right) {
            moveDir.x += Math.cos(this.state.angle);
            moveDir.z -= Math.sin(this.state.angle);
        }

        // Normalize and apply speed
        if (moveDir.length() > 0) {
            moveDir.normalize();
            moveDir.multiplyScalar(PLAYER_CONFIG.MOVE_SPEED * deltaTime);

            // Apply movement with collision
            this.applyMovement(moveDir, collisionMap);
        }
    }

    private applyMovement(moveDir: THREE.Vector3, collisionMap: boolean[][]): void {
        const newX = this.state.position.x + moveDir.x;
        const newZ = this.state.position.z + moveDir.z;

        // Simple grid-based collision
        const cellSize = 64; // Should match WORLD_CONFIG.CELL_SIZE
        const gridX = Math.floor(newX / cellSize);
        const gridZ = Math.floor(newZ / cellSize);

        // Check if new position is valid
        if (
            gridZ >= 0 &&
            gridZ < collisionMap.length &&
            gridX >= 0 &&
            gridX < collisionMap[0].length &&
            !collisionMap[gridZ][gridX]
        ) {
            this.state.position.x = newX;
            this.state.position.z = newZ;
        }
    }

    public takeDamage(damage: number): boolean {
        if (this.state.powerups.invuln) {
            return false; // Invulnerable
        }

        // Armor absorbs damage
        if (this.state.armor > 0) {
            const armorAbsorb = Math.min(damage * 0.5, this.state.armor);
            this.state.armor -= armorAbsorb;
            damage -= armorAbsorb;
        }

        this.state.health -= damage;

        if (this.state.health <= 0) {
            this.state.health = 0;
            this.state.deaths++;
            return true; // Player died
        }

        return false;
    }

    public addHealth(amount: number, maxOverheal: number): boolean {
        if (this.state.health >= maxOverheal) {
            return false;
        }
        this.state.health = Math.min(this.state.health + amount, maxOverheal);
        return true;
    }

    public addArmor(amount: number, maxArmor: number): boolean {
        if (this.state.armor >= maxArmor) {
            return false;
        }
        this.state.armor = Math.min(this.state.armor + amount, maxArmor);
        return true;
    }

    public addAmmo(type: string, amount: number, max: number): boolean {
        const ammo = this.state.ammo as Record<string, number>;
        if (!ammo[type]) {
            ammo[type] = 0;
        }
        if (ammo[type] >= max) {
            return false;
        }
        ammo[type] = Math.min(ammo[type] + amount, max);
        return true;
    }

    public addWeapon(weaponId: string): boolean {
        if (this.state.weapons.includes(weaponId)) {
            return false;
        }
        this.state.weapons.push(weaponId);
        return true;
    }

    public switchWeapon(weaponId: string): boolean {
        if (this.state.weapons.includes(weaponId)) {
            this.state.currentWeapon = weaponId;
            return true;
        }
        return false;
    }

    public canShoot(weapon: WeaponConfig): boolean {
        const now = Date.now();
        if (now - this.state.lastShootTime < weapon.fireRate) {
            return false;
        }
        if (weapon.ammoType && this.state.ammo[weapon.ammoType] < weapon.ammoPerShot) {
            return false;
        }
        return true;
    }

    public shoot(weapon: WeaponConfig): void {
        this.state.lastShootTime = Date.now();
        if (weapon.ammoType) {
            this.state.ammo[weapon.ammoType] -= weapon.ammoPerShot;
        }
    }

    public respawn(x: number, z: number): void {
        (this.state.position as THREE.Vector3).set(x, PLAYER_CONFIG.HEIGHT, z);
        this.state.health = PLAYER_CONFIG.SPAWN_HEALTH;
        this.state.armor = PLAYER_CONFIG.SPAWN_ARMOR;
        (this.state.velocity as THREE.Vector3).set(0, 0, 0);
        this.state.angle = 0;
        this.state.currentWeapon = 'pistol';
        this.state.ammo = {
            bullets: 50,
            shells: 0,
            rockets: 0,
            cells: 0,
        };
        this.state.weapons = ['fists', 'pistol'];
        this.state.powerups = {};
    }
}
