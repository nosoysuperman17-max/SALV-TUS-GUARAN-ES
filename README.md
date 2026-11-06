# SANTI FIGHTER 🥊

Juego de pelea 2D en canvas HTML5. Proyecto estructurado profesionalmente.

---

## Estructura del proyecto

```
santi-fighter/
│
├── index.html              ← Shell HTML: canvas + botones touch + estilos
├── package.json            ← Proyecto Node con scripts de build
├── vite.config.js          ← Configuración de build (Vite)
│
├── src/
│   ├── main.js             ← Punto de entrada: conecta todos los módulos
│   │
│   ├── engine/
│   │   ├── input.js        ← Teclado, touch, gamepads
│   │   ├── audio.js        ← Música BGM + SFX procedurales con Web Audio
│   │   └── physics.js      ← Gravedad, colisiones, knockback
│   │
│   ├── game/
│   │   └── ai.js           ← Inteligencia artificial del oponente
│   │
│   ├── characters/
│   │   ├── lino-o.js       ← Especial + fatality de LINO-O (el jefe)
│   │   ├── esgay.js        ← Especial + fatality de ESGAY
│   │   ├── carter.js       ← Especial + fatality de CARTER
│   │   ├── santi.js        ← Especial + fatality de SANTI
│   │   └── vazquez.js      ← Especial + fatality de VAZQUEZ
│   │
│   └── data/
│       ├── characters.json ← Stats por personaje: HP, daño, velocidad
│       ├── stages.json     ← Orden de peleas, música por pelea
│       └── moves.json      ← Alcance de ataques, duración, combos
│
├── assets/
│   └── audio/
│       ├── bgm1.mp3        ← Música batalla 1
│       ├── bgm2.mp3        ← Música batalla 2
│       ├── bgm3.mp3        ← Música batalla 3
│       └── bgm_boss.mp3    ← Música pelea final (LINO-O)
│
└── dist/
    └── index.html          ← Build final: todo embebido, listo para distribuir
```

---

## Cómo hacer cambios

### Cambiar HP o daño de un personaje
Editar `src/data/characters.json`:
```json
"CARTER": {
  "hp": 1100,
  "punchDamage": 60,
  "kickDamage": 75,
  "specialDamage": 120
}
```

### Cambiar el orden de las peleas
Editar `src/data/stages.json > fightOrder`:
```json
"fightOrder": [1, 4, 2, 3, 0]
```
Los números son los índices: 0=LINO-O, 1=ESGAY, 2=CARTER, 3=SANTI, 4=VAZQUEZ

### Cambiar la música
1. Reemplazar los archivos MP3 en `assets/audio/`
2. Los nombres en `stages.json > music.normal` deben coincidir con los archivos

### Cambiar los controles
Editar `src/engine/input.js > KEY_MAP`:
```js
const KEY_MAP = {
  ArrowLeft: 'l',   // mover izquierda
  KeyZ:      'p',   // punch
  // ... etc
};
```

### Cambiar el especial de un personaje
Editar el archivo del personaje en `src/characters/`:
```js
// src/characters/carter.js
export function doSpecial(P, specProjs, ...) {
  // Cambiar velocidad del proyectil:
  specProjs.push({ vx: dir * 480, dmg: 120, ... });
}
```

### Cambiar la dificultad de la IA
Editar `src/game/ai.js`:
```js
const BASE_AGGRESSION = 0.55;  // 0=muy fácil, 1=imposible
const AGGR_PER_FIGHT  = 0.07;  // escala por cada pelea
```

### Agregar un personaje nuevo
1. Crear `src/characters/nuevo.js` con `doSpecial()` y `doFatality()`
2. Agregar sus stats en `src/data/characters.json`
3. Importarlo en `src/main.js > CHARACTER_MODULES`
4. Agregarlo al array en `src/data/stages.json > fightOrder`

### Agregar un SFX nuevo
Editar `src/engine/audio.js > función snd()`:
```js
else if (name === 'miNuevoSonido') {
  osc(440, 'square', 0.1, 0.2);  // frecuencia, tipo, duración, volumen
}
```
Luego llamarlo con `snd('miNuevoSonido')` donde quieras.

### Ajustar la física
Editar `src/engine/physics.js`:
```js
export const GRAVITY = 1800;  // px/s² — más alto = caída más rápida
export const GROUND  = 370;   // px — posición del suelo desde arriba
```

---

## Desarrollo local

```bash
npm install     # instalar Vite
npm run dev     # servidor local en localhost:5173 con hot reload
```

## Build para distribuir

```bash
npm run build   # genera dist/index.html — todo embebido, un solo archivo
```

El archivo `dist/index.html` generado es auto-contenido (todos los assets en base64), listo para subir a cualquier hosting o compartir directamente.

---

## Controles por defecto

| Tecla        | Acción        |
|--------------|---------------|
| ← / A        | Mover izquierda |
| → / D        | Mover derecha  |
| ↑ / W        | Saltar (doble salto: presionar dos veces) |
| ↓ / S        | Agachar        |
| Z            | Puñetazo       |
| X            | Patada         |
| C            | Poder especial |
| V            | Bloquear       |

---

## Personajes

| # | Personaje | HP   | Especial            | Fatality             |
|---|-----------|------|---------------------|----------------------|
| 0 | LINO-O    | 1200 | Caballo (cruza pantalla) | Helicóptero explota |
| 1 | ESGAY     | 1000 | Lluvia de billetes  | Lluvia masiva de billetes |
| 2 | CARTER    | 1100 | Botella de whisky   | Whisky gigante + puro |
| 3 | SANTI     | 1050 | Misil               | Lluvia de misiles    |
| 4 | VAZQUEZ   | 950  | Bola de fuego       | Columna de fuego     |
