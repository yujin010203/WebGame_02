// js/audio.js
const FILES = {
  star: 'assets/audio/star.mp3',
  hit: 'assets/audio/hit.mp3',
  fever: 'assets/audio/fever.mp3',
  item: 'assets/audio/item.mp3',
};
const BGM = 'assets/audio/bgm.mp3';

class AudioManager {
  constructor() { this.buffers = {}; this.bgm = null; this.enabled = true; }

  load() {
    for (const [name, url] of Object.entries(FILES)) {
      const a = new Audio();
      a.src = url;
      a.preload = 'auto';
      a.addEventListener('error', () => { this.buffers[name] = null; }); // 파일 없으면 비활성
      this.buffers[name] = a;
    }
    this.bgm = new Audio();
    this.bgm.src = BGM;
    this.bgm.loop = true;
    this.bgm.volume = 0.4;
    this.bgm.addEventListener('error', () => { this.bgm = null; });
  }

  play(name) {
    const a = this.buffers[name];
    if (!a) return;
    try { const c = a.cloneNode(); c.volume = 0.6; c.play().catch(() => {}); } catch {}
  }

  startBgm() { if (this.bgm) this.bgm.play().catch(() => {}); }
  stopBgm() { if (this.bgm) { this.bgm.pause(); this.bgm.currentTime = 0; } }
}

export const audio = new AudioManager();
