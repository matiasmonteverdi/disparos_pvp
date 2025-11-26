/**
 * Weapon Type Definitions
 * Shared between client and server
 */

export type WeaponType = 'melee' | 'hitscan' | 'projectile';

export type AmmoType = 'bullets' | 'shells' | 'rockets' | 'cells';

export interface WeaponConfig {
    id: string;
    name: string;
    damage: number;
    fireRate: number; // ms between shots
    ammoType: AmmoType | null;
    ammoPerShot: number;
    range?: number; // Optional - not used by projectile weapons
    type: WeaponType;

    // Optional properties for specific weapon types
    pellets?: number; // For shotguns
    spread?: number; // For hitscan weapons
    projectileSpeed?: number; // For projectile weapons
    splashRadius?: number; // For explosive weapons
}

export interface AmmoConfig {
    max: number;
    pickupSmall: number;
    pickupLarge: number;
}

export type AmmoRecord = Record<AmmoType, number>;
