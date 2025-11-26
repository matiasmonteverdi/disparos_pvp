import type { WeaponConfig } from '../../shared/types/weapon.types';

// Weapon Configuration - 9 WEAPONS TOTAL
export const WEAPONS: Record<string, WeaponConfig> = {
    FISTS: {
        id: 'fists',
        name: 'Fists',
        damage: 10,
        fireRate: 500, // ms between shots
        ammoType: null,
        ammoPerShot: 0,
        range: 64,
        type: 'melee',
    },
    CHAINSAW: {
        id: 'chainsaw',
        name: 'Chainsaw',
        damage: 20,
        fireRate: 100, // Very fast
        ammoType: null, // No ammo needed
        ammoPerShot: 0,
        range: 80,
        type: 'melee',
    },
    PISTOL: {
        id: 'pistol',
        name: 'Pistol',
        damage: 15,
        fireRate: 300,
        ammoType: 'bullets',
        ammoPerShot: 1,
        range: Infinity,
        type: 'hitscan',
        spread: 0.02,
    },
    SHOTGUN: {
        id: 'shotgun',
        name: 'Shotgun',
        damage: 10, // Per pellet
        pellets: 7,
        fireRate: 800,
        ammoType: 'shells',
        ammoPerShot: 1,
        range: 1024,
        type: 'hitscan',
        spread: 0.15,
    },
    SUPER_SHOTGUN: {
        id: 'supershotgun',
        name: 'Super Shotgun',
        damage: 12, // Per pellet
        pellets: 20,
        fireRate: 1200,
        ammoType: 'shells',
        ammoPerShot: 2,
        range: 1024,
        type: 'hitscan',
        spread: 0.25,
    },
    CHAINGUN: {
        id: 'chaingun',
        name: 'Chaingun',
        damage: 12,
        fireRate: 100,
        ammoType: 'bullets',
        ammoPerShot: 1,
        range: Infinity,
        type: 'hitscan',
        spread: 0.05,
    },
    ROCKET_LAUNCHER: {
        id: 'rocket',
        name: 'Rocket Launcher',
        damage: 100,
        splashRadius: 128,
        fireRate: 1000,
        ammoType: 'rockets',
        ammoPerShot: 1,
        projectileSpeed: 500,
        type: 'projectile',
    },
    PLASMA_GUN: {
        id: 'plasma',
        name: 'Plasma Gun',
        damage: 30,
        fireRate: 150,
        ammoType: 'cells',
        ammoPerShot: 1,
        projectileSpeed: 800,
        type: 'projectile',
    },
    BFG: {
        id: 'bfg',
        name: 'BFG-9000',
        damage: 500,
        splashRadius: 256,
        fireRate: 2000,
        ammoType: 'cells',
        ammoPerShot: 40,
        projectileSpeed: 600,
        type: 'projectile',
    },
};

// Ammo Configuration
export const AMMO_CONFIG = {
    bullets: { max: 200, pickupSmall: 10, pickupLarge: 50 },
    shells: { max: 50, pickupSmall: 4, pickupLarge: 20 },
    rockets: { max: 50, pickupSmall: 1, pickupLarge: 5 },
    cells: { max: 300, pickupSmall: 20, pickupLarge: 100 },
};
