// Network and Synchronization Constants
export const NETWORK_CONSTANTS = {
    // Network update rate in milliseconds (approximately 33Hz)
    UPDATE_RATE_MS: 30,

    // Position correction threshold in units
    POSITION_CORRECTION_THRESHOLD: 100,

    // Interpolation period for smooth player movement
    INTERPOLATION_PERIOD_MS: 100,
} as const;

// Projectile Constants
export const PROJECTILE_CONSTANTS = {
    // Maximum lifetime for projectiles in milliseconds
    MAX_LIFETIME_MS: 5000,
} as const;

// Visual Constants
export const VISUAL_CONSTANTS = {
    // Offset for player name labels above player head
    NAME_LABEL_OFFSET: 20,

    // Muzzle flash duration in milliseconds
    MUZZLE_FLASH_DURATION_MS: 50,

    // Blood effect animation interval in milliseconds
    BLOOD_EFFECT_INTERVAL_MS: 50,

    // Explosion animation interval in milliseconds
    EXPLOSION_INTERVAL_MS: 50,
} as const;

// Collision Constants
export const COLLISION_CONSTANTS = {
    // Player collision radius multiplier for projectile hits
    PLAYER_HIT_RADIUS_MULTIPLIER: 2,
} as const;
