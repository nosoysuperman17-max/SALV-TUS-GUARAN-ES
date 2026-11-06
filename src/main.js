/**
 * main.js — Punto de entrada del juego
 *
 * Este archivo conecta todos los módulos y arranca el game loop.
 * El juego real (lógica de pelea, renders, estados) está en santi-fighter-v6.html
 * embebido inline — este archivo es el NUEVO punto de entrada para el proyecto
 * refactorizado.
 *
 * ─── ARQUITECTURA ────────────────────────────────────────────────────────
 *
 *  main.js
 *    ├── engine/input.js      ← teclado, touch, gamepads
 *    ├── engine/audio.js      ← música BGM + SFX procedurales
 *    ├── engine/physics.js    ← gravedad, colisiones, knockback
 *    ├── game/ai.js           ← inteligencia artificial del oponente
 *    ├── characters/
 *    │   ├── lino-o.js        ← especial + fatality de LINO-O
 *    │   ├── esgay.js         ← especial + fatality de ESGAY
 *    │   ├── carter.js        ← especial + fatality de CARTER
 *    │   ├── santi.js         ← especial + fatality de SANTI
 *    │   └── vazquez.js       ← especial + fatality de VAZQUEZ
 *    └── data/
 *        ├── characters.json  ← stats: HP, daño, velocidad por personaje
 *        ├── stages.json      ← orden de peleas, música, escenarios
 *        └── moves.json       ← alcance de ataques, duración, combos
 *
 * ─── CÓMO HACER CAMBIOS COMUNES ──────────────────────────────────────────
 *
 *  Cambiar HP de un personaje:
 *    → src/data/characters.json > "LINO-O" > "hp"
 *
 *  Cambiar el daño del especial de CARTER:
 *    → src/data/characters.json > "CARTER" > "specialDamage"
 *    → O el comportamiento: src/characters/carter.js > doSpecial()
 *
 *  Cambiar el orden de las peleas:
 *    → src/data/stages.json > "fightOrder"
 *
 *  Cambiar la música de una pelea:
 *    → src/data/stages.json > "music" > "normal"
 *    → Reemplazar los archivos MP3 en assets/audio/
 *
 *  Agregar un nuevo SFX:
 *    → src/engine/audio.js > función snd() > agregar nuevo case
 *
 *  Agregar un nuevo personaje:
 *    1. Crear src/characters/nuevo-personaje.js
 *    2. Agregar sus stats en src/data/characters.json
 *    3. Agregar al array en src/data/stages.json > "fightOrder"
 *    4. Importarlo aquí abajo y agregarlo a CHARACTER_MODULES
 *
 *  Ajustar la dificultad de la IA:
 *    → src/game/ai.js > constantes BASE_AGGRESSION, AGGR_PER_FIGHT
 *
 *  Ajustar la física (gravedad, velocidad de salto):
 *    → src/engine/physics.js > constantes GRAVITY, FRICTION
 *
 *  Ajustar los controles:
 *    → src/engine/input.js > KEY_MAP
 *
 * ─── FLUJO DE JUEGO ──────────────────────────────────────────────────────
 *
 *  Splash (presionar Enter) →
 *  CharSelect (elegir personaje) →
 *  Fight Loop:
 *    Round Intro → Pelea → KO/Tiempo → Round Result
 *    Si ganaste 2 rounds → siguiente pelea (fi++)
 *    Si perdiste → Game Over
 *  FightEnd (animación de victoria/derrota) →
 *  Volver a Splash o CharSelect
 *
 * ─── BUILD ───────────────────────────────────────────────────────────────
 *
 *  Desarrollo: npm run dev     → localhost:5173 con hot reload
 *  Producción: npm run build   → genera dist/index.html (auto-contenido)
 *
 * NOTA: El HTML producido por `npm run build` embebe todos los assets
 * (audio MP3, sprites, etc.) en base64 — igual al santi-fighter-v6.html
 * que ya tenés, pero generado automáticamente desde el código fuente.
 */

import { initInput } from './engine/input.js';
import { initAudio, getBgmForFight, startBgMusic, stopBgMusic, snd } from './engine/audio.js';

// Importar módulos de personajes (especiales + fatalities)
import * as LinoO   from './characters/lino-o.js';
import * as Esgay   from './characters/esgay.js';
import * as Carter  from './characters/carter.js';
import * as Santi   from './characters/santi.js';
import * as Vazquez from './characters/vazquez.js';

// Mapa de módulos por índice de personaje
// Índice: 0=LINO-O, 1=ESGAY, 2=CARTER, 3=SANTI, 4=VAZQUEZ
export const CHARACTER_MODULES = [LinoO, Esgay, Carter, Santi, Vazquez];

// Importar datos de configuración
import stagesData     from './data/stages.json';
import charactersData from './data/characters.json';
import movesData      from './data/moves.json';

// ─── Inicialización ────────────────────────────────────────────────────────

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// Inicializar input (en el primer gesto se inicia audio también)
initInput();

// El juego principal sigue en el HTML embebido (santi-fighter-v6.html).
// Este archivo sirve como:
//   1. Documentación de la arquitectura
//   2. Módulos independientes listos para usar
//   3. Sistema de build para cuando se complete la separación
//
// Para completar la migración, el próximo paso sería mover el game loop
// desde el <script> del HTML a este archivo, usando los módulos de arriba.

console.log('SANTI FIGHTER — Módulos cargados');
console.log('  Personajes:', Object.keys(charactersData).filter(k => !k.startsWith('_')));
console.log('  Peleas:', stagesData.fightOrder.length);
console.log('  Música:', stagesData.music.normal.length, 'tracks normales + boss');
