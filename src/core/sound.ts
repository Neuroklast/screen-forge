const files = {
  click: "Button_simple_click_01.wav",
  type: "typing key press sound.wav",
  scroll: "Text_type_scroll_effect_01.wav",
  scroll2: "Text_type_scroll_effect_02.wav",
  newline: "temrinal output new line .wav",
  denied: "denied.wav",
  fail: "Code_fail_07.wav",
  load: "load.wav",
  openFolder: "open folder.wav",
  openProfile: "open profile loop till finished.wav",
  prompt: "prompt.wav",
  abort: "abort.wav",
  alert: "countdown alert.wav",
  beep: "COUNTDOWN BEEP.wav",
  hack1: "hack 01.wav",
  hack2: "hack 02.wav",
} as const;
export type SoundId = keyof typeof files;
let enabled = true;
const loops = new Map<SoundId, HTMLAudioElement>();
export function setSoundEnabled(on: boolean) {
  enabled = on;
  if (!on) stopLoop();
}
function src(id: SoundId) {
  return new URL(`../../sounds/${files[id]}`, import.meta.url).href;
}
export function playSound(id: SoundId) {
  if (!enabled) return;
  const audio = new Audio(src(id));
  audio.volume = 0.72;
  void audio.play().catch(() => {});
}
export function playLoop(id: SoundId) {
  if (!enabled) return;
  stopLoop(id);
  const audio = new Audio(src(id));
  audio.loop = true;
  audio.volume = 0.62;
  void audio.play().catch(() => {});
  loops.set(id, audio);
}
export function stopLoop(id?: SoundId) {
  const stop = (key: SoundId) => {
    const audio = loops.get(key);
    if (!audio) return;
    audio.pause();
    audio.src = "";
    loops.delete(key);
  };
  if (id) stop(id);
  else [...loops.keys()].forEach(stop);
}
