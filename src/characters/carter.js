/**
 * carter.js — CARTER
 *
 * Para modificar a CARTER:
 *   - Stats: editar characters.json > "CARTER"
 *   - Especial (botella de whisky): modificar doSpecial() abajo
 *   - Fatality (whisky gigante + puro): modificar doFatality() abajo
 */

import { snd } from '../engine/audio.js';

// ─── Especial: Botella de Whisky ───────────────────────────────────────────
/**
 * CARTER lanza una botella de whisky que vuela hacia el oponente.
 * La botella es del mismo tamaño que la del power especial (size:150).
 */
export function doSpecial(P, specProjs, assets, GROUND, setS, addShake, flash) {
  flash('#aa5500', 0.10);
  addShake(15);
  snd('whisky');

  const dir = P.face > 0 ? 1 : -1;

  specProjs.push({
    x:    P.x + dir * 50,
    y:    P.y - 60,
    vx:   dir * 480,
    vy:   -80,
    type: 'whisky',
    t:    0,
    life: 1.5,
    dmg:  120,
    size: 150,          // tamaño grande, igual que en la fatality
    _hit: false,
  });

  setS(P, 'atk');
}

// ─── Fatality: Whisky gigante + Puro ──────────────────────────────────────
/**
 * CARTER hace aparecer una botella de whisky gigante que cae sobre la víctima,
 * seguida de un puro que completa el combo.
 */
export function doFatality(actor, victim, fatParticles, fatSeq, GROUND) {
  snd('whisky');

  fatSeq.length = 0;
  fatSeq.push(
    { t: 0.0, a: 'back_off' },
    { t: 0.5, a: 'taunt' },
    { t: 1.5, a: 'explosion_impact' },
    { t: 3.0, a: 'pose' },
  );

  // Botella de whisky gigante — cae desde arriba
  fatParticles.push({
    x:     victim.x,
    y:     -100,
    vx:    0,
    vy:    8,
    t:     0,
    delay: 0.8,
    life:  4,
    type:  'whisky',
    size:  150,       // mismo tamaño que el especial
    _hits: false,
    _big:  true,
  });

  // Puro — entra desde el costado
  fatParticles.push({
    x:     actor.x < victim.x ? -60 : 960,
    y:     victim.y - 40,
    vx:    actor.x < victim.x ? 6 : -6,
    vy:    0,
    t:     0,
    delay: 1.5,
    life:  3,
    type:  'puro',
    size:  80,        // grande y visible
    _hits: false,
  });
}
