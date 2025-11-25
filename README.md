# DOOM PvP - Multiplayer Online Shooter

Un juego de disparos multijugador online inspirado en DOOM 1993, con énfasis en combate PvP rápido y frenético.

## 🎮 Características

### Jugabilidad Core
- **Movimiento Rápido**: Movimiento acelerado estilo DOOM clásico (strafe running)
- **Sin ADS**: No hay apuntar con mira - acción pura y directa
- **Combate Mixto**: Armas hitscan (daño instantáneo) y proyectiles
- **Recolección de Recursos**: Salud, armadura y munición se encuentran en el mapa
- **Sin Clases**: Todos los jugadores comienzan iguales

### Arsenal de Armas
1. **Fists** - Cuerpo a cuerpo básico
2. **Pistol** - Arma inicial con munición infinita
3. **Shotgun** - Escopeta de alto daño cercano
4. **Chaingun** - Ametralladora de alta cadencia
5. **Rocket Launcher** - Lanzacohetes con daño de área
6. **Plasma Gun** - Arma de energía de disparo rápido
7. **BFG-9000** - Arma definitiva de daño masivo

### Power-Ups
- **Invulnerabilidad** - Protección temporal contra daño
- **Invisibilidad** - Camuflaje parcial
- **Quad Damage** - Multiplicador de daño x4

### Modos de Juego
- **Deathmatch** - Todos contra todos
- **Team Deathmatch** - Equipos competitivos
- **Duelo 1v1** - Combate directo

## 🚀 Instalación

### Requisitos
- Node.js 18+
- npm o yarn

### Pasos

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd disparos_online
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Iniciar el servidor**
```bash
npm run server
```

4. **Iniciar el cliente** (en otra terminal)
```bash
npm run dev
```

5. **Abrir el navegador**
```
http://localhost:5173
```

## 🎯 Controles

- **WASD** - Movimiento
- **Mouse** - Mirar/Apuntar
- **Click Izquierdo / Espacio** - Disparar
- **1-7** - Cambiar armas
- **Flechas Izquierda/Derecha** - Girar (alternativa al mouse)

## 🏗️ Arquitectura del Proyecto

```
disparos_online/
├── src/
│   ├── config/
│   │   └── constants.ts      # Configuración del juego
│   ├── core/
│   │   └── Game.ts            # Loop principal del juego
│   ├── entities/
│   │   └── Player.ts          # Lógica del jugador
│   ├── input/
│   │   └── InputManager.ts   # Manejo de controles
│   ├── network/
│   │   └── NetworkManager.ts # Comunicación multijugador
│   ├── renderer/
│   │   └── Renderer.ts        # Renderizado 3D con Three.js
│   ├── world/
│   │   └── Map.ts             # Mapas y niveles
│   ├── main.ts                # Punto de entrada
│   └── style.css              # Estilos retro DOOM
├── server/
│   └── index.ts               # Servidor Socket.io
└── package.json
```

## 🔧 Tecnologías

- **Frontend**: TypeScript + Three.js + Vite
- **Backend**: Node.js + Express + Socket.io
- **Renderizado**: Three.js (WebGL)
- **Networking**: Socket.io (WebSockets)

## 🎨 Estilo Visual

- **Gráficos**: Low-poly 3D con estética retro
- **HUD**: Interfaz estilo DOOM clásico
- **Efectos**: Gore pixelado y efectos de sangre
- **Paleta**: Colores inspirados en la paleta original de DOOM

## 📝 Configuración

### Modificar el puerto del servidor

Edita `server/index.ts`:
```typescript
const PORT = process.env.PORT || 3001;
```

Y `src/config/constants.ts`:
```typescript
SERVER_URL: 'http://localhost:3001',
```

### Ajustar velocidad de movimiento

Edita `src/config/constants.ts`:
```typescript
export const PLAYER_CONFIG = {
  MOVE_SPEED: 200, // Unidades por segundo
  STRAFE_SPEED: 200,
  TURN_SPEED: 3.0,
  // ...
};
```

### Añadir nuevas armas

1. Define el arma en `src/config/constants.ts`:
```typescript
export const WEAPONS = {
  // ...
  NEW_WEAPON: {
    id: 'new_weapon',
    name: 'New Weapon',
    damage: 50,
    fireRate: 500,
    ammoType: 'bullets',
    ammoPerShot: 1,
    type: 'hitscan',
  },
};
```

2. Añade la lógica de disparo en `src/core/Game.ts`

## 🗺️ Crear Nuevos Mapas

Edita `src/world/Map.ts`:

```typescript
export const NEW_MAP: MapData = {
  name: 'My Map',
  width: 20,
  height: 20,
  cells: [],
  spawns: [
    { x: 3 * 64 + 32, z: 3 * 64 + 32 },
    // Más puntos de spawn...
  ],
  pickups: [
    { x: 5 * 64 + 32, z: 5 * 64 + 32, type: 'health_large' },
    // Más pickups...
  ],
  weapons: [
    { x: 10 * 64 + 32, z: 10 * 64 + 32, type: 'shotgun' },
    // Más armas...
  ],
};
```

## 🐛 Debugging

### El servidor no inicia
- Verifica que el puerto no esté en uso
- Revisa los logs en la consola

### El cliente no se conecta
- Asegúrate de que el servidor esté corriendo
- Verifica que las URLs coincidan en cliente y servidor
- Revisa la consola del navegador para errores

### Lag o stuttering
- Ajusta `TICK_RATE` en `src/config/constants.ts`
- Reduce `INTERPOLATION_DELAY` para menos lag (más jitter)
- Aumenta `INTERPOLATION_DELAY` para más suavidad (más lag)

## 🚧 Próximas Características

- [ ] Implementar lógica de hitscan completa
- [ ] Añadir proyectiles visuales
- [ ] Sistema de respawn
- [ ] Scoreboard
- [ ] Chat de texto
- [ ] Efectos de sonido
- [ ] Más mapas
- [ ] Autoridad del servidor (anti-cheat)
- [ ] Predicción del lado del cliente
- [ ] Reconciliación de servidor

## 📄 Licencia

MIT

## 🤝 Contribuir

Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 👥 Créditos

Inspirado en DOOM (1993) de id Software.

---

**¡Disfruta del juego!** 🎮💀
