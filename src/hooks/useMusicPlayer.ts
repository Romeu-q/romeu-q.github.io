/**
 * useMusicPlayer - lógica do player de música de fundo (sem UI).
 *
 * Princípios (o dono do site não quer nada que assuste o visitante):
 *  - Nunca toca sozinho: só depois de um clique explícito.
 *  - Entrada suave (fade-in) e saída suave (fade-out).
 *  - Se um vídeo do site começar a tocar (evento `portfolio:media-play`), a música pausa.
 *  - Se os arquivos .mp3 não existirem (ainda não baixados), tenta as outras faixas
 *    e, se todas falharem, avisa com calma e para.
 *  - Preferências (volume e faixa) ficam no localStorage; mesmo que o visitante tenha
 *    saído com a música ligada, ela NÃO volta a tocar sozinha.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { TRACKS } from '../data/playlist';

// ---------------------------------------------------------------------------
// Configuração
// ---------------------------------------------------------------------------
const STORAGE_KEY = 'romeu.music.v2';
const DEFAULT_VOLUME = 0.25; // baixo de propósito: ambiente, nunca protagonista
const FADE_IN_MS = 2500;
const FADE_OUT_MS = 600;
const MEDIA_PLAY_EVENT = 'portfolio:media-play';

type Prefs = { volume: number; track: number; wasPlaying: boolean };

/** Lê as preferências salvas; qualquer problema (storage bloqueado, JSON ruim) -> padrões. */
function loadPrefs(): Prefs {
  const prefs: Prefs = { volume: DEFAULT_VOLUME, track: 0, wasPlaying: false };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (saved && typeof saved === 'object') {
      if (Number.isFinite(saved.volume)) prefs.volume = Math.min(1, Math.max(0, saved.volume));
      if (Number.isInteger(saved.track) && saved.track >= 0 && saved.track < TRACKS.length) {
        prefs.track = saved.track;
      }
      if (typeof saved.wasPlaying === 'boolean') prefs.wasPlaying = saved.wasPlaying;
    }
  } catch {
    /* storage indisponível: seguimos com os padrões */
  }
  return prefs;
}

function savePrefs(prefs: Prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* modo privado / cota cheia: ignorar */
  }
}

export function useMusicPlayer() {
  // Lido uma única vez (inicializador preguiçoso do useState).
  const [initial] = useState(loadPrefs);

  const [volume, setVolumeState] = useState(initial.volume);
  const [trackIndex, setTrackIndex] = useState(initial.track);
  const [playing, setPlaying] = useState(false); // sempre começa desligado
  const [pausedByVideo, setPausedByVideo] = useState(false);
  const [allFailed, setAllFailed] = useState(false);

  // Refs: valores que os callbacks de áudio/rAF precisam ler "ao vivo", sem fechar sobre estado velho.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const volumeRef = useRef(initial.volume);
  const trackRef = useRef(initial.track);
  const playingRef = useRef(false);
  const failuresRef = useRef(0); // faixas seguidas que falharam
  const fadeRef = useRef(0); // id do requestAnimationFrame do fade em curso
  const loggedRef = useRef(false); // garante um único console.info

  // Persiste preferências quando algo muda.
  useEffect(() => {
    savePrefs({ volume, track: trackIndex, wasPlaying: playing });
  }, [volume, trackIndex, playing]);

  // -------------------------------------------------------------------------
  // Fade
  // -------------------------------------------------------------------------
  /**
   * Anima `audio.volume` até o alvo em `ms` milissegundos.
   *
   * Por que não usar um GainNode/Web Audio? Para só controlar volume, a propriedade
   * `audio.volume` basta e evita criar um AudioContext (que o navegador bloqueia até
   * haver gesto). Um fade manual com requestAnimationFrame fica suave (~60 passos/s),
   * pausa sozinho em aba em segundo plano e é fácil de cancelar.
   * `getTarget` é uma função para que mexer no slider durante o fade-in seja respeitado.
   */
  const fadeTo = useCallback((getTarget: () => number, ms: number, onDone?: () => void) => {
    const audio = audioRef.current;
    cancelAnimationFrame(fadeRef.current);
    if (!audio) return;
    const from = audio.volume;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / ms);
      audio.volume = Math.min(1, Math.max(0, from + (getTarget() - from) * p));
      if (p < 1) fadeRef.current = requestAnimationFrame(step);
      else onDone?.();
    };
    fadeRef.current = requestAnimationFrame(step);
  }, []);

  // -------------------------------------------------------------------------
  // Reprodução
  // -------------------------------------------------------------------------
  /** Carrega a faixa `index` e toca com fade-in. */
  const startTrack = useCallback(
    (index: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      cancelAnimationFrame(fadeRef.current);
      trackRef.current = index;
      setTrackIndex(index);
      audio.src = TRACKS[index].src;
      audio.volume = 0; // começa mudo; o fade sobe até o volume escolhido
      playingRef.current = true;
      setPlaying(true);
      setPausedByVideo(false);
      audio
        .play()
        .then(() => fadeTo(() => volumeRef.current, FADE_IN_MS))
        .catch((err: unknown) => {
          const name = (err as DOMException | undefined)?.name;
          if (name === 'AbortError') return; // trocamos de faixa no meio: normal
          if (name === 'NotAllowedError') {
            playingRef.current = false;
            setPlaying(false);
            return;
          }
          handleFileError(); // faixa inexistente / formato inválido
        });
    },
    // handleFileError é declarada logo abaixo e só usa refs/setters estáveis.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fadeTo],
  );

  /** Arquivo não carregou (ex.: 404): tenta a próxima; se todas falharem, desiste com calma. */
  const handleFileError = useCallback(() => {
    failuresRef.current += 1;
    if (failuresRef.current >= TRACKS.length) {
      playingRef.current = false;
      setPlaying(false);
      setAllFailed(true);
      if (!loggedRef.current) {
        loggedRef.current = true;
        console.info('[music] Nenhuma faixa encontrada em assets/music/ (veja LEIA-ME.md).');
      }
      return;
    }
    startTrack((trackRef.current + 1) % TRACKS.length);
  }, [startTrack]);

  /** Pausa com fade-out curto para não cortar o som de repente. */
  const pause = useCallback(() => {
    playingRef.current = false;
    setPlaying(false);
    const audio = audioRef.current;
    fadeTo(() => 0, FADE_OUT_MS, () => audio?.pause());
  }, [fadeTo]);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || allFailed) return;
    setPausedByVideo(false);
    if (audio.src && audio.paused === true && !audio.ended && audio.currentTime > 0) {
      // Retomar a faixa de onde parou.
      cancelAnimationFrame(fadeRef.current);
      audio.volume = 0;
      playingRef.current = true;
      setPlaying(true);
      audio
        .play()
        .then(() => fadeTo(() => volumeRef.current, FADE_IN_MS))
        .catch(() => handleFileError());
    } else {
      startTrack(trackRef.current);
    }
  }, [allFailed, fadeTo, handleFileError, startTrack]);

  const toggle = useCallback(() => (playingRef.current ? pause() : play()), [pause, play]);

  const next = useCallback(() => {
    startTrack((trackRef.current + 1) % TRACKS.length);
  }, [startTrack]);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.min(1, Math.max(0, v));
    volumeRef.current = clamped;
    setVolumeState(clamped);
    const audio = audioRef.current;
    // Durante um fade o próprio fade lê volumeRef; fora dele aplicamos direto.
    if (audio && playingRef.current) audio.volume = clamped;
  }, []);

  // -------------------------------------------------------------------------
  // Ciclo de vida: cria o <audio> e escuta eventos externos
  // -------------------------------------------------------------------------
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'none'; // não baixa nada até o visitante pedir
    audioRef.current = audio;

    const onEnded = () => startTrack((trackRef.current + 1) % TRACKS.length); // loop da playlist
    const onPlaying = () => {
      failuresRef.current = 0;
    };
    const onError = () => {
      // Só nos interessa erro de uma faixa que estávamos tentando tocar.
      if (playingRef.current) handleFileError();
    };
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('error', onError);

    // Um vídeo do site começou: abaixa a música em vez de competir com ele.
    const onMediaPlay = () => {
      if (!playingRef.current) return;
      pause();
      setPausedByVideo(true);
    };
    document.addEventListener(MEDIA_PLAY_EVENT, onMediaPlay);

    return () => {
      document.removeEventListener(MEDIA_PLAY_EVENT, onMediaPlay);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('error', onError);
      cancelAnimationFrame(fadeRef.current);
      audio.pause();
      audio.removeAttribute('src');
      audioRef.current = null;
    };
  }, [handleFileError, pause, startTrack]);

  return { volume, trackIndex, playing, pausedByVideo, allFailed, toggle, play, pause, next, setVolume };
}
