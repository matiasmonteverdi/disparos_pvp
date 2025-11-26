# Plan de Refactorización - Disparos Online

## Fecha: 2025-11-26
## Estado: ANÁLISIS COMPLETADO

---

## 📋 RESUMEN EJECUTIVO

Después de revisar todos los archivos del proyecto, he identificado varios problemas de arquitectura, código duplicado, lógica desconectada y oportunidades de mejora. Este documento presenta un plan estructurado de refactorización.

---

## 🔍 PROBLEMAS IDENTIFICADOS

### 1. **CRÍTICO: Tipado Débil y Uso de `any`**

**Archivos afectados:**
- `src/core/Game.ts` - Métodos que usan `weapon: any`
- `src/network/NetworkManager.ts` - Callbacks con `data: any`

**Problemas:**
```typescript
// ❌ MAL
private createProjectile(weapon: any): void
private checkHitscan(weapon: any): void
public canShoot(weapon: any): boolean

// ✅ BIEN
private createProjectile(weapon: WeaponConfig): void
private checkHitscan(weapon: WeaponConfig): void
public canShoot(weapon: WeaponConfig): boolean
```

**Impacto:** 
- Pérdida de type safety
- Errores en runtime (como el bug de `weapon.bullets`)
- Dificultad para refactorizar

---

### 2. **ALTO: Lógica de UI Mezclada con Lógica de Juego**

**Archivos afectados:**
- `src/main.ts` - Contiene lógica de actualización de HUD
- `src/core/Game.ts` - Crea elementos DOM directamente

**Problemas:**
```typescript
// En Game.ts - líneas 527-570
// ❌ Crea elementos DOM directamente en la clase Game
const nameLabel = document.createElement('div');
nameLabel.className = 'player-name-label';
document.body.appendChild(nameLabel);
```

**Impacto:**
- Violación del principio de responsabilidad única
- Dificulta testing
- Acoplamiento alto entre UI y lógica

---

### 3. **ALTO: Duplicación de Interfaces entre Cliente y Servidor**

**Archivos afectados:**
- `src/entities/Player.ts` - Define `PlayerState`, `PlayerInput`
- `server/index.ts` - Redefine las mismas interfaces
- `src/network/NetworkManager.ts` - Redefine `ChatMessage`, `LeaderboardEntry`

**Problemas:**
- Interfaces duplicadas en 3 lugares diferentes
- Riesgo de desincronización
- Mantenimiento difícil

**Solución propuesta:**
```
shared/
  ├── types/
  │   ├── player.ts
  │   ├── network.ts
  │   └── game.ts
```

---

### 4. **MEDIO: Gestión de Estado Inconsistente**

**Archivos afectados:**
- `src/core/Game.ts` - Múltiples fuentes de verdad
- `src/ui/UIManager.ts` - Mantiene su propio estado

**Problemas:**
```typescript
// En Game.ts
private localPlayer: Player | null = null;
private otherPlayerMeshes: Map<string, THREE.Mesh> = new Map();
private otherPlayerNameLabels: Map<string, HTMLDivElement> = new Map();
private items: Map<string, THREE.Mesh> = new Map();
private projectiles: Array<{...}> = [];

// En UIManager.ts
private currentPlayerId: string = '';
private leaderboardData: LeaderboardEntry[] = [];
```

**Impacto:**
- Estado distribuido difícil de rastrear
- Posibles inconsistencias
- Dificulta debugging

---

### 5. **MEDIO: Hardcoded Magic Numbers**

**Archivos afectados:**
- `src/core/Game.ts`
- `src/entities/Player.ts`

**Problemas:**
```typescript
// ❌ Magic numbers por todas partes
if (serverPos.distanceTo(this.localPlayer.state.position) > 100) {
const INTERPOLATION_PERIOD = 100; // ms
position.y += PLAYER_CONFIG.HEIGHT + 20;
const cellSize = 64; // Should match WORLD_CONFIG.CELL_SIZE
```

**Solución:**
```typescript
// ✅ Constantes con nombres descriptivos
const POSITION_CORRECTION_THRESHOLD = 100;
const INTERPOLATION_PERIOD_MS = 100;
const NAME_LABEL_OFFSET = 20;
const CELL_SIZE = WORLD_CONFIG.CELL_SIZE;
```

---

### 6. **MEDIO: Falta de Manejo de Errores**

**Archivos afectados:**
- `src/core/Game.ts`
- `src/network/NetworkManager.ts`

**Problemas:**
```typescript
// ❌ Sin validación
private createProjectile(weapon: any): void {
    if (!this.localPlayer) return;
    // No valida si weapon tiene las propiedades necesarias
    const direction = new THREE.Vector3(...);
}

// ❌ Catch genérico sin logging
} catch (error: any) {
    console.error('Failed to start game:', error);
    // No se reporta el error a ningún sistema de monitoreo
}
```

---

### 7. **BAJO: Código Comentado y Dead Code**

**Archivos afectados:**
- `src/core/Game.ts` - Comentarios como "FIXED - controls were inverted"
- `src/entities/Player.ts` - Comentarios obsoletos

---

### 8. **BAJO: Inconsistencia en Nombres**

**Problemas:**
```typescript
// Mezcla de estilos
onPlayerJoin()  // camelCase
on_player_join() // snake_case (no usado pero podría aparecer)
OnPlayerJoin()  // PascalCase (no usado)
```

---

## 🎯 PLAN DE REFACTORIZACIÓN

### **FASE 1: Fundamentos (Prioridad CRÍTICA)**
**Duración estimada: 2-3 horas**

#### 1.1 Crear Tipos Compartidos
```
shared/
  ├── types/
  │   ├── player.types.ts      # PlayerState, PlayerInput
  │   ├── network.types.ts     # ChatMessage, LeaderboardEntry, NetworkPlayer
  │   ├── game.types.ts        # GameState, GameStatus
  │   ├── weapon.types.ts      # WeaponConfig, WeaponType
  │   └── index.ts             # Re-exports
```

**Archivos a modificar:**
- `src/entities/Player.ts`
- `server/index.ts`
- `src/network/NetworkManager.ts`
- `src/config/constants.ts`

**Beneficios:**
- ✅ Elimina duplicación
- ✅ Garantiza sincronización cliente-servidor
- ✅ Facilita mantenimiento

---

#### 1.2 Eliminar `any` y Fortalecer Tipado

**Cambios:**
```typescript
// src/core/Game.ts
- private createProjectile(weapon: any): void
+ private createProjectile(weapon: WeaponConfig): void

- private checkHitscan(weapon: any): void
+ private checkHitscan(weapon: WeaponConfig): void

// src/entities/Player.ts
- public canShoot(weapon: any): boolean
+ public canShoot(weapon: WeaponConfig): boolean

- public shoot(weapon: any): void
+ public shoot(weapon: WeaponConfig): void
```

**Beneficios:**
- ✅ Previene errores en runtime
- ✅ Mejor autocompletado en IDE
- ✅ Refactoring más seguro

---

### **FASE 2: Separación de Responsabilidades (Prioridad ALTA)**
**Duración estimada: 3-4 horas**

#### 2.1 Extraer Gestión de UI de Game.ts

**Crear nuevo archivo:** `src/core/PlayerLabelManager.ts`

```typescript
export class PlayerLabelManager {
    private labels: Map<string, HTMLDivElement> = new Map();
    
    createLabel(playerId: string, playerName: string, team?: 'red' | 'blue'): void
    updateLabel(playerId: string, health: number): void
    updateLabelPosition(playerId: string, position: THREE.Vector3, camera: THREE.Camera): void
    removeLabel(playerId: string): void
    clear(): void
}
```

**Beneficios:**
- ✅ Game.ts se enfoca en lógica de juego
- ✅ Más fácil de testear
- ✅ Reutilizable

---

#### 2.2 Mover Lógica de HUD de main.ts a UIManager.ts

**Cambios en `src/ui/UIManager.ts`:**
```typescript
export class UIManager {
    // Nuevo método
    public startHUDUpdateLoop(game: Game): void {
        setInterval(() => {
            const player = game.getLocalPlayer();
            if (player) {
                this.updateHealth(player.state.health);
                this.updateArmor(player.state.armor);
                this.updateWeapon(player.state.currentWeapon);
                this.updateAmmo(player.state.ammo);
                this.updateScore(player.state.kills, player.state.deaths);
            }
        }, 100);
    }
}
```

**Beneficios:**
- ✅ main.ts más limpio
- ✅ UIManager tiene toda la lógica de UI
- ✅ Más fácil de mantener

---

### **FASE 3: Gestión de Estado Centralizada (Prioridad MEDIA)**
**Duración estimada: 4-5 horas**

#### 3.1 Crear Game State Manager

**Nuevo archivo:** `src/core/GameStateManager.ts`

```typescript
export interface GameStateData {
    localPlayer: Player | null;
    otherPlayers: Map<string, NetworkPlayer>;
    projectiles: Projectile[];
    items: Map<string, Item>;
    gameStatus: GameStatus;
}

export class GameStateManager {
    private state: GameStateData;
    private listeners: Map<string, Set<StateListener>> = new Map();
    
    getState(): Readonly<GameStateData>
    updateLocalPlayer(player: Player): void
    addOtherPlayer(player: NetworkPlayer): void
    removeOtherPlayer(playerId: string): void
    addProjectile(projectile: Projectile): void
    removeProjectile(index: number): void
    
    subscribe(key: keyof GameStateData, listener: StateListener): void
    unsubscribe(key: keyof GameStateData, listener: StateListener): void
}
```

**Beneficios:**
- ✅ Una sola fuente de verdad
- ✅ Cambios de estado rastreables
- ✅ Facilita debugging
- ✅ Preparado para time-travel debugging

---

### **FASE 4: Mejoras de Calidad (Prioridad MEDIA-BAJA)**
**Duración estimada: 2-3 horas**

#### 4.1 Extraer Constantes

**Nuevo archivo:** `src/config/gameConstants.ts`

```typescript
export const GAME_CONSTANTS = {
    POSITION_CORRECTION_THRESHOLD: 100,
    INTERPOLATION_PERIOD_MS: 100,
    NAME_LABEL_Y_OFFSET: 20,
    NETWORK_UPDATE_RATE_MS: 30,
    PROJECTILE_MAX_LIFETIME_MS: 5000,
    PING_INTERVAL_MS: 1000,
} as const;
```

---

#### 4.2 Añadir Validación y Manejo de Errores

```typescript
// src/core/Game.ts
private createProjectile(weapon: WeaponConfig): void {
    if (!this.localPlayer) {
        console.warn('Cannot create projectile: no local player');
        return;
    }
    
    if (!weapon.projectileSpeed) {
        console.error('Invalid weapon config: missing projectileSpeed', weapon);
        return;
    }
    
    // ... resto del código
}
```

---

#### 4.3 Limpiar Código Comentado

**Archivos a limpiar:**
- `src/entities/Player.ts` - Eliminar comentarios como "FIXED"
- `src/core/Game.ts` - Eliminar código muerto

---

### **FASE 5: Optimizaciones (Prioridad BAJA)**
**Duración estimada: 2-3 horas**

#### 5.1 Object Pooling para Projectiles

```typescript
export class ProjectilePool {
    private pool: Projectile[] = [];
    private active: Projectile[] = [];
    
    acquire(): Projectile
    release(projectile: Projectile): void
}
```

**Beneficios:**
- ✅ Reduce garbage collection
- ✅ Mejor rendimiento

---

#### 5.2 Throttling y Debouncing

```typescript
// Para actualizaciones de UI
const throttledUpdateNameLabels = throttle(
    () => this.updateNameLabels(),
    16 // ~60fps
);
```

---

## 📊 MÉTRICAS DE ÉXITO

### Antes de la Refactorización
- ❌ 15+ usos de `any`
- ❌ 3 definiciones duplicadas de interfaces
- ❌ Lógica de UI en 3 archivos diferentes
- ❌ 20+ magic numbers
- ❌ 0% cobertura de tests

### Después de la Refactorización
- ✅ 0 usos de `any` (excepto casos justificados)
- ✅ 1 definición única de cada interfaz
- ✅ Lógica de UI centralizada en UIManager
- ✅ 0 magic numbers
- ✅ Preparado para testing

---

## 🚀 ORDEN DE EJECUCIÓN RECOMENDADO

### Semana 1: Fundamentos
1. ✅ Crear carpeta `shared/types/`
2. ✅ Migrar interfaces a tipos compartidos
3. ✅ Eliminar `any` y fortalecer tipado
4. ✅ Commit: "refactor: add shared types and remove any"

### Semana 2: Separación de Responsabilidades
5. ✅ Crear `PlayerLabelManager`
6. ✅ Mover lógica de HUD a `UIManager`
7. ✅ Commit: "refactor: separate UI concerns from game logic"

### Semana 3: Estado Centralizado
8. ✅ Crear `GameStateManager`
9. ✅ Migrar estado a manager
10. ✅ Commit: "refactor: centralize game state management"

### Semana 4: Calidad y Optimización
11. ✅ Extraer constantes
12. ✅ Añadir validación
13. ✅ Limpiar código
14. ✅ Commit: "refactor: improve code quality and add validation"

---

## ⚠️ RIESGOS Y MITIGACIONES

### Riesgo 1: Romper funcionalidad existente
**Mitigación:** 
- Hacer cambios incrementales
- Probar después de cada cambio
- Usar git para rollback si es necesario

### Riesgo 2: Tiempo de desarrollo
**Mitigación:**
- Priorizar fases críticas primero
- Fases opcionales pueden posponerse

### Riesgo 3: Conflictos de merge
**Mitigación:**
- Commits pequeños y frecuentes
- Comunicación con el equipo

---

## 📝 NOTAS ADICIONALES

### Archivos que NO necesitan refactorización inmediata:
- ✅ `src/config/constants.ts` - Bien estructurado
- ✅ `src/world/Map.ts` - Funciona correctamente
- ✅ `src/input/InputManager.ts` - Bien encapsulado
- ✅ `src/renderer/Renderer.ts` - Responsabilidad clara

### Archivos que necesitan atención especial:
- ⚠️ `src/core/Game.ts` - Demasiadas responsabilidades (792 líneas)
- ⚠️ `src/ui/UIManager.ts` - Podría dividirse en componentes más pequeños
- ⚠️ `server/index.ts` - Necesita modularización (622 líneas)

---

## 🎓 LECCIONES APRENDIDAS

1. **Tipado fuerte desde el inicio** - Evita bugs como el de `weapon.bullets`
2. **Separación de responsabilidades** - Facilita mantenimiento
3. **Tipos compartidos** - Evita duplicación y desincronización
4. **Constantes nombradas** - Código más legible
5. **Estado centralizado** - Más fácil de rastrear y debuggear

---

## ✅ CONCLUSIÓN

Este plan de refactorización aborda los problemas más críticos del proyecto de manera estructurada y priorizada. La implementación completa tomará aproximadamente 2-3 semanas de trabajo, pero puede dividirse en fases independientes que aportan valor incremental.

**Recomendación:** Comenzar con la Fase 1 (Fundamentos) ya que tiene el mayor impacto en la prevención de bugs y facilita todas las fases posteriores.
