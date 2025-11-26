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
