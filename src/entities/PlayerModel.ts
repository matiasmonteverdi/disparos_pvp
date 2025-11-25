import * as THREE from 'three';

/**
 * Creates a retro FPS-style player model inspired by DOOM, Quake, and Wolfenstein 3D
 * @returns THREE.Group containing the complete player model
 */
export function createRetroPlayerModel(): THREE.Group {
    const playerGroup = new THREE.Group();

    // Torso (main body) - inspired by space marine armor
    const torsoGeometry = new THREE.BoxGeometry(1.2, 1.8, 0.8);
    const torsoMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a4a2a, // Dark green armor
        metalness: 0.6,
        roughness: 0.4,
        emissive: 0x1a3a1a,
        emissiveIntensity: 0.2
    });
    const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
    torso.position.y = 1.5;
    playerGroup.add(torso);

    // Shoulder pads - DOOM style
    const shoulderGeometry = new THREE.BoxGeometry(0.5, 0.4, 0.5);
    const shoulderMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a4a4a,
        metalness: 0.8,
        roughness: 0.3
    });

    const leftShoulder = new THREE.Mesh(shoulderGeometry, shoulderMaterial);
    leftShoulder.position.set(-0.85, 2.2, 0);
    playerGroup.add(leftShoulder);

    const rightShoulder = new THREE.Mesh(shoulderGeometry, shoulderMaterial);
    rightShoulder.position.set(0.85, 2.2, 0);
    playerGroup.add(rightShoulder);

    // Head/Helmet - angular like Quake
    const headGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const headMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b4513, // Brown helmet
        metalness: 0.5,
        roughness: 0.5,
        emissive: 0x4a2511,
        emissiveIntensity: 0.1
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 2.8;
    playerGroup.add(head);

    // Visor - glowing red eyes like DOOM
    const visorGeometry = new THREE.PlaneGeometry(0.6, 0.2);
    const visorMaterial = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 2,
        side: THREE.DoubleSide
    });
    const visor = new THREE.Mesh(visorGeometry, visorMaterial);
    visor.position.set(0, 2.8, 0.41);
    playerGroup.add(visor);

    // Arms
    const armGeometry = new THREE.BoxGeometry(0.3, 1.2, 0.3);
    const armMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a4a2a,
        metalness: 0.5,
        roughness: 0.5
    });

    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.75, 1.5, 0);
    playerGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.75, 1.5, 0);
    playerGroup.add(rightArm);

    // Legs
    const legGeometry = new THREE.BoxGeometry(0.4, 1.4, 0.4);
    const legMaterial = new THREE.MeshStandardMaterial({
        color: 0x3a3a3a,
        metalness: 0.4,
        roughness: 0.6
    });

    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.3, 0.4, 0);
    playerGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.3, 0.4, 0);
    playerGroup.add(rightLeg);

    // Weapon indicator - glowing barrel
    const weaponGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.8);
    const weaponMaterial = new THREE.MeshStandardMaterial({
        color: 0x666666,
        metalness: 0.9,
        roughness: 0.2,
        emissive: 0x444444,
        emissiveIntensity: 0.3
    });
    const weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
    weapon.position.set(0.5, 1.3, 0.6);
    playerGroup.add(weapon);

    // Add subtle ambient glow
    const glowLight = new THREE.PointLight(0x00ff00, 0.5, 3);
    glowLight.position.set(0, 1.5, 0);
    playerGroup.add(glowLight);

    return playerGroup;
}
