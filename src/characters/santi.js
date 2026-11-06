/**
 * santi.js — SANTI (el protagonista)
 *
 * Para modificar a SANTI:
 *   - Stats: editar characters.json > "SANTI"
 *   - Especial (misil): modificar doSpecial() abajo
 *   - Fatality: modificar doFatality() abajo
 */

import { snd } from '../engine/audio.js';

export function doSpecial(P, specProjs, assets, GROUND, setS, addShake, flash) {
  flash('#2244cc', 0.10);
  addShake(18);
  snd('missile');

  const dir = P.face > 0 ? 1 : -1;

  specProjs.push({
    x:    P.x + dir * 50,
    y:    P.y - 70,
    vx:   dir * 520,
    vy:   0,
    type: 'missile',
    t:    0,
    life: 1.8,
    dmg:  115,
    _hit: false,
  });

  setS(P, 'atk');
}

export function doFatality(actor, victim, fatParticles, fatSeq, GROUND) {
  snd('missile');

  fatSeq.length = 0;
  fatSeq.push(
    { t: 0.0, a: 'back_off' },
    { t: 0.5, a: 'taunt' },
    { t: 1.0, a: 'explosion_impact' },
    { t: 2.5, a: 'pose' },
  );

  // Lluvia de misiles
  for (let i = 0; i < 8; i++) {
    fatParticles.push({
      x:     victim.x + (Math.random() - 0.5) * 250,
      y:     -30 - i * 40,
      vx:    (Math.random() - 0.5) * 60,
      vy:    7 + Math.random() * 3,
      t:     0,
      delay: i * 0.15,
      life:  2.5,
      type:  'missile',
      size:  50,
      _dead: false,
    });
  }

  // Explosión central
  fatParticles.push({
    x:     victim.x,
    y:     victim.y,
    vx:    0, vy: 0, t: 0,
    delay: 1.2,
    life:  2,
    type:  'explosion_gif',
    size:  180,
    _dead: false,
  });
}
