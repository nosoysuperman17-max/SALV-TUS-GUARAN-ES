/**
 * ai.js — Inteligencia artificial del oponente
 *
 * El AI opera en "modos":
 *   fight    — avanzar y atacar agresivamente (modo principal)
 *   retreat  — alejarse para recuperar distancia (raro, corta duración)
 *   special  — usar poder especial cuando está disponible
 *
 * Para ajustar la dificultad:
 *   - Cambiar BASE_AGGRESSION para hacer al enemigo más/menos agresivo
 *   - Cambiar AGGR_PER_FIGHT para escalar dificultad por pelea
 *   - Cambiar RETREAT_CHANCE para que el enemigo retroceda más/menos
 *   - Cambiar SPECIAL_COOLDOWN para que use el especial más/menos seguido
 *
 * Para agregar comportamiento nuevo:
 *   1. Agregar un nuevo modo al switch abajo
 *   2. Setear f._aiMode al nuevo modo con f._aiModeT como duración
 */

// ─── Configuración de dificultad ───────────────────────────────────────────
const BASE_AGGRESSION  = 0.55;  // 0 = pasivo, 1 = máximo agresivo
const AGGR_PER_FIGHT   = 0.07;  // incremento de agresividad por cada pelea
const AGGR_PER_LEVEL   = 0.09;  // incremento por nivel (parámetro L de ai())
const MAX_AGGRESSION   = 0.95;  // techo de agresividad
const RETREAT_CHANCE   = 0.08;  // probabilidad de retroceder (muy raro)
const SPECIAL_COOLDOWN = 2.5;   // segundos mínimos entre usos del especial

// ─── Distancias de combate ─────────────────────────────────────────────────
const ATTACK_RANGE  = 100;  // px — distancia para intentar atacar
const COMFORT_RANGE = 180;  // px — distancia "cómoda" de combate
const FAR_RANGE     = 300;  // px — muy lejos, correr hacia el jugador

/**
 * Correr frame de AI para un enemigo.
 * @param {object} f       — Fighter del enemigo
 * @param {object} o       — Fighter del oponente (jugador)
 * @param {number} L       — nivel de dificultad (0-1, generado externamente)
 * @param {number} fightIdx — índice de la pelea actual (0=primera, 4=jefe)
 * @param {number} dt      — delta time en segundos
 * @returns {object} I     — inputs simulados: { l, r, p, k, sp, u }
 */
export function runAI(f, o, L, fightIdx, dt) {
  const I = { l: false, r: false, p: false, k: false, sp: false, u: false };

  // Inicializar estado
  if (!f._aiMode)   f._aiMode  = 'fight';
  if (!f._aiModeT)  f._aiModeT = 0;
  if (!f._aiSpCd)   f._aiSpCd  = 0;

  // Calcular agresividad para esta pelea
  const aggr = Math.min(
    BASE_AGGRESSION + L * AGGR_PER_LEVEL + fightIdx * AGGR_PER_FIGHT,
    MAX_AGGRESSION
  );

  // Variables de combate
  f.at      -= dt;
  f._aiSpCd -= dt;
  const dx   = o.x - f.x;
  const dist = Math.abs(dx);
  const toO  = dx > 0 ? 'r' : 'l';  // dirección hacia el oponente
  const awO  = dx > 0 ? 'l' : 'r';  // dirección alejándose
  const hpPct = f.hp / f.mh;

  // ─── Cambio de modo ──────────────────────────────────────────────────────
  if (f._aiModeT <= 0) {
    // Usar especial si está disponible (prioridad alta)
    if (f._spReady && f._aiSpCd <= 0 && dist < COMFORT_RANGE) {
      f._aiMode  = 'special';
      f._aiModeT = 0.3;
    }
    // Retroceder ocasionalmente para no ser predecible
    else if (Math.random() < RETREAT_CHANCE * (1 - aggr) && dist < ATTACK_RANGE) {
      f._aiMode  = 'retreat';
      f._aiModeT = 0.4 + Math.random() * 0.3;
    }
    // Pelear por defecto
    else {
      f._aiMode  = 'fight';
      f._aiModeT = 0.3 + Math.random() * 0.4;
    }
  }

  f._aiModeT -= dt;

  // ─── Ejecutar modo ───────────────────────────────────────────────────────
  switch (f._aiMode) {

    case 'fight': {
      // Siempre mirar al oponente
      I[toO] = true;

      if (dist < ATTACK_RANGE) {
        // En rango — atacar
        if (f.at <= 0) {
          const roll = Math.random();
          if (roll < aggr * 0.6) {
            I.p = true;  // punch más común
          } else if (roll < aggr * 0.9) {
            I.k = true;  // kick
          }
          f.at = 0.18 + Math.random() * 0.15;
        }

        // Salto ocasional para sorprender
        if (Math.random() < 0.012 * aggr && f.onGround) {
          I.u = true;
        }
      }
      else if (dist < FAR_RANGE) {
        // Rango medio — avanzar y atacar si llega
        I[toO] = true;
        if (f.at <= 0 && dist < ATTACK_RANGE * 1.3) {
          if (Math.random() < aggr * 0.5) { I.k = true; f.at = 0.22; }
        }
      }
      else {
        // Muy lejos — correr hacia el jugador
        I[toO] = true;
        // Saltar si el jugador está en el aire (atacar en salto)
        if (!o.onGround && f.onGround && Math.random() < 0.04) {
          I.u = true;
        }
      }

      // Si tiene poca vida, volverse más agresivo (desesperación)
      if (hpPct < 0.25 && Math.random() < 0.2) {
        I[toO] = true;
        if (Math.random() < 0.5) I.p = true;
      }
      break;
    }

    case 'retreat': {
      // Retroceder brevemente
      I[awO] = true;
      break;
    }

    case 'special': {
      // Usar especial
      if (f._spReady) {
        I.sp       = true;
        f._aiSpCd  = SPECIAL_COOLDOWN;
        f._aiMode  = 'fight';
      }
      break;
    }
  }

  return I;
}
