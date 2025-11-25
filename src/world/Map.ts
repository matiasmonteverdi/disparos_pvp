
export interface MapCell {
    type: 'empty' | 'wall' | 'spawn' | 'pickup' | 'weapon';
    wallTexture?: number;
    pickupType?: string;
    weaponType?: string;
}

export interface MapData {
    name: string;
    width: number;
    height: number;
    cells: MapCell[][];
    spawns: { x: number; z: number }[];
    pickups: { x: number; z: number; type: string }[];
    weapons: { x: number; z: number; type: string }[];
}

// Simple Deathmatch map
export const DM_MAP_1: MapData = {
    name: 'Arena',
    width: 20,
    height: 20,
    cells: [],
    spawns: [
        { x: 3 * 64 + 32, z: 3 * 64 + 32 },
        { x: 16 * 64 + 32, z: 3 * 64 + 32 },
        { x: 3 * 64 + 32, z: 16 * 64 + 32 },
        { x: 16 * 64 + 32, z: 16 * 64 + 32 },
        { x: 10 * 64 + 32, z: 10 * 64 + 32 },
    ],
    pickups: [
        { x: 5 * 64 + 32, z: 5 * 64 + 32, type: 'health_large' },
        { x: 14 * 64 + 32, z: 5 * 64 + 32, type: 'health_large' },
        { x: 5 * 64 + 32, z: 14 * 64 + 32, type: 'health_large' },
        { x: 14 * 64 + 32, z: 14 * 64 + 32, type: 'health_large' },
        { x: 10 * 64 + 32, z: 5 * 64 + 32, type: 'armor_large' },
        { x: 10 * 64 + 32, z: 14 * 64 + 32, type: 'armor_large' },
        { x: 7 * 64 + 32, z: 10 * 64 + 32, type: 'health_mega' },
        { x: 12 * 64 + 32, z: 10 * 64 + 32, type: 'armor_small' },
    ],
    weapons: [
        { x: 3 * 64 + 32, z: 10 * 64 + 32, type: 'shotgun' },
        { x: 16 * 64 + 32, z: 10 * 64 + 32, type: 'shotgun' },
        { x: 10 * 64 + 32, z: 3 * 64 + 32, type: 'chaingun' },
        { x: 10 * 64 + 32, z: 16 * 64 + 32, type: 'rocket' },
    ],
};

// Initialize the map grid
function initializeMap(map: MapData): void {
    map.cells = [];
    for (let z = 0; z < map.height; z++) {
        map.cells[z] = [];
        for (let x = 0; x < map.width; x++) {
            // Border walls
            if (x === 0 || x === map.width - 1 || z === 0 || z === map.height - 1) {
                map.cells[z][x] = { type: 'wall', wallTexture: 0 };
            }
            // Some interior walls for cover
            else if (
                (x === 7 && z >= 7 && z <= 12) ||
                (x === 12 && z >= 7 && z <= 12) ||
                (z === 7 && x >= 7 && x <= 12) ||
                (z === 12 && x >= 7 && x <= 12)
            ) {
                // Create a square room in the center with openings
                if (!((x === 9 || x === 10) && (z === 7 || z === 12))) {
                    map.cells[z][x] = { type: 'wall', wallTexture: 1 };
                } else {
                    map.cells[z][x] = { type: 'empty' };
                }
            } else {
                map.cells[z][x] = { type: 'empty' };
            }
        }
    }
}

initializeMap(DM_MAP_1);

export function getCollisionMap(map: MapData): boolean[][] {
    const collisionMap: boolean[][] = [];
    for (let z = 0; z < map.height; z++) {
        collisionMap[z] = [];
        for (let x = 0; x < map.width; x++) {
            collisionMap[z][x] = map.cells[z][x].type === 'wall';
        }
    }
    return collisionMap;
}

export function getRandomSpawnPoint(map: MapData): { x: number; z: number } {
    const spawn = map.spawns[Math.floor(Math.random() * map.spawns.length)];
    return { ...spawn };
}
