/**
 * esgay.js — ESGAY
 *
 * Para modificar a ESGAY:
 *   - Stats: editar characters.json > "ESGAY"
 *   - Especial (lluvia de billetes): modificar doSpecial() abajo
 *   - Fatality: modificar doFatality() abajo
 */

import { snd } from '../engine/audio.js';

export function doSpecial(P, specProjs, assets, GROUND, setS, addShake, flash) {
  flash('#00aa55', 0.10);
  addShake(12);
  snd('punch');

  const dir = P.face > 0 ? 1 : -1;

  // Lluvia de billetes en abanico
  for (let i = 0; i < 6; i++) {
    const angle = (i - 2.5) * 0.18;
    specProjs.push({
      x:    P.x + dir * 30,
      y:    P.y - 80,
      vx:   dir * 400 * Math.cos(angle),
      vy:   -300 * Math.sin(angle) - 100,
      type: 'bill',
      t:    0,
      life: 1.2,
      dmg:  22,
      _hit: false,
    });
  }

  setS(P, 'atk');
}

export function doFatality(actor, victim, fatParticles, fatSeq, GROUND) {
  snd('fatality');

  fatSeq.length = 0;
  fatSeq.push(
    { t: 0.0, a: 'back_off' },
    { t: 0.6, a: 'taunt' },
    { t: 1.2, a: 'explosion_impact' },
    { t: 2.8, a: 'pose' },
  );

  // Lluvia masiva de billetes desde arriba
  for (let i = 0; i < 20; i++) {
    fatParticles.push({
      x:     victim.x + (Math.random() - 0.5) * 300,
      y:     -20 - Math.random() * 150,
      vx:    (Math.random() - 0.5) * 150,
      vy:    5 + Math.random() * 4,
      t:     0,
      delay: 0.5 + Math.random() * 0.8,
      life:  3,
      type:  'moneybag',
      size:  40 + Math.random() * 30,
      _dead: false,
    });
  }
}
