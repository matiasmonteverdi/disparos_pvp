// Game Constants - DOOM 1993 Style PvP

// World Configuration
export const WORLD_CONFIG = {
    CELL_SIZE: 64,
    WALL_HEIGHT: 64,
    FLOOR_HEIGHT: 0,
    CEILING_HEIGHT: 64,
};

// Player Configuration
export const PLAYER_CONFIG = {
    HEIGHT: 32,
    RADIUS: 16,
    MOVE_SPEED: 200, // Units per second - Fast DOOM-style movement
    STRAFE_SPEED: 200,
    TURN_SPEED: 3.0, // Radians per second
    MAX_HEALTH: 100,
    MAX_ARMOR: 200,
    SPAWN_HEALTH: 100,
    SPAWN_ARMOR: 0,
};

// Weapon Configuration
export const WEAPONS = {
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

// Pickup Configuration
export const PICKUPS = {
    HEALTH_SMALL: {
        id: 'health_small',
        type: 'health',
        amount: 10,
        maxOverheal: 100,
        respawnTime: 20000, // ms
    },
    HEALTH_LARGE: {
        id: 'health_large',
        type: 'health',
        amount: 25,
        maxOverheal: 100,
        respawnTime: 30000,
    },
    HEALTH_MEGA: {
        id: 'health_mega',
        type: 'health',
        amount: 100,
        maxOverheal: 200,
        respawnTime: 60000,
    },
    ARMOR_SMALL: {
        id: 'armor_small',
        type: 'armor',
        amount: 50,
        maxArmor: 100,
        respawnTime: 20000,
    },
    ARMOR_LARGE: {
        id: 'armor_large',
        type: 'armor',
        amount: 100,
        maxArmor: 200,
        respawnTime: 30000,
    },
};

// Power-ups Configuration
export const POWERUPS = {
    INVULNERABILITY: {
        id: 'invuln',
        duration: 30000,
        respawnTime: 120000,
    },
    INVISIBILITY: {
        id: 'invis',
        duration: 60000,
        respawnTime: 120000,
    },
    QUAD_DAMAGE: {
        id: 'quad',
        duration: 30000,
        respawnTime: 120000,
    },
};

// Rendering Configuration
export const RENDER_CONFIG = {
    FOV: 90,
    NEAR_PLANE: 0.1,
    FAR_PLANE: 2000,
    RESOLUTION_SCALE: 1.0, // Can be lowered for retro pixelated look
};

// Network Configuration
export const NETWORK_CONFIG = {
    SERVER_URL: 'http://localhost:3001',
    TICK_RATE: 60, // Server ticks per second
    CLIENT_UPDATE_RATE: 60, // Client sends input at this rate
    INTERPOLATION_DELAY: 100, // ms - for smooth other player movement
};

// Colors (DOOM palette inspired)
export const COLORS = {
    WALL_GRAY: 0x808080,
    WALL_BROWN: 0x8B4513,
    WALL_RED: 0x8B0000,
    FLOOR_DARK: 0x404040,
    CEILING_DARK: 0x202020,
    HEALTH_GREEN: 0x00FF00,
    ARMOR_BLUE: 0x0000FF,
    AMMO_YELLOW: 0xFFFF00,
    BLOOD_RED: 0xFF0000,
};
