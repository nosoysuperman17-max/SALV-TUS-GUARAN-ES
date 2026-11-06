/**
 * lino-o.js — LINO-O: El Jefe Final
 *
 * Para modificar a LINO-O:
 *   - Stats base: editar characters.json > "LINO-O"
 *   - Especial (caballo): modificar doSpecial() abajo
 *   - Fatality (helicóptero): modificar doFatality() abajo
 *   - Sprite: reemplazar assets/sprites/lino-o.png (si se separa del HTML)
 *
 * El especial y la fatality de cada personaje están definidos aquí en código,
 * con sus parámetros configurables en characters.json.
 */

import { snd } from '../engine/audio.js';

// ─── Especial: Caballo ─────────────────────────────────────────────────────
/**
 * LINO-O lanza un caballo gigante que cruza toda la pantalla a alta velocidad.
 * El caballo está al nivel del suelo, corre desde un borde hasta el otro.
 * Si toca al oponente, lo stunea por 1 segundo.
 *
 * @param {object} P          — jugador (quien dispara el especial)
 * @param {object} specProjs  — array de proyectiles activos (se pushea aquí)
 * @param {object} assets     — objeto con assets preloadeados (assets.horse_img)
 * @param {number} GROUND     — posición Y del suelo
 * @param {function} setS     — función setS(fighter, estado)
 * @param {function} shake    — función para sacudir la cámara
 * @param {function} flash    — función specFlash(color, alpha)
 */
export function doSpecial(P, specProjs, assets, GROUND, setS, addShake, flash) {
  flash('#885500', 0.12);
  addShake(20);
  snd('punch');

  const hDir = P.face > 0 ? 1 : -1;

  // El caballo entra por el borde opuesto a donde mira el jugador
  specProjs.push({
    x:    hDir > 0 ? -80 : 900 + 80,
    y:    GROUND,         // pies en el suelo (y = ground)
    vx:   hDir * 700,     // velocidad: 700 px/s
    vy:   0,
    type: 'horse_img',
    t:    0,
    life: 2.0,            // desaparece a los 2 segundos
    dmg:  140,            // daño al impactar
    face: hDir,
    _hit: false,          // solo golpea una vez
  });

  setS(P, 'win'); // animación de victoria al lanzar
}

// ─── Fatality: Helicóptero ─────────────────────────────────────────────────
/**
 * LINO-O salta y desaparece de la pantalla.
 * Un helicóptero entra volando desde un borde, se dirige a la víctima,
 * y al chocar explota con un GIF de explosión gigante.
 *
 * @param {object} actor      — quien ejecuta la fatality (LINO-O)
 * @param {object} victim     — quien recibe la fatality
 * @param {object[]} fatParticles — array de partículas de fatality
 * @param {number[]} fatSeq   — secuencia de eventos de la fatality
 * @param {number} GROUND
 */
export function doFatality(actor, victim, fatParticles, fatSeq, GROUND) {
  snd('heli');

  // El helicóptero entra desde el lado contrario al actor
  const heliFromRight = actor.x < victim.x;
  const heliStartX    = heliFromRight ? 900 + 120 : -120;
  const heliVX        = heliFromRight ? -5.5 : 5.5;

  // Secuencia de animación de fatality
  fatSeq.length = 0;
  fatSeq.push(
    { t: 0.0, a: 'back_off' },
    { t: 0.4, a: 'jump_exit' },      // LINO-O salta y se oculta
    { t: 2.2, a: 'explosion_impact' },
    { t: 3.2, a: 'pose' },
  );

  // Helicóptero que vuela hacia la víctima
  fatParticles.push({
    x:        heliStartX,
    y:        80,
    vx:       heliVX,
    vy:       1.8,
    t:        0,
    delay:    0.8,          // empieza a moverse 0.8s después
    life:     6,
    type:     'heli_img',
    size:     160,
    _targetX: victim.x,
    _targetY: GROUND + victim.y - 80,
    _dead:    false,
  });

  // Explosión en el punto de impacto (se activa cuando el heli llega)
  fatParticles.push({
    x:     victim.x,
    y:     GROUND + victim.y - 80,
    vx:    0,
    vy:    0,
    t:     0,
    delay: 999,             // se activa por código cuando el heli impacta
    life:  2.5,
    type:  'explosion_real',
    size:  220,
    _dead: false,
  });
}
