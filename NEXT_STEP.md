# Siguiente Paso: Separación de Responsabilidades UI

## Fecha: 2025-11-26
## Estado: PENDIENTE

---

## ✅ COMPLETADO

### Fase 1.2: Eliminar `any` y Fortalecer Tipado

**Cambios realizados:**

1. **`src/core/Game.ts`**:
   - ✅ Actualizado `createProjectile(weapon: WeaponConfig)`
   - ✅ Actualizado `createProjectileEffect(data: ShootData)`
   - ✅ Actualizado `checkHitscan(weapon: WeaponConfig)`
   - ✅ Agregados casts `as THREE.Vector3` donde necesario
   - ✅ Agregados valores por defecto para propiedades opcionales

2. **`src/network/NetworkManager.ts`**:
   - ✅ Actualizado `onLocalPlayerUpdate` para usar `Partial<PlayerState>`
   - ✅ Eliminado cast `as any` en handler de posición

3. **Tipos compartidos**:
   - ✅ Importados `WeaponConfig` y `ShootData` correctamente
   - ✅ Verificado uso consistente en Player.ts

---

## 🎯 SIGUIENTE PASO: Fase 2.1 - Extraer Gestión de UI

### Objetivo
Separar la lógica de creación y gestión de elementos DOM (etiquetas de nombres de jugadores) de la clase `Game.ts` a un gestor dedicado.

### Tareas

#### 1. Crear `src/core/PlayerLabelManager.ts`

```typescript
import type { NetworkPlayer } from '../network/NetworkManager';
import { PLAYER_CONFIG } from '../config/game';
import * as THREE from 'three';

export class PlayerLabelManager {
    private labels: Map<string, HTMLDivElement> = new Map();
    
    public createLabel(playerId: string, playerName: string, team?: 'red' | 'blue'): HTMLDivElement {
        const nameLabel = document.createElement('div');
        nameLabel.className = 'player-name-label';
        
        if (team === 'red') {
            nameLabel.classList.add('red-team');
        } else if (team === 'blue') {
            nameLabel.classList.add('blue-team');
        }
        
        nameLabel.textContent = `${playerName} (100)`;
        nameLabel.style.position = 'absolute';
        nameLabel.style.fontSize = '12px';
        nameLabel.style.fontFamily = "'Press Start 2P', monospace";
        nameLabel.style.textShadow = '2px 2px 0 #000';
        nameLabel.style.pointerEvents = 'none';
        nameLabel.style.whiteSpace = 'nowrap';
        
        document.body.appendChild(nameLabel);
        this.labels.set(playerId, nameLabel);
        
        return nameLabel;
    }
    
    public removeLabel(playerId: string): void {
        const label = this.labels.get(playerId);
        if (label) {
            label.remove();
            this.labels.delete(playerId);
        }
    }
    
    public updateLabel(playerId: string, playerName: string, health: number): void {
        const label = this.labels.get(playerId);
        if (label) {
            label.textContent = `${playerName} (${Math.ceil(health)})`;
            if (health < 50) {
                label.style.color = '#f00';
            } else {
                label.style.color = '#fff';
            }
        }
    }
    
    public updateLabelPosition(
        playerId: string,
        worldPosition: THREE.Vector3,
        camera: THREE.Camera,
        canvas: HTMLCanvasElement
    ): void {
        const label = this.labels.get(playerId);
        if (!label) return;
        
        const position = worldPosition.clone();
        position.y += PLAYER_CONFIG.HEIGHT + 20;
        
        position.project(camera);
        
        const x = (position.x * 0.5 + 0.5) * canvas.clientWidth;
        const y = (position.y * -0.5 + 0.5) * canvas.clientHeight;
        
        if (position.z < 1) {
            label.style.display = 'block';
            label.style.left = `${x}px`;
            label.style.top = `${y}px`;
            label.style.transform = 'translate(-50%, -50%)';
        } else {
            label.style.display = 'none';
        }
    }
    
    public updateAllPositions(
        playerMeshes: Map<string, THREE.Mesh>,
        camera: THREE.Camera,
        canvas: HTMLCanvasElement
    ): void {
        playerMeshes.forEach((mesh, playerId) => {
            this.updateLabelPosition(playerId, mesh.position, camera, canvas);
        });
    }
    
    public clear(): void {
        this.labels.forEach(label => label.remove());
        this.labels.clear();
    }
}
```

#### 2. Refactorizar `src/core/Game.ts`

**Cambios a realizar:**

1. Importar el nuevo gestor:
```typescript
import { PlayerLabelManager } from './PlayerLabelManager';
```

2. Reemplazar `otherPlayerNameLabels` con el gestor:
```typescript
- private otherPlayerNameLabels: Map<string, HTMLDivElement> = new Map();
+ private playerLabelManager: PlayerLabelManager;
```

3. Inicializar en el constructor:
```typescript
constructor(canvas: HTMLCanvasElement, playerName: string) {
    // ... código existente ...
    this.playerLabelManager = new PlayerLabelManager();
}
```

4. Actualizar `onPlayerJoin`:
```typescript
private onPlayerJoin(player: NetworkPlayer): void {
    // ... código de mesh existente ...
    
    // Reemplazar creación manual de label
    this.playerLabelManager.createLabel(
        player.id,
        player.state.name,
        player.state.team
    );
}
```

5. Actualizar `onPlayerLeave`:
```typescript
private onPlayerLeave(playerId: string): void {
    // ... código de mesh existente ...
    this.playerLabelManager.removeLabel(playerId);
}
```

6. Actualizar `onPlayerUpdate`:
```typescript
private onPlayerUpdate(player: NetworkPlayer): void {
    this.playerLabelManager.updateLabel(
        player.id,
        player.state.name,
        player.state.health
    );
}
```

7. Actualizar `updateNameLabels`:
```typescript
private updateNameLabels(): void {
    if (!this.localPlayer) return;
    
    const camera = this.renderer.getCamera();
    const canvas = this.renderer.getCanvas();
    
    this.playerLabelManager.updateAllPositions(
        this.otherPlayerMeshes,
        camera,
        canvas
    );
}
```

8. Actualizar `stop`:
```typescript
public stop(): void {
    this.running = false;
    this.networkManager.disconnect();
    this.renderer.dispose();
    this.inputManager.dispose();
    this.playerLabelManager.clear();
}
```

### Beneficios Esperados

- ✅ Separación clara de responsabilidades
- ✅ Código más testeable
- ✅ Reducción de complejidad en Game.ts
- ✅ Reutilización del gestor de labels
- ✅ Más fácil de mantener y extender

### Archivos a Modificar

1. **CREAR**: `src/core/PlayerLabelManager.ts`
2. **MODIFICAR**: `src/core/Game.ts`

### Tiempo Estimado

**1-2 horas**

---

## 📝 Notas

- Mantener la misma funcionalidad visual
- No cambiar estilos CSS existentes
- Asegurar que las etiquetas se actualicen correctamente
- Verificar que no haya fugas de memoria al eliminar labels

---

## 🔄 Después de Completar

Continuar con **Fase 2.2**: Extraer Gestión de Proyectiles
