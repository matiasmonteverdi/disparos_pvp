# DOOM PvP - Multiplayer Online Shooter

Un juego de disparos multijugador online inspirado en DOOM 1993, con énfasis en combate PvP rápido y frenético.

## ✨ Nuevas Características

### 🎮 Sistema de Chat
- Presiona **T** para abrir el chat
- Escribe tu mensaje y presiona **Enter** para enviar
- Presiona **ESC** para cerrar el chat
- Mensajes del sistema para jugadores que se unen/salen
- Historial de hasta 50 mensajes

### 👤 Sistema de Nombres
- Pantalla de entrada de nombre al iniciar
- Nombres personalizados para cada jugador
- Validación de nombres (mínimo 2 caracteres)
- Máximo 20 caracteres por nombre

### 👥 Límite de Jugadores
- **Máximo 8 jugadores** por servidor
- Contador de jugadores en tiempo real (esquina superior derecha)
- Mensaje de "servidor lleno" si se excede el límite

## 🎮 Características Core

### Jugabilidad
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

## 🚀 Instalación y Ejecución

### Requisitos
- Node.js 18+
- npm o yarn

### Pasos

1. **Clonar el repositorio**
```bash
git clone https://github.com/matiasmonteverdi/disparos_pvp.git
cd disparos_pvp
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Iniciar el servidor** (Terminal 1)
```bash
npm run server
```

4. **Iniciar el cliente** (Terminal 2)
```bash
npm run dev
```

5. **Abrir el navegador**
```
http://localhost:5173
```

6. **Unirse al juego**
- Ingresa tu nombre (2-20 caracteres)
- Haz clic en "JOIN GAME"
- ¡Empieza a jugar!

## 🎯 Controles

- **WASD** - Movimiento
- **Mouse** - Mirar/Apuntar (click para activar pointer lock)
- **Click Izquierdo / Espacio** - Disparar
- **1-7** - Cambiar armas
- **T** - Abrir chat
- **ESC** - Cerrar chat
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
│   ├── ui/
│   │   └── ChatManager.ts    # Sistema de chat
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
- **Chat**: Sistema de mensajería en tiempo real
- **Paleta**: Colores inspirados en la paleta original de DOOM

## 📝 Configuración

### Modificar el puerto del servidor

Edita `server/index.ts`:
```typescript
const PORT = process.env.PORT || 3001;
const MAX_PLAYERS = 8; // Cambiar límite de jugadores
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

## 🌐 Multijugador

### Características de Red
- **Límite de jugadores**: 8 jugadores máximo
- **Sincronización en tiempo real**: 60 ticks por segundo
- **Chat en tiempo real**: Mensajes instantáneos entre jugadores
- **Contador de jugadores**: Muestra cuántos jugadores están conectados
- **Mensajes del sistema**: Notificaciones cuando jugadores se unen/salen

### Eventos de Red
- `joinGame`: Unirse al juego con nombre
- `playerUpdate`: Actualización de estado del jugador
- `playerShoot`: Evento de disparo
- `chatMessage`: Mensaje de chat
- `playerCount`: Actualización del contador de jugadores
- `serverFull`: Servidor lleno (rechaza conexión)

## 🐛 Debugging

### El servidor no inicia
- Verifica que el puerto 3001 no esté en uso
- Revisa los logs en la consola del servidor

### El cliente no se conecta
- Asegúrate de que el servidor esté corriendo
- Verifica que las URLs coincidan en cliente y servidor
- Revisa la consola del navegador para errores

### "Server is full"
- El servidor tiene un límite de 8 jugadores
- Espera a que un jugador se desconecte
- O cambia `MAX_PLAYERS` en `server/index.ts`

### El chat no funciona
- Asegúrate de presionar **T** para abrir el chat
- Verifica que el servidor esté recibiendo mensajes (logs)
- Revisa la consola del navegador para errores

## 🚧 Próximas Características

- [x] Sistema de chat
- [x] Nombres de jugadores
- [x] Límite de 8 jugadores
- [ ] Implementar lógica de hitscan completa
- [ ] Añadir proyectiles visuales
- [ ] Sistema de respawn
- [ ] Scoreboard completo
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

## 📸 Screenshots

### Pantalla de Nombre
![Name Screen](docs/name-screen.png)

### Juego en Acción
![Gameplay](docs/gameplay.png)

### Sistema de Chat
![Chat System](docs/chat.png)
