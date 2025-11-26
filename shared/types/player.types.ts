/**
 * Player Type Definitions
 * Shared between client and server
 */

import type { AmmoRecord } from './weapon.types';
import type * as THREE from 'three';

export interface Vector3 {
    x: number;
    y: number;
    z: number;
}

export interface PlayerInput {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    turnLeft: boolean;
    turnRight: boolean;
    shoot: boolean;
    weaponSlot: number | null;
}

export interface PlayerPowerups {
    invuln?: number;
    invis?: number;
    quad?: number;
}

export interface PlayerState {
    id: string;
    name: string;
    position: THREE.Vector3 | Vector3;
    angle: number;
    velocity: THREE.Vector3 | Vector3;
    health: number;
    armor: number;
    currentWeapon: string;
    ammo: AmmoRecord | Record<string, number>; // Allow both typed and dynamic ammo
    weapons: string[];
    powerups: PlayerPowerups;
    lastShootTime: number;
    kills: number;
    deaths: number;
    team?: 'red' | 'blue';
    ping?: number;
    lastPingTime?: number;
}
