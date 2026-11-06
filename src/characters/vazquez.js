/**
 * vazquez.js — VAZQUEZ
 *
 * Para modificar a VAZQUEZ:
 *   - Stats: editar characters.json > "VAZQUEZ"
 *   - Especial (fuego): modificar doSpecial() abajo
 *   - Fatality: modificar doFatality() abajo
 */

import { snd } from '../engine/audio.js';

export function doSpecial(P, specProjs, assets, GROUND, setS, addShake, flash) {
  flash('#ff4400', 0.12);
  addShake(16);
  snd('fire');

  const dir = P.face > 0 ? 1 : -1;

  // Bola de fuego que se expande
  specProjs.push({
    x:    P.x + dir * 40,
    y:    P.y - 60,
    vx:   dir * 350,
    vy:   0,
    type: 'fire',
    t:    0,
    life: 1.5,
    dmg:  100,
    _hit: false,
  });

  setS(P, 'atk');
}

export function doFatality(actor, victim, fatParticles, fatSeq, GROUND) {
  snd('fire');

  fatSeq.length = 0;
  fatSeq.push(
    { t: 0.0, a: 'back_off' },
    { t: 0.4, a: 'taunt' },
    { t: 1.0, a: 'explosion_impact' },
    { t: 2.5, a: 'pose' },
  );

  // Columna de fuego desde el suelo
  for (let i = 0; i < 12; i++) {
    fatParticles.push({
      x:     victim.x + (Math.random() - 0.5) * 120,
      y:     GROUND,
      vx:    (Math.random() - 0.5) * 80,
      vy:    -(6 + Math.random() * 5),
      t:     0,
      delay: i * 0.08,
      life:  2,
      type:  'fire',
      size:  60 + Math.random() * 40,
      _dead: false,
    });
  }
}
