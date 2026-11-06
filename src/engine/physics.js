/**
 * physics.js — Física del juego: gravedad, colisiones, movimiento
 *
 * Constantes del mundo:
 *   GRAVITY   — fuerza de gravedad (px/s²)
 *   GROUND    — posición Y del suelo (px desde arriba)
 *   WORLD_W   — ancho del canvas (px)
 *   WORLD_H   — alto del canvas (px)
 *   DT        — delta time por frame (segundos)
 *
 * Para ajustar la física:
 *   - Cambiar GRAVITY para más/menos gravedad
 *   - Cambiar GROUND para mover el piso
 *   - Cambiar FRICTION para más/menos deslizamiento en el piso
 */

// ─── Constantes del mundo ──────────────────────────────────────────────────
export const WORLD_W  = 900;    // ancho del canvas en px lógicos
export const WORLD_H  = 450;    // alto del canvas en px lógicos
export const GROUND   = 370;    // posición Y del suelo (pies del personaje)
export const GRAVITY  = 1800;   // px/s² — aumentar para caída más rápida
export const FRICTION = 0.75;   // factor de fricción al aterrizar (0-1)

// ─── Colisión entre luchadores ─────────────────────────────────────────────

/**
 * Radio de colisión para pushback entre personajes.
 * Si están más cerca que esto, se empujan.
 */
export const PUSH_RADIUS = 55;

/**
 * Aplicar pushback entre dos personajes (evitar que se superpongan).
 * @param {object} a — Fighter A
 * @param {object} b — Fighter B
 */
export function pushApart(a, b) {
  const dx   = b.x - a.x;
  const dist = Math.abs(dx);
  if (dist < PUSH_RADIUS && dist > 0) {
    const overlap = (PUSH_RADIUS - dist) / 2;
    const dir     = dx > 0 ? 1 : -1;
    a.x -= dir * overlap;
    b.x += dir * overlap;
    // Clamp al borde del mundo
    a.x = Math.max(40, Math.min(WORLD_W - 40, a.x));
    b.x = Math.max(40, Math.min(WORLD_W - 40, b.x));
  }
}

// ─── Aplicar física a un luchador ─────────────────────────────────────────

/**
 * Actualizar posición y velocidad de un Fighter por un frame.
 * @param {object} f   — Fighter
 * @param {number} dt  — delta time en segundos
 */
export function applyPhysics(f, dt) {
  // Gravedad
  if (!f.onGround) {
    f.vy += GRAVITY * dt;
  }

  // Mover
  f.x += f.vx * dt;
  f.y += f.vy * dt;

  // Clamp horizontal dentro del mundo
  f.x = Math.max(40, Math.min(WORLD_W - 40, f.x));

  // Colisión con el suelo
  if (f.y >= GROUND) {
    f.y       = GROUND;
    f.vy      = 0;
    f.vx     *= FRICTION;
    f.onGround = true;
    f._jumps  = 0; // resetear contador de saltos al aterrizar

    // Si vx es muy pequeño, pararlo
    if (Math.abs(f.vx) < 5) f.vx = 0;
  } else {
    f.onGround = false;
  }
}

// ─── Hitbox de ataque ─────────────────────────────────────────────────────

/**
 * Verificar si un ataque conecta con el objetivo.
 * @param {object} attacker  — quien ataca
 * @param {object} target    — quien recibe
 * @param {number} range     — alcance del ataque en px
 * @returns {boolean}
 */
export function attackHits(attacker, target, range) {
  const dx = Math.abs(target.x - attacker.x);
  const dy = Math.abs(target.y - attacker.y);

  // Mismo lado horizontal + dentro del alcance + misma "altura" aproximada
  const facingTarget = (attacker.face > 0) ? (target.x > attacker.x) : (target.x < attacker.x);
  return facingTarget && dx < range && dy < 80;
}

// ─── Knockback ────────────────────────────────────────────────────────────

/**
 * Aplicar knockback a un Fighter al recibir un golpe.
 * @param {object} target    — Fighter que recibe el golpe
 * @param {object} attacker  — Fighter que golpea (para dirección)
 * @param {number} force     — fuerza del knockback
 * @param {boolean} launch   — si true, lanzar hacia arriba también
 */
export function applyKnockback(target, attacker, force, launch = false) {
  const dir = attacker.x < target.x ? 1 : -1;
  target.vx = dir * force;
  if (launch) target.vy = -400;
}
