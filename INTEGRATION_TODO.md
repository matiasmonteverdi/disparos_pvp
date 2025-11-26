# Integración Completada: UIManager en Game.ts

## Estado Actual
Se han implementado exitosamente:
- ✅ Servidor con autoridad y anti-cheat
- ✅ Sistema de equipos (Red vs Blue)
- ✅ Tracking de ping
- ✅ Sistema de leaderboard
- ✅ Manejo de reconexión
- ✅ UIManager completo
- ✅ NetworkManager mejorado
- ✅ Estilos CSS completos
- ✅ Integración en Game.ts completada

## Cambios Realizados en Game.ts

### 1. Importar UIManager
```typescript
import { UIManager } from '../ui/UIManager';
import { type LeaderboardEntry } from '../network/NetworkManager';
```

### 2. Agregar propiedad privada
```typescript
private uiManager: UIManager;
```

### 3. Inicializar en el constructor
```typescript
constructor(canvas: HTMLCanvasElement, playerName: string) {
    // ... código existente ...
    this.uiManager = new UIManager();
    
    // Configurar callbacks adicionales
    this.networkManager.onPingUpdate((ping) => {
        this.uiManager.updatePing(ping);
    });
    
    this.networkManager.onLeaderboard((leaderboard: LeaderboardEntry[]) => {
        this.uiManager.updateLeaderboard(leaderboard);
    });
}
```

### 4. Actualizar callback de localPlayerUpdate
```typescript
this.networkManager.onLocalPlayerUpdate((state) => {
    if (this.localPlayer) {
        this.localPlayer.state.health = state.health;
        this.localPlayer.state.armor = state.armor;
        this.localPlayer.state.kills = state.kills;
        this.localPlayer.state.deaths = state.deaths;
        this.localPlayer.state.ammo = state.ammo;
        this.localPlayer.state.team = state.team;
        this.localPlayer.state.ping = state.ping;

        // Corrección de posición del servidor
        if (state.position) {
            const serverPos = new THREE.Vector3(state.position.x, state.position.y, state.position.z);
            if (serverPos.distanceTo(this.localPlayer.state.position) > 100) {
                console.warn('Position corrected by server');
                this.localPlayer.state.position.copy(serverPos);
            }
        }
    }
});
```

### 5. Actualizar etiquetas de jugadores con colores de equipo
En el método `onPlayerJoin`, se agregan clases CSS según el equipo:
```typescript
private onPlayerJoin(player: NetworkPlayer): void {
    // ... código existente de creación de mesh ...
    
    // Crear etiqueta con color de equipo
    const nameLabel = document.createElement('div');
    nameLabel.className = 'player-name-label';
    if (player.state.team === 'red') {
        nameLabel.classList.add('red-team');
    } else if (player.state.team === 'blue') {
        nameLabel.classList.add('blue-team');
    }
    nameLabel.textContent = `${player.state.name} (${Math.ceil(player.state.health)})`;
    // ... resto del código ...
}
```

### 6. Manejar reconexión
Listeners agregados para eventos de reconexión en NetworkManager:
```typescript
// En el constructor, después de crear networkManager
this.networkManager.onReconnecting((attempt) => {
    this.uiManager.showReconnecting(attempt);
});

this.networkManager.onReconnected(() => {
    this.uiManager.hideReconnecting();
});
```

## Testing
Verificar:
1. Indicador de ping se actualiza correctamente
2. Leaderboard se muestra al presionar TAB
3. Overlay de reconexión aparece cuando se pierde conexión
4. Nombres de jugadores tienen colores según equipo
5. Todos los datos se sincronizan correctamente
