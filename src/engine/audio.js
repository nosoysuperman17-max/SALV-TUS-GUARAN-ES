/**
 * audio.js — Sistema de audio: música de fondo + SFX procedurales
 *
 * BGM: archivos MP3 externos (assets/audio/)
 * SFX: generados en tiempo real con Web Audio API (sin archivos externos)
 *
 * Para agregar un SFX nuevo:
 *   1. Agregar un case en la función snd() abajo
 *   2. Usar osciladores, ruido blanco, o filtros para diseñar el sonido
 *   3. Llamarlo con snd('nombreNuevo') desde cualquier parte del juego
 *
 * Para cambiar la música:
 *   - Reemplazar los archivos MP3 en assets/audio/
 *   - O cambiar las rutas en stages.json > music
 */

// ─── Configuración de música ───────────────────────────────────────────────
// Rutas relativas a la raíz del proyecto (Vite las embebe al hacer build)
import bgm1Url from '../../assets/audio/bgm1.mp3';
import bgm2Url from '../../assets/audio/bgm2.mp3';
import bgm3Url from '../../assets/audio/bgm3.mp3';
import bgmBossUrl from '../../assets/audio/bgm_boss.mp3';

export const BGM_TRACKS = [bgm1Url, bgm2Url, bgm3Url];
export const BGM_BOSS   = bgmBossUrl;
export const BGM_VOLUME = 0.55;

// ─── Estado interno ────────────────────────────────────────────────────────
let AC  = null;    // AudioContext — se crea en el primer gesto del usuario
let bgAudio = null; // elemento Audio reutilizable (evita política de autoplay)

/**
 * Inicializar AudioContext. Llamar en el primer clic/tap del usuario.
 * Los navegadores modernos bloquean el audio hasta que haya un gesto.
 */
export function initAudio() {
  if (AC) return;
  try { AC = new AudioContext(); } catch(e) { console.warn('AudioContext no disponible', e); }
}

// ─── Música de fondo ────────────────────────────────────────────────────────

/**
 * Iniciar música de fondo.
 * @param {string} src — URL del track (de BGM_TRACKS o BGM_BOSS)
 */
export function startBgMusic(src) {
  if (!bgAudio) {
    bgAudio = new Audio();
    bgAudio.loop   = true;
    bgAudio.volume = BGM_VOLUME;
  }

  // Si ya es el mismo track y está sonando, no hacer nada
  if (bgAudio._src === src) {
    if (bgAudio.paused) {
      bgAudio.play().catch(() => {
        setTimeout(() => bgAudio && bgAudio.play().catch(() => {}), 300);
      });
    }
    return;
  }

  // Cambiar track
  bgAudio.pause();
  bgAudio.src         = src;
  bgAudio._src        = src;
  bgAudio.currentTime = 0;
  bgAudio.load();
  bgAudio.play().catch(() => {
    setTimeout(() => bgAudio && bgAudio.play().catch(() => {}), 300);
  });
}

/**
 * Pausar música de fondo (el elemento Audio se mantiene vivo para el próximo startBgMusic).
 */
export function stopBgMusic() {
  if (bgAudio) {
    bgAudio.pause();
    // NO ponemos bgAudio = null — lo reusamos para evitar bloqueos de autoplay
  }
}

/**
 * Obtener el track correcto para una pelea dada.
 * @param {number} fightIndex — índice de la pelea (0-based)
 * @param {boolean} isBoss — true si el oponente es LINO-O
 */
export function getBgmForFight(fightIndex, isBoss) {
  return isBoss ? BGM_BOSS : BGM_TRACKS[fightIndex % BGM_TRACKS.length];
}

// ─── SFX procedurales ──────────────────────────────────────────────────────
// Todos los sonidos se sintetizan en tiempo real con osciladores y ruido.
// Esto significa que NO hay archivos de sonido para efectos — solo código.
// Para diseñar un nuevo sonido, usá osc() y la API de AudioContext.

/**
 * Reproducir un efecto de sonido.
 * @param {string} name — nombre del efecto: 'punch', 'kick', 'hit', 'ko', 'fatality',
 *                        'whisky', 'fire', 'missile', 'heli', 'dizzy', 'fatbar', 'select'
 */
export function snd(name) {
  if (!AC) return;

  const dst = AC.destination;

  /** Crear oscilador simple */
  function osc(freq, type, duration, gain = 0.3) {
    const o  = AC.createOscillator();
    const gn = AC.createGain();
    o.type = type || 'square';
    o.frequency.value = freq;
    gn.gain.setValueAtTime(gain, AC.currentTime);
    gn.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + duration);
    o.connect(gn); gn.connect(dst);
    o.start(); o.stop(AC.currentTime + duration);
  }

  /** Crear buffer de ruido blanco */
  function noiseBuffer(seconds) {
    const len = Math.floor(AC.sampleRate * seconds);
    const buf = AC.createBuffer(1, len, AC.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  // ─── Sonidos ──────────────────────────────────────────────────────────────

  if (name === 'punch') {
    osc(180, 'square',   0.08, 0.25);
    osc(90,  'sawtooth', 0.12, 0.15);
  }

  else if (name === 'kick') {
    osc(80, 'sawtooth', 0.15, 0.30);
    osc(50, 'square',   0.20, 0.20);
  }

  else if (name === 'hit') {
    osc(300, 'square',   0.06, 0.20);
    osc(150, 'sawtooth', 0.10, 0.10);
  }

  else if (name === 'ko') {
    osc(220, 'square',   0.08, 0.30);
    osc(110, 'sawtooth', 0.20, 0.20);
    osc(80,  'sawtooth', 0.40, 0.15);
    osc(55,  'square',   0.60, 0.10);
  }

  else if (name === 'select') {
    osc(880, 'square', 0.05, 0.15);
    osc(1100,'square', 0.08, 0.10);
  }

  else if (name === 'dizzy') {
    // Pitido que sube y baja rápido
    [0, 0.1, 0.2, 0.3, 0.4].forEach((d, i) => {
      const o  = AC.createOscillator();
      const gn = AC.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(600 + (i % 2 === 0 ? 200 : -100), AC.currentTime + d);
      gn.gain.setValueAtTime(0.15, AC.currentTime + d);
      gn.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + d + 0.09);
      o.connect(gn); gn.connect(dst);
      o.start(AC.currentTime + d); o.stop(AC.currentTime + d + 0.1);
    });
  }

  else if (name === 'fatbar') {
    // Power-up — sonido ascendente
    osc(440, 'square', 0.1, 0.2);
    osc(660, 'square', 0.1, 0.15);
    osc(880, 'square', 0.1, 0.1);
  }

  else if (name === 'whisky') {
    // Golpe sordo + chapoteo
    osc(120, 'sawtooth', 0.3, 0.4);
    osc(60,  'square',   0.2, 0.3);
    const noise = AC.createBufferSource();
    noise.buffer = noiseBuffer(0.3);
    const filter = AC.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 400;
    const gainN = AC.createGain();
    gainN.gain.setValueAtTime(0.3, AC.currentTime);
    gainN.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + 0.3);
    noise.connect(filter); filter.connect(gainN); gainN.connect(dst);
    noise.start(); noise.stop(AC.currentTime + 0.3);
  }

  else if (name === 'fire') {
    // Ruido de fuego + crujido
    const noise = AC.createBufferSource();
    noise.buffer = noiseBuffer(0.8);
    const filter = AC.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = 1200;
    const gainN = AC.createGain();
    gainN.gain.setValueAtTime(0.5, AC.currentTime);
    gainN.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + 0.8);
    noise.connect(filter); filter.connect(gainN); gainN.connect(dst);
    noise.start(); noise.stop(AC.currentTime + 0.8);
    osc(80, 'sawtooth', 0.4, 0.3);
  }

  else if (name === 'missile') {
    // Silbido de misil
    const o  = AC.createOscillator();
    const gn = AC.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(2000, AC.currentTime);
    o.frequency.exponentialRampToValueAtTime(300, AC.currentTime + 0.6);
    gn.gain.setValueAtTime(0.3, AC.currentTime);
    gn.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + 0.6);
    o.connect(gn); gn.connect(dst);
    o.start(); o.stop(AC.currentTime + 0.6);
  }

  else if (name === 'heli') {
    // Rotor de helicóptero + explosión
    const noise = AC.createBufferSource();
    noise.buffer = noiseBuffer(2.5);
    const filter = AC.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 700;
    const gainN = AC.createGain();
    gainN.gain.setValueAtTime(1.0, AC.currentTime);
    gainN.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + 2.5);
    noise.connect(filter); filter.connect(gainN); gainN.connect(dst);
    noise.start(); noise.stop(AC.currentTime + 2.5);
    // sub-bass descendente
    [0, 0.07, 0.15].forEach((d, i) => {
      const b  = AC.createOscillator();
      const gn = AC.createGain();
      b.type = 'sawtooth';
      b.frequency.setValueAtTime([60, 50, 40][i], AC.currentTime + d);
      b.frequency.exponentialRampToValueAtTime([22, 18, 14][i], AC.currentTime + d + 1.8);
      gn.gain.setValueAtTime(0, AC.currentTime + d);
      gn.gain.linearRampToValueAtTime(0.5, AC.currentTime + d + 0.08);
      gn.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + d + 2.0);
      b.connect(gn); gn.connect(dst);
      b.start(AC.currentTime + d); b.stop(AC.currentTime + d + 2.0);
    });
  }

  else if (name === 'fatality') {
    // Trueno oscuro + sub-bajos
    const noise = AC.createBufferSource();
    const bufLen = Math.floor(AC.sampleRate * 2.5);
    const buf = AC.createBuffer(1, bufLen, AC.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufLen, 0.55);
    noise.buffer = buf;
    const nFilter = AC.createBiquadFilter();
    nFilter.type = 'lowpass'; nFilter.frequency.value = 700;
    const nGain = AC.createGain();
    nGain.gain.setValueAtTime(1.0, AC.currentTime);
    nGain.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + 2.5);
    noise.connect(nFilter); nFilter.connect(nGain); nGain.connect(dst);
    noise.start(); noise.stop(AC.currentTime + 2.5);
    [0, 0.07, 0.15].forEach((d, i) => {
      const b  = AC.createOscillator();
      const gn = AC.createGain();
      b.type = 'sawtooth';
      b.frequency.setValueAtTime([60, 50, 40][i], AC.currentTime + d);
      b.frequency.exponentialRampToValueAtTime([22, 18, 14][i], AC.currentTime + d + 1.8);
      gn.gain.setValueAtTime(0, AC.currentTime + d);
      gn.gain.linearRampToValueAtTime(0.5, AC.currentTime + d + 0.08);
      gn.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + d + 2.0);
      b.connect(gn); gn.connect(dst);
      b.start(AC.currentTime + d); b.stop(AC.currentTime + d + 2.0);
    });
  }

  else {
    console.warn(`[audio] SFX desconocido: "${name}"`);
  }
}
