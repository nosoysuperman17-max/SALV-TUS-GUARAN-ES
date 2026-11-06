/**
 * input.js — Sistema de entrada: teclado + touch + gamepad
 *
 * Exporta dos objetos:
 *   K = teclas HELD (mantenidas): K.l, K.r, K.d, K.g (guard)
 *   T = teclas PULSE (un frame): T.p (punch), T.k (kick), T.sp (special), T.u (up/jump)
 *
 * Para agregar una nueva acción:
 *   1. Agregar la tecla en KEY_MAP abajo
 *   2. Manejarla en el game loop como K.nuevaAccion o T.nuevaAccion
 */

// ─── Mapeo de teclas ───────────────────────────────────────────────────────
// Cambiá estas teclas para remapear controles sin tocar el game loop
const KEY_MAP = {
  // Movimiento
  ArrowLeft:  'l',    // mover izquierda
  ArrowRight: 'r',    // mover derecha
  ArrowDown:  'd',    // agachar
  ArrowUp:    'u',    // saltar (también activa doble salto)
  KeyA:       'l',    // alternativo WASD
  KeyD:       'r',
  KeyS:       'd',
  KeyW:       'u',

  // Acciones
  KeyZ:       'p',    // punch (puñetazo)
  KeyX:       'k',    // kick (patada)
  KeyC:       'sp',   // special (poder especial)
  KeyV:       'g',    // guard (bloquear)

  // Pausa
  Escape:     'pause',
  KeyP:       'pause',
};

// ─── Estado interno ────────────────────────────────────────────────────────
export const K = { l:false, r:false, d:false, g:false }; // held
export const T = { p:false, k:false, sp:false, u:false }; // pulse (consumido por frame)

const _held = new Set(); // teclas físicas actualmente presionadas

// ─── Event listeners de teclado ────────────────────────────────────────────
export function initInput() {
  document.addEventListener('keydown', e => {
    const action = KEY_MAP[e.code];
    if (!action) return;
    e.preventDefault();

    if (_held.has(e.code)) return; // ya estaba presionada
    _held.add(e.code);

    // Held actions
    if (action === 'l')  K.l = true;
    if (action === 'r')  K.r = true;
    if (action === 'd')  K.d = true;
    if (action === 'g')  K.g = true;

    // Pulse actions (se activan una sola vez por keydown)
    if (action === 'p')  T.p  = true;
    if (action === 'k')  T.k  = true;
    if (action === 'sp') T.sp = true;
    if (action === 'u')  T.u  = true;
  });

  document.addEventListener('keyup', e => {
    const action = KEY_MAP[e.code];
    if (!action) return;
    _held.delete(e.code);

    if (action === 'l') K.l = false;
    if (action === 'r') K.r = false;
    if (action === 'd') K.d = false;
    if (action === 'g') K.g = false;
  });

  // ─── Touch controls (mobile) ─────────────────────────────────────────────
  // Los botones touch del HTML llaman estas funciones directamente
  // Ver index.html > sección de botones touch
}

/**
 * Consumir todos los pulsos al final de cada frame.
 * Llamar SIEMPRE al final del game loop, después de procesar inputs.
 */
export function flushPulses() {
  T.p  = false;
  T.k  = false;
  T.sp = false;
  T.u  = false;
}

// ─── API para botones touch ────────────────────────────────────────────────
// Estas funciones son llamadas por los event listeners touch del HTML

export function touchPress(action) {
  if (action === 'l')  K.l = true;
  if (action === 'r')  K.r = true;
  if (action === 'd')  K.d = true;
  if (action === 'g')  K.g = true;
  if (action === 'p')  T.p  = true;
  if (action === 'k')  T.k  = true;
  if (action === 'sp') T.sp = true;
  if (action === 'u')  T.u  = true;
}

export function touchRelease(action) {
  if (action === 'l') K.l = false;
  if (action === 'r') K.r = false;
  if (action === 'd') K.d = false;
  if (action === 'g') K.g = false;
}
