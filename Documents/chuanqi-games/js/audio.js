// js/audio.js - Sound effects system using Web Audio API

export class SoundManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.volume = 0.3;
        this.masterGain = null;
    }

    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = this.volume;
            this.masterGain.connect(this.ctx.destination);
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setVolume(v) {
        this.volume = v;
        if (this.masterGain) this.masterGain.gain.value = v;
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    _play(fn) {
        if (!this.enabled || !this.ctx) return;
        this.resume();
        fn(this.ctx, this.masterGain);
    }

    // --- UI Sounds ---

    click() {
        this._play((ctx, dest) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.08);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
            osc.connect(gain).connect(dest);
            osc.start(); osc.stop(ctx.currentTime + 0.08);
        });
    }

    hover() {
        this._play((ctx, dest) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, ctx.currentTime);
            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
            osc.connect(gain).connect(dest);
            osc.start(); osc.stop(ctx.currentTime + 0.04);
        });
    }

    // --- Tower Sounds ---

    placeTower() {
        this._play((ctx, dest) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523, ctx.currentTime); // C5
            osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1); // E5
            osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2); // G5
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
            osc.connect(gain).connect(dest);
            osc.start(); osc.stop(ctx.currentTime + 0.35);
        });
    }

    sellTower() {
        this._play((ctx, dest) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(400, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            osc.connect(gain).connect(dest);
            osc.start(); osc.stop(ctx.currentTime + 0.3);
        });
    }

    upgradeTower() {
        this._play((ctx, dest) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(400, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
            osc.connect(gain).connect(dest);
            osc.start(); osc.stop(ctx.currentTime + 0.25);
        });
    }

    // --- Weapon Shooting Sounds ---

    shoot(type) {
        this._play((ctx, dest) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const now = ctx.currentTime;

            switch (type) {
                case 'machinegun':
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(200, now);
                    osc.frequency.exponentialRampToValueAtTime(80, now + 0.05);
                    gain.gain.setValueAtTime(0.08, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                    osc.connect(gain).connect(dest);
                    osc.start(); osc.stop(now + 0.05);
                    break;

                case 'missile':
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(150, now);
                    osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
                    gain.gain.setValueAtTime(0.12, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                    osc.connect(gain).connect(dest);
                    osc.start(); osc.stop(now + 0.2);
                    break;

                case 'laser':
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(1200, now);
                    osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);
                    gain.gain.setValueAtTime(0.08, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                    osc.connect(gain).connect(dest);
                    osc.start(); osc.stop(now + 0.15);
                    break;

                case 'emp':
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(100, now);
                    osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
                    gain.gain.setValueAtTime(0.06, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                    osc.connect(gain).connect(dest);
                    osc.start(); osc.stop(now + 0.15);
                    break;

                case 'freeze':
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(2000, now);
                    osc.frequency.exponentialRampToValueAtTime(1500, now + 0.1);
                    gain.gain.setValueAtTime(0.06, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                    osc.connect(gain).connect(dest);
                    osc.start(); osc.stop(now + 0.1);
                    break;

                case 'sniper':
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(800, now);
                    osc.frequency.exponentialRampToValueAtTime(100, now + 0.25);
                    gain.gain.setValueAtTime(0.15, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                    osc.connect(gain).connect(dest);
                    osc.start(); osc.stop(now + 0.25);
                    break;

                default:
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(300, now);
                    gain.gain.setValueAtTime(0.05, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
                    osc.connect(gain).connect(dest);
                    osc.start(); osc.stop(now + 0.06);
            }
        });
    }

    // --- Explosion / Hit ---

    explosion() {
        this._play((ctx, dest) => {
            const bufferSize = ctx.sampleRate * 0.15;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
            }
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
            source.connect(gain).connect(dest);
            source.start();
        });
    }

    smallHit() {
        this._play((ctx, dest) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(300, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.06);
            gain.gain.setValueAtTime(0.06, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
            osc.connect(gain).connect(dest);
            osc.start(); osc.stop(ctx.currentTime + 0.06);
        });
    }

    splash() {
        this._play((ctx, dest) => {
            const bufferSize = ctx.sampleRate * 0.2;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2) * 0.8;
            }
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
            source.connect(gain).connect(dest);
            source.start();
        });
    }

    // --- Economy ---

    goldEarned() {
        this._play((ctx, dest) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1047, ctx.currentTime); // C6
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
            osc.connect(gain).connect(dest);
            osc.start(); osc.stop(ctx.currentTime + 0.15);

            setTimeout(() => {
                if (!this.enabled) return;
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(1319, ctx.currentTime); // E6
                gain2.gain.setValueAtTime(0.12, ctx.currentTime);
                gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
                osc2.connect(gain2).connect(dest);
                osc2.start(); osc2.stop(ctx.currentTime + 0.2);
            }, 120);
        });
    }

    goldSpent() {
        this._play((ctx, dest) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(500, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
            osc.connect(gain).connect(dest);
            osc.start(); osc.stop(ctx.currentTime + 0.1);
        });
    }

    // --- Life Lost ---

    lifeLost() {
        this._play((ctx, dest) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            osc.connect(gain).connect(dest);
            osc.start(); osc.stop(ctx.currentTime + 0.3);
        });
    }

    // --- Wave / Game ---

    waveStart() {
        this._play((ctx, dest) => {
            const times = [0, 0.15, 0.3, 0.45];
            times.forEach((t) => {
                setTimeout(() => {
                    if (!this.enabled) return;
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(t % 0.3 < 0.15 ? 600 : 800, ctx.currentTime);
                    gain.gain.setValueAtTime(0.08, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
                    osc.connect(gain).connect(dest);
                    osc.start(); osc.stop(ctx.currentTime + 0.12);
                }, t * 1000);
            });
        });
    }

    victory() {
        this._play((ctx, dest) => {
            const notes = [523, 659, 784, 1047];
            notes.forEach((freq, i) => {
                setTimeout(() => {
                    if (!this.enabled) return;
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, ctx.currentTime);
                    gain.gain.setValueAtTime(0.15, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
                    osc.connect(gain).connect(dest);
                    osc.start(); osc.stop(ctx.currentTime + 0.3);
                }, i * 150);
            });
        });
    }

    defeat() {
        this._play((ctx, dest) => {
            const notes = [784, 659, 523];
            notes.forEach((freq, i) => {
                setTimeout(() => {
                    if (!this.enabled) return;
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(freq, ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, ctx.currentTime + 0.4);
                    gain.gain.setValueAtTime(0.1, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
                    osc.connect(gain).connect(dest);
                    osc.start(); osc.stop(ctx.currentTime + 0.4);
                }, i * 200);
            });
        });
    }

    // --- Freeze / Slow effects ---

    freeze() {
        this._play((ctx, dest) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(2500, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
            osc.connect(gain).connect(dest);
            osc.start(); osc.stop(ctx.currentTime + 0.15);
        });
    }

    slow() {
        this._play((ctx, dest) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(150, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.04, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
            osc.connect(gain).connect(dest);
            osc.start(); osc.stop(ctx.currentTime + 0.1);
        });
    }

    // --- Boss ---

    bossAppear() {
        this._play((ctx, dest) => {
            const bufferSize = ctx.sampleRate * 0.5;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * 0.3 * (1 - i / bufferSize);
            }
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

            const osc = ctx.createOscillator();
            const oscGain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(60, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.5);
            oscGain.gain.setValueAtTime(0.1, ctx.currentTime);
            oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            osc.connect(oscGain).connect(dest);
            osc.start(); osc.stop(ctx.currentTime + 0.5);

            source.connect(gain).connect(dest);
            source.start();
        });
    }
}
