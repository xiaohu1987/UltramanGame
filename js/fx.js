/**
 * 街机夸张特效核心：粒子池 / 屏幕震动 / 闪光 / 飘字 / 程序化音效
 * 统一 API，供战斗与 UI 事件挂接
 */
(function () {
  const MAX_PARTICLES = 180;
  const MAX_FLOATS = 24;
  const MAX_BURSTS = 36;
  const MAX_SHAKE = 16;
  const LOW_FPS_THRESHOLD = 40;

  /** 事件 → 视觉 + 音效规格（街机夸张） */
  const FX_SPECS = {
    ui_click: {
      particles: 8,
      shake: 0,
      flash: 0.08,
      sfx: "click",
      priority: 1,
    },
    select: {
      particles: 14,
      shake: 0,
      flash: 0.1,
      sfx: "select",
      priority: 1,
    },
    battle_start: {
      particles: 48,
      shake: 4,
      flash: 0.35,
      sfx: "start",
      priority: 3,
    },
    hit: {
      particles: 22,
      shake: 5,
      flash: 0.22,
      sfx: "hit",
      priority: 2,
    },
    crit: {
      particles: 46,
      shake: 10,
      flash: 0.45,
      sfx: "crit",
      priority: 4,
    },
    heal: {
      particles: 20,
      shake: 1,
      flash: 0.12,
      sfx: "heal",
      priority: 2,
    },
    buff: {
      particles: 18,
      shake: 1,
      flash: 0.14,
      sfx: "buff",
      priority: 2,
    },
    debuff: {
      particles: 18,
      shake: 2,
      flash: 0.16,
      sfx: "debuff",
      priority: 2,
    },
    miss: {
      particles: 10,
      shake: 1,
      flash: 0.08,
      sfx: "click",
      priority: 1,
    },
    ko: {
      particles: 56,
      shake: 12,
      flash: 0.55,
      sfx: "ko",
      priority: 5,
    },
    combo: {
      particles: 28,
      shake: 6,
      flash: 0.28,
      sfx: "combo",
      priority: 3,
    },
    victory: {
      particles: 90,
      shake: 8,
      flash: 0.5,
      sfx: "victory",
      priority: 6,
    },
    defeat: {
      particles: 40,
      shake: 10,
      flash: 0.4,
      sfx: "defeat",
      priority: 6,
    },
  };

  const PALETTES = {
    hit: ["#ff6b7a", "#ffd166", "#ffffff", "#ff9aa5"],
    crit: ["#fff7c2", "#ff5d6c", "#63d2ff", "#ffffff", "#ffd166"],
    heal: ["#3ddc97", "#86efac", "#d7ffe8", "#ffffff"],
    buff: ["#2f9bff", "#63d2ff", "#9ad7ff", "#ffffff"],
    debuff: ["#ffd166", "#f59e0b", "#ff9f43", "#ffffff"],
    ko: ["#ff5d6c", "#ffffff", "#ffd166", "#7c4dff"],
    victory: ["#63d2ff", "#3ddc97", "#ffd166", "#ffffff", "#2f9bff"],
    defeat: ["#ff5d6c", "#9bb6d0", "#ffffff", "#7c4dff"],
    default: ["#63d2ff", "#ffffff", "#ffd166", "#2f9bff"],
  };

  class ArcadeFX {
    constructor() {
      this.root = null;
      this.particleLayer = null;
      this.floatLayer = null;
      this.flashLayer = null;
      this.comboHud = null;
      this.comboValueEl = null;
      this.shakeTarget = null;

      this.particles = [];
      this.floats = [];
      this.bursts = 0;
      this.shake = { x: 0, y: 0, time: 0, duration: 0, power: 0 };
      this.flash = { a: 0, color: "255,255,255" };
      this.combo = 0;
      this.comboTimer = 0;
      this.comboMaxWindow = 3200;
      this.hitStreak = 0;
      this.timeScale = 1;
      this.hitStop = 0;
      this.running = false;
      this.lastTs = 0;
      this.fps = 60;
      this.perfScale = 1;
      this.audioCtx = null;
      this.masterGain = null;
      this.muted = false;
      this.pendingSfx = [];
      this.rafId = 0;
      this.dirLayer = null;
      this.activeTrails = 0;
      this.maxActiveTrails = 8;
    }

    init(options = {}) {
      if (this.root) return this;

      this.shakeTarget = options.shakeTarget || document.getElementById("app") || document.body;

      this.root = document.createElement("div");
      this.root.id = "arcade-fx-root";
      this.root.setAttribute("aria-hidden", "true");
      this.root.innerHTML = `
        <div class="fx-flash-layer"></div>
        <canvas class="fx-particle-layer"></canvas>
        <div class="fx-dir-layer" aria-hidden="true"></div>
        <div class="fx-float-global"></div>
        <div class="fx-combo-hud" hidden>
          <div class="fx-combo-label">COMBO</div>
          <div class="fx-combo-value">0</div>
          <div class="fx-combo-bar"><span></span></div>
        </div>
      `;
      document.body.appendChild(this.root);

      this.flashLayer = this.root.querySelector(".fx-flash-layer");
      this.particleLayer = this.root.querySelector(".fx-particle-layer");
      this.dirLayer = this.root.querySelector(".fx-dir-layer");
      this.floatLayer = this.root.querySelector(".fx-float-global");
      this.comboHud = this.root.querySelector(".fx-combo-hud");
      this.comboValueEl = this.root.querySelector(".fx-combo-value");
      this.comboBarEl = this.root.querySelector(".fx-combo-bar span");

      this.resize();
      window.addEventListener("resize", () => this.resize());
      this.startLoop();
      return this;
    }

    resize() {
      if (!this.particleLayer) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.particleLayer.width = Math.floor(w * dpr);
      this.particleLayer.height = Math.floor(h * dpr);
      this.particleLayer.style.width = `${w}px`;
      this.particleLayer.style.height = `${h}px`;
      this.ctx = this.particleLayer.getContext("2d");
      if (this.ctx) this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    ensureAudio() {
      if (this.audioCtx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.audioCtx = new AC();
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.value = 0.22;
      this.masterGain.connect(this.audioCtx.destination);
    }

    unlockAudio() {
      this.ensureAudio();
      if (this.audioCtx && this.audioCtx.state === "suspended") {
        this.audioCtx.resume().catch(() => {});
      }
    }

    startLoop() {
      if (this.running) return;
      this.running = true;
      this.lastTs = performance.now();
      const tick = (ts) => {
        const rawDt = Math.min(0.05, (ts - this.lastTs) / 1000);
        this.lastTs = ts;
        this.fps = this.fps * 0.9 + (1 / Math.max(rawDt, 0.001)) * 0.1;
        this.perfScale = this.fps < LOW_FPS_THRESHOLD ? 0.55 : this.fps < 50 ? 0.75 : 1;

        let dt = rawDt;
        if (this.hitStop > 0) {
          this.hitStop -= rawDt;
          dt = rawDt * 0.15;
        }
        dt *= this.timeScale;

        this.update(dt);
        this.draw();
        this.rafId = requestAnimationFrame(tick);
      };
      this.rafId = requestAnimationFrame(tick);
    }

    update(dt) {
      // shake
      if (this.shake.time < this.shake.duration) {
        this.shake.time += dt * 1000;
        const t = 1 - this.shake.time / this.shake.duration;
        const p = this.shake.power * t * t;
        this.shake.x = (Math.random() * 2 - 1) * p;
        this.shake.y = (Math.random() * 2 - 1) * p;
      } else {
        this.shake.x = 0;
        this.shake.y = 0;
      }
      if (this.shakeTarget) {
        this.shakeTarget.style.transform = `translate(${this.shake.x.toFixed(2)}px, ${this.shake.y.toFixed(2)}px)`;
      }

      // flash decay
      if (this.flash.a > 0) {
        this.flash.a = Math.max(0, this.flash.a - dt * 1.8);
        if (this.flashLayer) {
          this.flashLayer.style.opacity = String(this.flash.a);
          this.flashLayer.style.background = `rgba(${this.flash.color}, ${Math.min(1, this.flash.a)})`;
        }
      }

      // particles
      for (let i = this.particles.length - 1; i >= 0; i -= 1) {
        const p = this.particles[i];
        p.life -= dt;
        if (p.life <= 0) {
          this.particles.splice(i, 1);
          continue;
        }
        p.vy += p.gravity * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 1 - 1.5 * dt;
        p.vy *= 1 - 0.4 * dt;
        p.rotation += p.spin * dt;
      }

      // combo window
      if (this.combo > 0) {
        this.comboTimer -= dt * 1000;
        if (this.comboTimer <= 0) {
          this.combo = 0;
          this.hitStreak = 0;
          this.hideCombo();
        } else if (this.comboBarEl) {
          const pct = Math.max(0, Math.min(1, this.comboTimer / this.comboMaxWindow));
          this.comboBarEl.style.width = `${pct * 100}%`;
        }
      }
    }

    draw() {
      if (!this.ctx || !this.particleLayer) return;
      const w = this.particleLayer.clientWidth;
      const h = this.particleLayer.clientHeight;
      this.ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < this.particles.length; i += 1) {
        const p = this.particles[i];
        const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.rotation);
        this.ctx.globalAlpha = alpha;
        this.ctx.fillStyle = p.color;
        if (p.shape === "rect") {
          this.ctx.fillRect(-p.size * 0.5, -p.size * 0.2, p.size, p.size * 0.4);
        } else if (p.shape === "star") {
          this.ctx.beginPath();
          this.ctx.moveTo(0, -p.size);
          this.ctx.lineTo(p.size * 0.3, -p.size * 0.3);
          this.ctx.lineTo(p.size, 0);
          this.ctx.lineTo(p.size * 0.3, p.size * 0.3);
          this.ctx.lineTo(0, p.size);
          this.ctx.lineTo(-p.size * 0.3, p.size * 0.3);
          this.ctx.lineTo(-p.size, 0);
          this.ctx.lineTo(-p.size * 0.3, -p.size * 0.3);
          this.ctx.closePath();
          this.ctx.fill();
        } else {
          this.ctx.beginPath();
          this.ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          this.ctx.fill();
        }
        if (p.glow) {
          this.ctx.globalAlpha = alpha * 0.35;
          this.ctx.beginPath();
          this.ctx.arc(0, 0, p.size * 2.2, 0, Math.PI * 2);
          this.ctx.fill();
        }
        this.ctx.restore();
      }
    }

    getAnchorRect(uid) {
      if (!uid) return null;
      // Prefer center actor portrait so skill FX launch from the middle image.
      const centerAvatar = document.querySelector(
        `.current-actor-card[data-uid="${uid}"] .current-actor-avatar, .current-actor-card[data-fx-actor="${uid}"] .current-actor-avatar`
      );
      if (centerAvatar) return centerAvatar.getBoundingClientRect();

      const centerCard = document.querySelector(
        `.current-actor-card[data-uid="${uid}"], .current-actor-card[data-fx-actor="${uid}"]`
      );
      if (centerCard) return centerCard.getBoundingClientRect();

      const el = document.querySelector(`.fighter-card[data-uid="${uid}"]`);
      if (!el) return null;
      return el.getBoundingClientRect();
    }

    centerOf(uid, fallback = null) {
      const rect = this.getAnchorRect(uid);
      if (rect) {
        const isCenter = !!document.querySelector(
          `.current-actor-card[data-uid="${uid}"], .current-actor-card[data-fx-actor="${uid}"]`
        );
        const yRatio = isCenter ? 0.5 : 0.42;
        return { x: rect.left + rect.width * 0.5, y: rect.top + rect.height * yRatio };
      }
      if (fallback) return fallback;
      return { x: window.innerWidth * 0.5, y: window.innerHeight * 0.42 };
    }

    spawnParticles(x, y, count, paletteKey = "default", power = 1) {
      const colors = PALETTES[paletteKey] || PALETTES.default;
      const scaled = Math.max(1, Math.round(count * this.perfScale * power));
      const room = Math.max(0, MAX_PARTICLES - this.particles.length);
      const n = Math.min(scaled, room);
      for (let i = 0; i < n; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (80 + Math.random() * 280) * (0.7 + power * 0.5);
        const size = 2 + Math.random() * 5 * power;
        const life = 0.35 + Math.random() * 0.55;
        const shapeRoll = Math.random();
        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 40,
          size,
          color: colors[i % colors.length],
          life,
          maxLife: life,
          gravity: 220 + Math.random() * 180,
          rotation: Math.random() * Math.PI,
          spin: (Math.random() * 2 - 1) * 8,
          shape: shapeRoll > 0.78 ? "star" : shapeRoll > 0.45 ? "rect" : "circle",
          glow: Math.random() > 0.4,
        });
      }
    }

    shakeScreen(power = 6, duration = 280) {
      const p = Math.min(MAX_SHAKE, power * (0.7 + this.perfScale * 0.3));
      if (p >= this.shake.power * (1 - this.shake.time / Math.max(1, this.shake.duration))) {
        this.shake.power = p;
        this.shake.duration = duration;
        this.shake.time = 0;
      }
    }

    flashScreen(amount = 0.25, color = "255,255,255") {
      this.flash.a = Math.max(this.flash.a, Math.min(0.75, amount));
      this.flash.color = color;
      if (this.flashLayer) {
        this.flashLayer.style.opacity = String(this.flash.a);
        this.flashLayer.style.background = `rgba(${color}, ${this.flash.a})`;
      }
    }

    hitStopFor(ms = 60) {
      this.hitStop = Math.max(this.hitStop, ms / 1000);
    }

    showFloatGlobal(text, kind, x, y, scale = 1) {
      if (!this.floatLayer) return;
      while (this.floatLayer.childElementCount >= MAX_FLOATS) {
        this.floatLayer.firstElementChild.remove();
      }
      const node = document.createElement("div");
      node.className = `fx-float-text ${kind}`;
      node.textContent = text;
      node.style.left = `${x}px`;
      node.style.top = `${y}px`;
      node.style.setProperty("--fx-scale", String(scale));
      this.floatLayer.appendChild(node);
      setTimeout(() => node.remove(), 1100);
    }

    showCombo(value) {
      if (!this.comboHud || !this.comboValueEl) return;
      this.comboHud.hidden = false;
      this.comboHud.classList.remove("pop");
      void this.comboHud.offsetWidth;
      this.comboHud.classList.add("pop");
      this.comboValueEl.textContent = String(value);
      if (value >= 5) this.comboHud.classList.add("hot");
      else this.comboHud.classList.remove("hot");
      if (this.comboBarEl) this.comboBarEl.style.width = "100%";
    }

    hideCombo() {
      if (!this.comboHud) return;
      this.comboHud.hidden = true;
      this.comboHud.classList.remove("hot", "pop");
    }

    pulseDom(el, className, duration = 520) {
      if (!el) return;
      el.classList.remove(className);
      void el.offsetWidth;
      el.classList.add(className);
      setTimeout(() => el.classList.remove(className), duration);
    }

    spawnBurstOn(uid, kind) {
      // Prefer center actor FX layer for cast bursts.
      const layer =
        document.querySelector(`[data-fx-center="${uid}"]`) ||
        document.querySelector(`[data-fx="${uid}"]`);
      if (!layer) return;
      if (this.bursts >= MAX_BURSTS) {
        if (layer.firstElementChild) layer.firstElementChild.remove();
        this.bursts = Math.max(0, this.bursts - 1);
      }
      const burst = document.createElement("span");
      burst.className = `fx-burst ${kind}`;
      layer.appendChild(burst);
      this.bursts += 1;
      setTimeout(() => {
        burst.remove();
        this.bursts = Math.max(0, this.bursts - 1);
      }, 750);
    }

    playTone({ freq = 440, dur = 0.08, type = "square", gain = 0.2, slide = 0, delay = 0 }) {
      if (this.muted) return;
      this.ensureAudio();
      if (!this.audioCtx || !this.masterGain) return;
      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume().catch(() => {});
      }
      const t0 = this.audioCtx.currentTime + delay;
      const osc = this.audioCtx.createOscillator();
      const g = this.audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slide) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
      }
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    }

    playNoise({ dur = 0.08, gain = 0.12, delay = 0 }) {
      if (this.muted) return;
      this.ensureAudio();
      if (!this.audioCtx || !this.masterGain) return;
      const t0 = this.audioCtx.currentTime + delay;
      const len = Math.floor(this.audioCtx.sampleRate * dur);
      const buffer = this.audioCtx.createBuffer(1, len, this.audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i += 1) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      }
      const src = this.audioCtx.createBufferSource();
      const g = this.audioCtx.createGain();
      const filter = this.audioCtx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 1200;
      src.buffer = buffer;
      g.gain.setValueAtTime(gain, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(filter);
      filter.connect(g);
      g.connect(this.masterGain);
      src.start(t0);
      src.stop(t0 + dur + 0.02);
    }

    sfx(name, intensity = 1) {
      const i = Math.max(0.5, Math.min(2, intensity));
      switch (name) {
        case "click":
          this.playTone({ freq: 720, dur: 0.04, type: "triangle", gain: 0.08 * i });
          break;
        case "select":
          this.playTone({ freq: 520, dur: 0.06, type: "square", gain: 0.1 * i, slide: 180 });
          this.playTone({ freq: 780, dur: 0.05, type: "triangle", gain: 0.06 * i, delay: 0.03 });
          break;
        case "start":
          this.playTone({ freq: 220, dur: 0.12, type: "sawtooth", gain: 0.12 * i, slide: 260 });
          this.playTone({ freq: 440, dur: 0.14, type: "square", gain: 0.1 * i, delay: 0.08, slide: 220 });
          this.playTone({ freq: 880, dur: 0.16, type: "triangle", gain: 0.08 * i, delay: 0.16 });
          break;
        case "hit":
          this.playNoise({ dur: 0.05, gain: 0.1 * i });
          this.playTone({ freq: 180 + 40 * i, dur: 0.07, type: "square", gain: 0.14 * i, slide: -80 });
          break;
        case "crit":
          this.playNoise({ dur: 0.08, gain: 0.16 * i });
          this.playTone({ freq: 140, dur: 0.1, type: "sawtooth", gain: 0.16 * i, slide: -60 });
          this.playTone({ freq: 660, dur: 0.12, type: "square", gain: 0.12 * i, delay: 0.03, slide: 300 });
          this.playTone({ freq: 990, dur: 0.1, type: "triangle", gain: 0.08 * i, delay: 0.08 });
          break;
        case "heal":
          this.playTone({ freq: 520, dur: 0.08, type: "sine", gain: 0.1 * i, slide: 120 });
          this.playTone({ freq: 780, dur: 0.1, type: "triangle", gain: 0.08 * i, delay: 0.05, slide: 160 });
          break;
        case "buff":
          this.playTone({ freq: 360, dur: 0.08, type: "triangle", gain: 0.1 * i, slide: 200 });
          this.playTone({ freq: 540, dur: 0.1, type: "sine", gain: 0.08 * i, delay: 0.04, slide: 240 });
          break;
        case "debuff":
          this.playTone({ freq: 300, dur: 0.1, type: "sawtooth", gain: 0.1 * i, slide: -140 });
          this.playTone({ freq: 180, dur: 0.12, type: "square", gain: 0.08 * i, delay: 0.04, slide: -80 });
          break;
        case "ko":
          this.playNoise({ dur: 0.12, gain: 0.18 * i });
          this.playTone({ freq: 120, dur: 0.18, type: "sawtooth", gain: 0.16 * i, slide: -70 });
          this.playTone({ freq: 90, dur: 0.22, type: "square", gain: 0.12 * i, delay: 0.05, slide: -40 });
          break;
        case "combo":
          this.playTone({
            freq: 480 + Math.min(10, this.combo) * 36,
            dur: 0.07,
            type: "square",
            gain: 0.1 * i,
            slide: 120,
          });
          break;
        case "victory":
          [523, 659, 784, 1046].forEach((f, idx) => {
            this.playTone({ freq: f, dur: 0.14, type: "triangle", gain: 0.1 * i, delay: idx * 0.08 });
          });
          break;
        case "defeat":
          this.playTone({ freq: 300, dur: 0.16, type: "sawtooth", gain: 0.12 * i, slide: -120 });
          this.playTone({ freq: 180, dur: 0.22, type: "square", gain: 0.1 * i, delay: 0.1, slide: -80 });
          break;
        default:
          this.playTone({ freq: 440, dur: 0.06, type: "triangle", gain: 0.08 * i });
      }
    }

    registerCombo(isHit) {
      if (!isHit) {
        // 非伤害不打断，但也不增加
        return this.combo;
      }
      this.combo += 1;
      this.hitStreak += 1;
      this.comboTimer = this.comboMaxWindow;
      this.showCombo(this.combo);
      if (this.combo >= 2) {
        this.sfx("combo", 0.8 + Math.min(1.2, this.combo * 0.08));
      }
      return this.combo;
    }

    resetCombo() {
      this.combo = 0;
      this.hitStreak = 0;
      this.comboTimer = 0;
      this.hideCombo();
    }

    /**
     * 统一事件触发
     * @param {string} eventName
     * @param {object} opts
     */
    trigger(eventName, opts = {}) {
      this.init();
      this.unlockAudio();
      const spec = FX_SPECS[eventName] || FX_SPECS.hit;
      const power = opts.power || 1;
      const pos = opts.x != null && opts.y != null
        ? { x: opts.x, y: opts.y }
        : this.centerOf(opts.uid, { x: window.innerWidth / 2, y: window.innerHeight / 2 });

      const palette = opts.palette || eventName;
      this.spawnParticles(pos.x, pos.y, Math.round(spec.particles * power), palette, power);
      if (spec.shake) this.shakeScreen(spec.shake * power, 220 + 80 * power);
      if (spec.flash) {
        const color =
          eventName === "heal"
            ? "61,220,151"
            : eventName === "buff"
              ? "47,155,255"
              : eventName === "debuff"
                ? "255,209,102"
                : eventName === "victory"
                  ? "99,210,255"
                  : "255,255,255";
        this.flashScreen(spec.flash * Math.min(1.2, power), color);
      }
      if (spec.sfx) this.sfx(spec.sfx, power);
      return spec;
    }


    ensureDirLayer() {
      this.init();
      if (!this.dirLayer && this.root) {
        this.dirLayer = this.root.querySelector(".fx-dir-layer");
      }
      return this.dirLayer;
    }

    trackTrailNode(node, ttl = 420) {
      if (!node) return;
      this.activeTrails += 1;
      const cleanup = () => {
        if (!node.isConnected) return;
        node.remove();
        this.activeTrails = Math.max(0, this.activeTrails - 1);
      };
      node.addEventListener("animationend", cleanup, { once: true });
      setTimeout(cleanup, ttl);
    }

    canSpawnTrail() {
      return this.activeTrails < this.maxActiveTrails;
    }

    spawnPathParticles(from, to, count, paletteKey, power = 1, mode = "neutral") {
      if (!from || !to) return;
      const colors = PALETTES[paletteKey] || PALETTES.default;
      const n = Math.max(1, Math.round(count * this.perfScale * Math.max(0.6, power)));
      const room = Math.max(0, MAX_PARTICLES - this.particles.length);
      const total = Math.min(n, room);
      for (let i = 0; i < total; i += 1) {
        const t = (i + 0.35) / Math.max(1, total);
        const x = from.x + (to.x - from.x) * t + (Math.random() * 10 - 5);
        const y = from.y + (to.y - from.y) * t + (Math.random() * 10 - 5);
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const len = Math.max(1, Math.hypot(dx, dy));
        const nx = dx / len;
        const ny = dy / len;
        let vx = nx * (40 + Math.random() * 90) * power;
        let vy = ny * (40 + Math.random() * 90) * power;
        let gravity = 40;
        if (mode === "buff") {
          vx *= 0.35;
          vy = -80 - Math.random() * 90;
          gravity = -30;
        } else if (mode === "debuff") {
          vx *= 0.4;
          vy = 70 + Math.random() * 80;
          gravity = 180;
        } else if (mode === "heal") {
          vx *= 0.45;
          vy = -20 - Math.random() * 40;
          gravity = -10;
        }
        this.particles.push({
          x,
          y,
          vx,
          vy,
          size: 2 + Math.random() * 3.5 * power,
          color: colors[i % colors.length],
          life: 0.28 + Math.random() * 0.28,
          maxLife: 0.45,
          gravity,
          rotation: Math.random() * Math.PI,
          spin: (Math.random() * 2 - 1) * 6,
          shape: Math.random() > 0.7 ? "star" : "circle",
          glow: true,
        });
      }
    }

    /**
     * 指向性光线/射线：actor → target
     */
    castBeam(from, to, opts = {}) {
      const layer = this.ensureDirLayer();
      if (!layer || !from || !to || !this.canSpawnTrail()) return null;
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const dist = Math.max(8, Math.hypot(dx, dy));
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      const crit = !!opts.crit;
      const power = Math.max(0.8, Math.min(1.8, opts.power || 1));
      const width = Math.round((crit ? 12 : 8) * (0.85 + power * 0.2) * this.perfScale);
      const duration = Math.max(110, Math.min(180, opts.duration || 140));

      const beam = document.createElement("div");
      beam.className = `fx-dir-beam${crit ? " crit" : ""}`;
      beam.style.left = `${from.x}px`;
      beam.style.top = `${from.y}px`;
      beam.style.width = `${dist}px`;
      beam.style.height = `${width}px`;
      beam.style.setProperty("--beam-rot", `${angle}deg`);
      beam.style.setProperty("--beam-dur", `${duration}ms`);
      beam.innerHTML = '<span class="fx-dir-beam-core"></span><span class="fx-dir-beam-glow"></span><span class="fx-dir-beam-spark"></span>';
      layer.appendChild(beam);
      this.trackTrailNode(beam, duration + 220);
      this.spawnPathParticles(from, to, Math.round(12 * power), crit ? "crit" : "default", power, "beam");
      return beam;
    }

    /**
     * 治疗雾团：actor → target（self 则原地扩散）
     */
    castMist(from, to, opts = {}) {
      const layer = this.ensureDirLayer();
      if (!layer || !to || !this.canSpawnTrail()) return null;
      const start = from || to;
      const same = !from || (Math.hypot(to.x - start.x, to.y - start.y) < 8);
      const power = Math.max(0.8, Math.min(1.6, opts.power || 1));
      const size = Math.round((28 + power * 10) * this.perfScale);
      const duration = same ? 160 : Math.max(140, Math.min(220, opts.duration || 180));
      const mist = document.createElement("div");
      mist.className = `fx-dir-mist${same ? " local" : ""}`;
      mist.style.left = `${start.x}px`;
      mist.style.top = `${start.y}px`;
      mist.style.width = `${size}px`;
      mist.style.height = `${size}px`;
      mist.style.setProperty("--mist-dur", `${duration}ms`);
      if (!same) {
        mist.style.setProperty("--mist-dx", `${to.x - start.x}px`);
        mist.style.setProperty("--mist-dy", `${to.y - start.y}px`);
      }
      layer.appendChild(mist);
      this.trackTrailNode(mist, duration + 240);
      this.spawnPathParticles(start, to, Math.round(14 * power), "heal", power, "heal");
      return mist;
    }

    /**
     * buff/debuff 轨迹粒子 + 光带
     */
    castAuraTrail(from, to, kind = "buff", opts = {}) {
      const layer = this.ensureDirLayer();
      if (!layer || !to || !this.canSpawnTrail()) return null;
      const start = from || to;
      const same = !from || (Math.hypot(to.x - start.x, to.y - start.y) < 8);
      const power = Math.max(0.8, Math.min(1.5, opts.power || 1));
      const duration = same ? 140 : Math.max(130, Math.min(200, opts.duration || 160));
      const trail = document.createElement("div");
      trail.className = `fx-dir-trail ${kind}${same ? " local" : ""}`;
      trail.style.left = `${start.x}px`;
      trail.style.top = `${start.y}px`;
      trail.style.setProperty("--trail-dur", `${duration}ms`);
      if (!same) {
        trail.style.setProperty("--trail-dx", `${to.x - start.x}px`);
        trail.style.setProperty("--trail-dy", `${to.y - start.y}px`);
      }
      layer.appendChild(trail);
      this.trackTrailNode(trail, duration + 220);
      this.spawnPathParticles(start, to, Math.round(14 * power), kind === "debuff" ? "debuff" : "buff", power, kind);
      return trail;
    }

    /**
     * 按 skillType 分发指向性特效，返回命中延迟 ms
     */
    playDirectionalFx(result) {
      if (!result) return 0;
      const from = result.actorUid ? this.centerOf(result.actorUid) : null;
      const to = result.targetUid ? this.centerOf(result.targetUid) : null;
      if (!to) return 0;

      const sameTarget = !result.actorUid || result.actorUid === result.targetUid;
      const powerBase = result.skillType === "damage"
        ? Math.min(1.8, 0.85 + (result.amount || 0) / 220) * (result.crit ? 1.25 : 1)
        : Math.min(1.5, 0.9 + (result.amount || 20) / 120);

      if (result.skillType === "damage") {
        if (!sameTarget && from) {
          this.castBeam(from, to, {
            crit: !!result.crit,
            power: powerBase,
            duration: 140,
            skillName: result.skillName || "",
          });
          return 120;
        }
        return 0;
      }

      if (result.skillType === "heal") {
        this.castMist(sameTarget ? to : from, to, { power: powerBase, duration: sameTarget ? 150 : 180 });
        return sameTarget ? 0 : 140;
      }

      if (result.skillType === "buff_atk") {
        this.castAuraTrail(sameTarget ? to : from, to, "buff", { power: powerBase, duration: sameTarget ? 140 : 160 });
        return sameTarget ? 0 : 130;
      }

      if (result.skillType === "debuff_def") {
        this.castAuraTrail(sameTarget ? to : from, to, "debuff", { power: powerBase, duration: sameTarget ? 140 : 160 });
        return sameTarget ? 0 : 130;
      }

      return 0;
    }

    /**
     * 战斗结果特效（街机夸张）
     * @param {object} result
     */
    playBattleFx(result) {
      if (!result) return;
      this.init();
      this.unlockAudio();

      const actorCard = result.actorUid
        ? (
            document.querySelector(`.current-actor-card[data-uid="${result.actorUid}"], .current-actor-card[data-fx-actor="${result.actorUid}"]`) ||
            document.querySelector(`.fighter-card[data-uid="${result.actorUid}"]`)
          )
        : null;
      const targetCard = result.targetUid
        ? document.querySelector(`.fighter-card[data-uid="${result.targetUid}"]`)
        : null;
      const stage = document.getElementById("battle-stage");
      const isKo = !!(result.message && /倒下/.test(result.message));
      const isCrit = !!result.crit || (result.skillType === "damage" && result.amount >= 180);
      const combo = result.skillType === "damage" ? this.registerCombo(true) : this.combo;
      const comboPower = 1 + Math.min(1.4, Math.max(0, combo - 1) * 0.12);
      const dmgPower = result.skillType === "damage"
        ? Math.min(1.8, 0.85 + (result.amount || 0) / 220) * comboPower * (isCrit ? 1.35 : 1)
        : 1;

      // 出手姿态
      if (actorCard) {
        if (result.skillType === "damage") {
          this.pulseDom(actorCard, "attack", 460);
          this.spawnBurstOn(result.actorUid, "slash");
          this.spawnBurstOn(result.actorUid, "beam");
          if (isCrit) this.spawnBurstOn(result.actorUid, "crit-flare");
          this.pulseDom(stage, "impact", 480);
        } else if (result.skillType === "heal") {
          this.pulseDom(actorCard, "cast-heal", 460);
          this.spawnBurstOn(result.actorUid, "sparkle");
        } else if (result.skillType === "buff_atk") {
          this.pulseDom(actorCard, "cast-buff", 460);
          this.spawnBurstOn(result.actorUid, "buff-up");
        } else {
          this.pulseDom(actorCard, "cast-buff", 460);
          this.spawnBurstOn(result.actorUid, "debuff-down");
        }
      }

      // 指向性轨迹（射线 / 雾团 / buff·debuff 轨迹）
      const hitDelay = this.playDirectionalFx(result);

      const applyTarget = () => {
        const pos = this.centerOf(result.targetUid);
        if (!targetCard && !result.targetUid) return;

        if (result.skillType === "damage") {
          if (targetCard) {
            this.pulseDom(targetCard, isCrit ? "hit-crit" : "hit", 480);
            this.spawnBurstOn(result.targetUid, "impact");
            this.spawnBurstOn(result.targetUid, "shockwave");
            if (isCrit) this.spawnBurstOn(result.targetUid, "crit-ring");
          }
          const floatText = isCrit ? `CRIT -${result.amount}` : `-${result.amount}`;
          this.showFloatGlobal(floatText, isCrit ? "crit" : "dmg", pos.x, pos.y, isCrit ? 1.45 : 1 + Math.min(0.5, dmgPower * 0.2));
          this.trigger(isCrit ? "crit" : "hit", {
            x: pos.x,
            y: pos.y,
            power: dmgPower,
            palette: isCrit ? "crit" : "hit",
          });
          if (isCrit || dmgPower > 1.25) this.hitStopFor(isCrit ? 90 : 50);
          if (combo >= 3) {
            this.showFloatGlobal(`${combo} HIT!`, "combo", pos.x, pos.y - 36, 1.1 + Math.min(0.5, combo * 0.05));
            this.trigger("combo", { x: pos.x, y: pos.y - 20, power: 0.7 + combo * 0.05, palette: "crit" });
          }
          if (isKo) {
            if (targetCard) this.pulseDom(targetCard, "ko", 800);
            this.trigger("ko", { x: pos.x, y: pos.y, power: 1.3, palette: "ko" });
            this.pulseDom(stage, "impact", 600);
            this.hitStopFor(120);
          }
        } else if (result.skillType === "heal") {
          if (targetCard) {
            this.pulseDom(targetCard, "heal", 560);
            this.spawnBurstOn(result.targetUid, "sparkle");
            this.spawnBurstOn(result.targetUid, "heal-ring");
          }
          this.showFloatGlobal(`+${result.amount}`, "heal", pos.x, pos.y, 1.15);
          this.trigger("heal", { x: pos.x, y: pos.y, power: 1.1, palette: "heal" });
        } else if (result.skillType === "buff_atk") {
          if (targetCard) {
            this.pulseDom(targetCard, "buff", 560);
            this.spawnBurstOn(result.targetUid, "buff-up");
            this.spawnBurstOn(result.targetUid, "buff-ring");
          }
          this.showFloatGlobal(`ATK+${result.amount}%`, "buff", pos.x, pos.y, 1.1);
          this.trigger("buff", { x: pos.x, y: pos.y, power: 1.05, palette: "buff" });
        } else if (result.skillType === "debuff_def") {
          if (targetCard) {
            this.pulseDom(targetCard, "debuff", 560);
            this.spawnBurstOn(result.targetUid, "debuff-down");
            this.spawnBurstOn(result.targetUid, "debuff-ring");
          }
          this.showFloatGlobal(`DEF-${result.amount}%`, "debuff", pos.x, pos.y, 1.1);
          this.trigger("debuff", { x: pos.x, y: pos.y, power: 1.05, palette: "debuff" });
        }
      };

      if (hitDelay > 0) setTimeout(applyTarget, hitDelay);
      else applyTarget();
    }

    playResult(winner) {
      this.init();
      this.unlockAudio();
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      if (winner === "hero") {
        this.trigger("victory", { x: cx, y: cy, power: 1.4, palette: "victory" });
        // 额外烟花
        for (let i = 0; i < 4; i += 1) {
          setTimeout(() => {
            this.spawnParticles(
              cx + (Math.random() * 280 - 140),
              cy + (Math.random() * 160 - 80),
              36,
              "victory",
              1.2
            );
          }, 120 + i * 140);
        }
      } else if (winner === "monster") {
        this.trigger("defeat", { x: cx, y: cy, power: 1.2, palette: "defeat" });
      } else {
        this.trigger("ko", { x: cx, y: cy, power: 1.1, palette: "ko" });
      }
    }

    playUi(kind, el) {
      this.init();
      this.unlockAudio();
      if (el) this.pulseDom(el, "ui-pop", 280);
      if (kind === "start") {
        this.trigger("battle_start", {
          x: window.innerWidth / 2,
          y: window.innerHeight * 0.35,
          power: 1.15,
        });
      } else if (kind === "select") {
        this.trigger("select", {
          x: window.innerWidth / 2,
          y: 120,
          power: 0.8,
        });
      } else {
        this.trigger("ui_click", {
          x: window.innerWidth / 2,
          y: window.innerHeight * 0.8,
          power: 0.7,
        });
      }
    }
  }

  const fx = new ArcadeFX();
  window.ArcadeFX = fx;
  window.FX_SPECS = FX_SPECS;
})();
