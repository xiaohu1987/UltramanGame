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
    poison: ["#a855f7", "#d8b4fe", "#7e22ce", "#f3e8ff"],
    revive: ["#fff4c2", "#86efac", "#63d2ff", "#ffffff"],
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
      /** @type {null | object} 心算答对/答错离场特效状态 */
      this.mathFx = null;
      this.mathFxToken = 0;
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

      // math answer fx sequence
      this.updateMathAnswerFx(dt);

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
      this.drawMathAnswerFx();
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

    pickTalkLine(lines) {
      return lines[Math.floor(Math.random() * lines.length)];
    }

    getTalkLine(skillType, role, { crit = false, ko = false } = {}) {
      const actorLines = {
        damage_all: ["全部接招！", "光线覆盖全场！"],
        multi_hit: ["连招开始！", "别想躲开！"],
        lifesteal: ["能量归我了！", "借点生命力！"],
        poison: ["毒雾扩散！", "慢慢感受吧！"],
        heal_all: ["全员补给！", "治愈之光展开！"],
        revive: ["站起来，继续战斗！", "复苏吧！"],
        revive_all: ["全员归队！", "把大家带回来！"],
        dodge: ["抓不住我！", "闪开这一击！"],
        damage: crit ? ["认真起来连我都怕！", "这一下有点重！"] : ["看我的！", "别眨眼！", "光线走你！", "接招吧！"],
        heal: ["别慌，奶一口！", "急救光线到！"],
        buff_atk: ["状态拉满！", "能量上线！"],
        debuff_def: ["先给你降降温！", "防御借我一下！"],
      };
      const targetLines = {
        damage_all: ["全都被打中了！", "这范围也太大了！"],
        multi_hit: ["还没结束吗？", "连续命中！"],
        lifesteal: ["生命被吸走了！", "别抢我的能量！"],
        poison: ["这毒雾不对劲！", "中毒了！"],
        heal_all: ["大家都恢复了！", "全队状态回来了！"],
        revive: ["我又回来了！", "还能继续！"],
        revive_all: ["我们全都复苏了！", "重新集结！"],
        dodge: ["差一点！", "躲过去了！"],
        damage: ko ? ["我先躺会儿…", "暂停一下！"] : crit ? ["这也太狠了！", "我裂开了！"] : ["哎呀！", "我的护甲！", "先记账！", "别打脸！"],
        heal: ["满电复活！", "舒服了！"],
        buff_atk: ["感觉变强了！", "能量到账！"],
        debuff_def: ["这状态不对！", "我被削弱了！"],
      };
      const pool = (role === "actor" ? actorLines : targetLines)[skillType] || ["嗯？"];
      return this.pickTalkLine(pool);
    }

    showTalkBubble(uid, text, role = "actor") {
      if (!this.floatLayer || !uid || !text) return;
      const rect = this.getAnchorRect(uid);
      if (!rect) return;
      while (this.floatLayer.childElementCount >= MAX_FLOATS) {
        this.floatLayer.firstElementChild.remove();
      }
      const node = document.createElement("div");
      node.className = `fx-talk-bubble ${role}`;
      node.textContent = text;
      node.style.left = `${rect.left + rect.width * 0.5}px`;
      node.style.top = `${rect.top + 10}px`;
      this.floatLayer.appendChild(node);
      setTimeout(() => node.remove(), 1450);
    }

    showCombo(value, anchor = null) {
      if (!this.comboHud || !this.comboValueEl) return;
      if (anchor) {
        const x = Math.max(62, Math.min(window.innerWidth - 62, anchor.x));
        const y = Math.max(76, anchor.y - 54);
        this.comboHud.style.left = `${x}px`;
        this.comboHud.style.top = `${y}px`;
        this.comboHud.style.right = "auto";
      }
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
        case "urgency":
          this.playTone({ freq: 880, dur: 0.05, type: "square", gain: 0.08 * i, slide: 40 });
          this.playTone({ freq: 660, dur: 0.06, type: "triangle", gain: 0.07 * i, delay: 0.03, slide: -80 });
          this.playNoise({ dur: 0.03, gain: 0.04 * i, delay: 0.01 });
          break;
        case "math_ok":
          this.playTone({ freq: 523, dur: 0.07, type: "triangle", gain: 0.1 * i, slide: 120 });
          this.playTone({ freq: 784, dur: 0.09, type: "sine", gain: 0.09 * i, delay: 0.05, slide: 160 });
          this.playTone({ freq: 1046, dur: 0.1, type: "triangle", gain: 0.07 * i, delay: 0.1 });
          break;
        case "math_fail":
          this.playNoise({ dur: 0.06, gain: 0.1 * i });
          this.playTone({ freq: 240, dur: 0.1, type: "sawtooth", gain: 0.12 * i, slide: -120 });
          this.playTone({ freq: 140, dur: 0.14, type: "square", gain: 0.1 * i, delay: 0.05, slide: -60 });
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
      const palette = kind === "poison" ? "poison" : kind === "debuff" ? "debuff" : "buff";
      this.spawnPathParticles(start, to, Math.round(14 * power), palette, power, kind);
      return trail;
    }

    getFxTargets(result) {
      return [...new Set(result.targets && result.targets.length ? result.targets : [result.targetUid])].filter(Boolean);
    }

    getTargetAmount(result, uid, fallback = 0) {
      return result.targetAmounts && Number.isFinite(result.targetAmounts[uid])
        ? result.targetAmounts[uid]
        : fallback;
    }

    playExpandedSkillFx(result, skillType) {
      const supported = ["damage_all", "multi_hit", "lifesteal", "poison", "heal_all", "revive", "revive_all"];
      if (!supported.includes(skillType)) return false;

      const targets = this.getFxTargets(result);
      if (!targets.length) return false;

      const actorPos = this.centerOf(result.actorUid);
      const actorCard = document.querySelector(
        `.current-actor-card[data-uid="${result.actorUid}"], .current-actor-card[data-fx-actor="${result.actorUid}"], .fighter-card[data-uid="${result.actorUid}"]`
      );
      const stage = document.getElementById("battle-stage");
      const isGroup = ["damage_all", "heal_all", "revive_all"].includes(skillType);
      const targetCount = targets.length;

      this.showTalkBubble(result.actorUid, this.getTalkLine(skillType, "actor"), "actor");

      const targetCard = (uid) => document.querySelector(`.fighter-card[data-uid="${uid}"]`);
      const showTargetTalk = (uid) => {
        this.showTalkBubble(uid, this.getTalkLine(skillType, "target"), "target");
      };
      const damageTarget = (uid, amount, index, hitNumber = null) => {
        const pos = this.centerOf(uid);
        const card = targetCard(uid);
        if (card) {
          this.pulseDom(card, result.crit ? "hit-crit" : "hit", 460);
          this.spawnBurstOn(uid, "impact");
          this.spawnBurstOn(uid, "shockwave");
        }
        if (index === 0 || targetCount === 1) showTargetTalk(uid);
        const label = hitNumber ? `${hitNumber} HIT  -${amount}` : `-${amount}`;
        this.showFloatGlobal(label, result.crit ? "crit" : "dmg", pos.x, pos.y, hitNumber ? 1.14 : 1.1);
        this.trigger(result.crit ? "crit" : "hit", { x: pos.x, y: pos.y, power: 1.05, palette: result.crit ? "crit" : "hit" });
      };
      const healTarget = (uid, amount, index, revived = false) => {
        const pos = this.centerOf(uid);
        const card = targetCard(uid);
        if (card) {
          this.pulseDom(card, revived ? "revive" : "heal", 680);
          this.spawnBurstOn(uid, revived ? "revive-halo" : "heal-ring");
          this.spawnBurstOn(uid, "sparkle");
        }
        if (index === 0 || targetCount === 1) showTargetTalk(uid);
        this.showFloatGlobal(revived ? `REVIVE +${amount}` : `+${amount}`, "heal", pos.x, pos.y, revived ? 1.26 : 1.12);
        this.spawnParticles(pos.x, pos.y, revived ? 34 : 22, revived ? "revive" : "heal", revived ? 1.2 : 1);
        this.trigger("heal", { x: pos.x, y: pos.y, power: revived ? 1.18 : 1.05, palette: revived ? "revive" : "heal" });
      };

      if (actorCard) {
        this.pulseDom(actorCard, skillType === "poison" ? "cast-buff" : skillType.includes("heal") || skillType.includes("revive") ? "cast-heal" : "attack", 480);
        this.spawnBurstOn(result.actorUid, isGroup ? "group-wave" : skillType === "poison" ? "poison-bubbles" : skillType.includes("revive") ? "revive-halo" : skillType.includes("heal") ? "sparkle" : "beam");
      }
      if (isGroup) this.spawnBurstOn(result.actorUid, "group-wave");

      if (skillType === "damage_all") {
        if (stage) this.pulseDom(stage, "impact", 520);
        targets.forEach((uid, index) => {
          const delay = index * 85;
          setTimeout(() => {
            this.castBeam(actorPos, this.centerOf(uid), { crit: result.crit, power: 1.1, duration: 145 });
            setTimeout(() => damageTarget(uid, this.getTargetAmount(result, uid, 0), index), 115);
          }, delay);
        });
        return true;
      }

      if (skillType === "multi_hit") {
        const uid = targets[0];
        const hits = Math.max(2, result.hits || 3);
        const total = this.getTargetAmount(result, uid, result.amount || 0);
        for (let hit = 0; hit < hits; hit += 1) {
          setTimeout(() => {
            this.castBeam(actorPos, this.centerOf(uid), { crit: result.crit && hit === hits - 1, power: 0.9, duration: 110 });
            setTimeout(() => damageTarget(uid, Math.max(1, Math.round(total / hits)), 0, hit + 1), 88);
          }, hit * 120);
        }
        return true;
      }

      if (skillType === "lifesteal") {
        const uid = targets[0];
        this.castBeam(actorPos, this.centerOf(uid), { crit: result.crit, power: 1.15, duration: 150 });
        setTimeout(() => damageTarget(uid, this.getTargetAmount(result, uid, result.amount || 0), 0), 118);
        if (result.healAmount > 0) {
          setTimeout(() => {
            this.castMist(this.centerOf(uid), actorPos, { power: 1.1, duration: 180 });
            this.spawnBurstOn(result.actorUid, "heal-ring");
            this.showFloatGlobal(`+${result.healAmount}`, "heal", actorPos.x, actorPos.y, 1.12);
          }, 210);
        }
        return true;
      }

      if (skillType === "poison") {
        const uid = targets[0];
        const pos = this.centerOf(uid);
        this.castAuraTrail(actorPos, pos, "poison", { power: 1.1, duration: 190 });
        setTimeout(() => {
          const card = targetCard(uid);
          if (card) {
            this.pulseDom(card, "poisoned", 1000);
            this.spawnBurstOn(uid, "poison-bubbles");
          }
          showTargetTalk(uid);
          this.showFloatGlobal("中毒", "poison", pos.x, pos.y, 1.2);
          this.spawnParticles(pos.x, pos.y, 30, "poison", 1.08);
          this.trigger("debuff", { x: pos.x, y: pos.y, power: 1.05, palette: "poison" });
        }, 150);
        return true;
      }

      const revived = skillType === "revive" || skillType === "revive_all";
      targets.forEach((uid, index) => {
        const delay = index * 105;
        setTimeout(() => {
          const pos = this.centerOf(uid);
          if (revived) {
            this.castMist(actorPos, pos, { power: 1.28, duration: 200 });
            this.spawnBurstOn(uid, "revive-halo");
          } else {
            this.castMist(actorPos, pos, { power: 1.05, duration: 180 });
          }
          setTimeout(() => healTarget(uid, this.getTargetAmount(result, uid, 0), index, revived), revived ? 150 : 130);
        }, delay);
      });
      return true;
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

      // 中级及以上：心算答对/答错已有独立演出，跳过奥特曼技能攻击特效
      if (result.skipSkillFx) {
        // 答错/超时主演出已在 playMathWrongFx；这里只补角色侧轻反馈
        if (result.missed || result.failed) {
          const actorCard = result.actorUid
            ? (
                document.querySelector(`.current-actor-card[data-uid="${result.actorUid}"], .current-actor-card[data-fx-actor="${result.actorUid}"]`) ||
                document.querySelector(`.fighter-card[data-uid="${result.actorUid}"]`)
              )
            : null;
          const actorPos = result.actorUid ? this.centerOf(result.actorUid) : { x: window.innerWidth * 0.5, y: window.innerHeight * 0.4 };
          if (actorCard) {
            this.pulseDom(actorCard, "debuff", 520);
            this.spawnBurstOn(result.actorUid, "debuff-down");
          }
          this.showFloatGlobal(result.missed ? "MISS" : "FAIL", "debuff", actorPos.x, actorPos.y - 12, 1.2);
          this.spawnParticles(actorPos.x, actorPos.y, Math.round(16 * this.perfScale), "debuff", 0.9);
          this.shakeScreen(4, 180);
          this.flashScreen(0.16, "90,20,30");
          this.sfx("math_fail", 0.7);
        }
        return;
      }

      const originalSkillType = result.skillType;
      if (this.playExpandedSkillFx(result, originalSkillType)) return;
      const visualSkillType = ["damage_all", "multi_hit", "lifesteal"].includes(originalSkillType)
        ? "damage"
        : originalSkillType === "heal_all" || originalSkillType === "revive" || originalSkillType === "revive_all"
          ? "heal"
          : originalSkillType === "dodge"
            ? "buff_atk"
            : originalSkillType === "poison"
              ? "debuff_def"
              : originalSkillType;
      result = { ...result, skillType: visualSkillType };

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

      this.showTalkBubble(
        result.actorUid,
        this.getTalkLine(originalSkillType, "actor", { crit: isCrit }),
        "actor"
      );

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

        this.showTalkBubble(
          result.targetUid,
          this.getTalkLine(originalSkillType, "target", { crit: isCrit, ko: isKo }),
          "target"
        );

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
          this.showCombo(combo, pos);
          if (combo >= 2) {
            this.spawnBurstOn(result.targetUid, "combo-blast");
            this.spawnParticles(pos.x, pos.y, 18 + combo * 5, "crit", 0.85 + combo * 0.08);
            this.trigger("combo", { x: pos.x, y: pos.y - 12, power: 0.75 + combo * 0.07, palette: "crit" });
            this.flashScreen(Math.min(0.32, 0.1 + combo * 0.035), "255,202,91");
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
        for (let i = 0; i < 3; i += 1) {
          setTimeout(() => {
            this.spawnParticles(
              cx + (Math.random() * 180 - 90),
              cy + (Math.random() * 100 - 50),
              24,
              "defeat",
              0.95
            );
          }, 100 + i * 150);
        }
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

    /**
     * 心算答对/答错离场特效
     * 答对：汇聚 → 光球 → 飞向目标 → 击中
     * 答错：变黑 → 裂开 → 消失
     * 音效阶段：
     *  - 答对 gather: math_ok；fly: whoosh；hit: hit
     *  - 答错 darken: math_fail；crack: noise
     *  - 动画结束 onComplete / Promise resolve（含安全超时）
     * @param {object} options
     * @param {boolean} options.correct
     * @param {DOMRect|{left:number,top:number,width:number,height:number}} options.sourceRect
     * @param {{x:number,y:number}|null} [options.targetPoint]
     * @param {string} [options.targetUid]
     * @param {() => void} [options.onComplete]
     * @returns {Promise<void>}
     */
    playMathAnswerFx(options = {}) {
      this.init();
      this.unlockAudio();

      const correct = !!options.correct;
      if (!correct) {
        return this.playMathWrongFx(options);
      }
      return this.playMathCorrectFx(options);
    }

    cancelMathAnswerFx() {
      if (!this.mathFx) return;
      const cb = this.mathFx.onComplete;
      const token = this.mathFx.token;
      if (this.mathFx.safetyTimer) {
        clearTimeout(this.mathFx.safetyTimer);
        this.mathFx.safetyTimer = 0;
      }
      this.mathFx = null;
      if (typeof cb === "function") {
        try {
          cb({ cancelled: true, token });
        } catch (_) {
          /* ignore */
        }
      }
    }

    playMathWrongFx(options = {}) {
      const rect = options.sourceRect || {
        left: window.innerWidth * 0.5 - 160,
        top: window.innerHeight * 0.5 - 120,
        width: 320,
        height: 240,
      };
      const left = Number(rect.left) || 0;
      const top = Number(rect.top) || 0;
      const width = Math.max(40, Number(rect.width) || 200);
      const height = Math.max(40, Number(rect.height) || 160);
      const cx = left + width * 0.5;
      const cy = top + height * 0.5;

      if (this.mathFx && this.mathFx.active) {
        this.cancelMathAnswerFx();
      }

      const token = ++this.mathFxToken;
      const count = Math.max(28, Math.round(42 * this.perfScale));
      const particles = [];
      const cols = Math.max(3, Math.round(Math.sqrt(count * (width / Math.max(1, height)))));
      const rows = Math.max(3, Math.ceil(count / cols));
      let n = 0;
      for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
          if (n >= count) break;
          const px = left + ((c + 0.5) / cols) * width + (Math.random() - 0.5) * 6;
          const py = top + ((r + 0.5) / rows) * height + (Math.random() - 0.5) * 6;
          const ang = Math.atan2(py - cy, px - cx) + (Math.random() - 0.5) * 0.6;
          const spd = 180 + Math.random() * 320;
          particles.push({
            x: px,
            y: py,
            ox: px,
            oy: py,
            vx: 0,
            vy: 0,
            burstVx: Math.cos(ang) * spd,
            burstVy: Math.sin(ang) * spd - 40,
            size: 5 + Math.random() * 9,
            w: 8 + Math.random() * 14,
            h: 6 + Math.random() * 12,
            color: "#1a1f28",
            baseColor: "#63d2ff",
            glow: false,
            spin: (Math.random() * 2 - 1) * 14,
            rotation: Math.random() * Math.PI,
            alpha: 1,
            phase: Math.random(),
          });
          n += 1;
        }
      }

      const onComplete = typeof options.onComplete === "function" ? options.onComplete : null;
      const DARKEN = 0.34;
      const CRACK = 0.56;
      const FADE = 0.34;
      const TOTAL = DARKEN + CRACK + FADE;
      const SAFETY_MS = 2400;

      this.mathFx = {
        active: true,
        correct: false,
        token,
        t: 0,
        duration: TOTAL,
        darkenDur: DARKEN,
        crackDur: CRACK,
        fadeDur: FADE,
        source: { left, top, width, height, cx, cy },
        target: null,
        particles,
        orb: null,
        overlayAlpha: 0,
        cardAlpha: 1,
        stage: "darken",
        cracked: false,
        sfxFail: false,
        cracks: [],
        sparks: [],
        rings: [],
        flashPulse: 0,
        failLabel: true,
        onComplete,
        safetyTimer: 0,
      };

      // heavier fail sting
      this.sfx("math_fail", 1.2);
      this.playNoise({ dur: 0.1, gain: 0.14 });
      this.playTone({ freq: 180, dur: 0.16, type: "sawtooth", gain: 0.14, slide: -90 });
      this.playTone({ freq: 90, dur: 0.22, type: "square", gain: 0.12, delay: 0.04, slide: -40 });
      this.mathFx.sfxFail = true;

      return new Promise((resolve) => {
        const state = this.mathFx;
        if (!state || state.token !== token) {
          resolve();
          return;
        }
        const prev = state.onComplete;
        state.onComplete = () => {
          if (typeof prev === "function") prev();
          resolve();
        };
        state.safetyTimer = setTimeout(() => {
          if (this.mathFx && this.mathFx.token === token && this.mathFx.active) {
            this.finishMathAnswerFx(token);
          }
        }, SAFETY_MS);
      });
    }

    playMathCorrectFx(options = {}) {
      const rect = options.sourceRect || {
        left: window.innerWidth * 0.5 - 160,
        top: window.innerHeight * 0.5 - 120,
        width: 320,
        height: 240,
      };
      const left = Number(rect.left) || 0;
      const top = Number(rect.top) || 0;
      const width = Math.max(40, Number(rect.width) || 200);
      const height = Math.max(40, Number(rect.height) || 160);
      const cx = left + width * 0.5;
      const cy = top + height * 0.5;

      let target = options.targetPoint;
      if (!target || !Number.isFinite(target.x) || !Number.isFinite(target.y)) {
        if (options.targetUid) target = this.centerOf(options.targetUid);
      }
      if (!target || !Number.isFinite(target.x) || !Number.isFinite(target.y)) {
        target = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.42 };
      }

      // cancel previous sequence
      if (this.mathFx && this.mathFx.active) {
        this.cancelMathAnswerFx();
      }

      const token = ++this.mathFxToken;
      const colors = PALETTES.buff;
      const count = Math.max(22, Math.round(42 * this.perfScale));
      const particles = [];
      for (let i = 0; i < count; i += 1) {
        const px = left + Math.random() * width;
        const py = top + Math.random() * height;
        particles.push({
          x: px,
          y: py,
          ox: px,
          oy: py,
          size: 2.4 + Math.random() * 4.2,
          color: colors[i % colors.length],
          glow: true,
          spin: (Math.random() * 2 - 1) * 7,
          rotation: Math.random() * Math.PI,
          phase: Math.random(),
        });
      }

      const onComplete = typeof options.onComplete === "function" ? options.onComplete : null;
      const GATHER = 0.42;
      const ORB = 0.16;
      const FLY = 0.36;
      const HIT = 0.48;
      const TOTAL = GATHER + ORB + FLY + HIT;
      const SAFETY_MS = 2600;

      this.mathFx = {
        active: true,
        correct: true,
        token,
        t: 0,
        duration: TOTAL,
        gatherDur: GATHER,
        orbDur: ORB,
        flyDur: FLY,
        hitDur: HIT,
        source: { left, top, width, height, cx, cy },
        target: { x: target.x, y: target.y },
        targetUid: options.targetUid || null,
        particles,
        orb: { x: cx, y: cy, r: 6, alpha: 0, stretch: 1 },
        rings: [],
        blast: null,
        sparks: [],
        stage: "gather",
        hitFired: false,
        sfxGather: false,
        sfxFly: false,
        sfxHit: false,
        onComplete,
        safetyTimer: 0,
      };

      // gather sfx once
      this.sfx("math_ok", 1);
      this.mathFx.sfxGather = true;

      return new Promise((resolve) => {
        const state = this.mathFx;
        if (!state || state.token !== token) {
          resolve();
          return;
        }
        const prev = state.onComplete;
        state.onComplete = () => {
          if (typeof prev === "function") prev();
          resolve();
        };
        state.safetyTimer = setTimeout(() => {
          if (this.mathFx && this.mathFx.token === token && this.mathFx.active) {
            this.finishMathAnswerFx(token);
          }
        }, SAFETY_MS);
      });
    }

    finishMathAnswerFx(token) {
      if (!this.mathFx || this.mathFx.token !== token) return;
      const cb = this.mathFx.onComplete;
      if (this.mathFx.safetyTimer) {
        clearTimeout(this.mathFx.safetyTimer);
        this.mathFx.safetyTimer = 0;
      }
      this.mathFx.active = false;
      this.mathFx = null;
      if (typeof cb === "function") {
        try {
          cb();
        } catch (_) {
          /* ignore */
        }
      }
    }

    easeInOutCubic(t) {
      const x = Math.max(0, Math.min(1, t));
      return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    }

    updateMathAnswerFx(dt) {
      const fx = this.mathFx;
      if (!fx || !fx.active) return;

      fx.t += dt;
      const t = fx.t;
      const gEnd = fx.gatherDur;
      const oEnd = gEnd + fx.orbDur;
      const fEnd = oEnd + fx.flyDur;
      const hEnd = fEnd + fx.hitDur;

      if (fx.correct) {
        if (t <= gEnd) {
          fx.stage = "gather";
          const p = this.easeInOutCubic(t / gEnd);
          for (let i = 0; i < fx.particles.length; i += 1) {
            const pt = fx.particles[i];
            pt.x = pt.ox + (fx.source.cx - pt.ox) * p;
            pt.y = pt.oy + (fx.source.cy - pt.oy) * p;
            pt.size = (2.2 + pt.phase * 3.6) * (1 - p * 0.55);
            pt.rotation += pt.spin * dt;
          }
          fx.orb.x = fx.source.cx;
          fx.orb.y = fx.source.cy;
          fx.orb.r = 4 + p * 10;
          fx.orb.alpha = 0.25 + p * 0.55;
        } else if (t <= oEnd) {
          fx.stage = "orb";
          const p = (t - gEnd) / fx.orbDur;
          for (let i = 0; i < fx.particles.length; i += 1) {
            const pt = fx.particles[i];
            pt.x += (fx.source.cx - pt.x) * Math.min(1, dt * 10);
            pt.y += (fx.source.cy - pt.y) * Math.min(1, dt * 10);
            pt.size *= 1 - dt * 3;
          }
          fx.orb.x = fx.source.cx;
          fx.orb.y = fx.source.cy;
          fx.orb.r = 16 + Math.sin(p * Math.PI) * 6;
          fx.orb.alpha = 0.85 + p * 0.15;
          fx.orb.stretch = 1;
        } else if (t <= fEnd) {
          fx.stage = "fly";
          if (!fx.sfxFly) {
            // stronger whoosh when orb launches
            this.playNoise({ dur: 0.1, gain: 0.09 });
            this.playTone({ freq: 420, dur: 0.12, type: "sine", gain: 0.08, slide: 320 });
            this.playTone({ freq: 760, dur: 0.1, type: "triangle", gain: 0.06, delay: 0.02, slide: 220 });
            fx.sfxFly = true;
          }
          // hard ease-in for snappier impact arrival
          const raw = Math.max(0, Math.min(1, (t - oEnd) / fx.flyDur));
          const p = raw * raw * raw * (1.35 - 0.35 * raw);
          const sx = fx.source.cx;
          const sy = fx.source.cy;
          const tx = fx.target.x;
          const ty = fx.target.y;
          const midY = (sy + ty) * 0.5 - 60;
          const bx = sx + (tx - sx) * p;
          const by = (1 - p) * (1 - p) * sy + 2 * (1 - p) * p * midY + p * p * ty;
          fx.orb.x = bx;
          fx.orb.y = by;
          fx.orb.r = 14 + (1 - p) * 7;
          fx.orb.alpha = 1;
          fx.orb.stretch = 1 + p * 0.95;
          if (Math.random() < 0.95 * this.perfScale) {
            const room = Math.max(0, MAX_PARTICLES - this.particles.length);
            if (room > 0) {
              this.particles.push({
                x: bx + (Math.random() - 0.5) * 8,
                y: by + (Math.random() - 0.5) * 8,
                vx: (Math.random() - 0.5) * 110,
                vy: (Math.random() - 0.5) * 110,
                size: 2 + Math.random() * 3.8,
                color: Math.random() > 0.45
                  ? PALETTES.crit[Math.floor(Math.random() * PALETTES.crit.length)]
                  : PALETTES.buff[Math.floor(Math.random() * PALETTES.buff.length)],
                life: 0.28 + Math.random() * 0.22,
                maxLife: 0.45,
                gravity: 40,
                rotation: Math.random() * Math.PI,
                spin: (Math.random() * 2 - 1) * 4,
                shape: "circle",
                glow: true,
              });
            }
          }
          fx.particles.length = 0;
        } else if (t <= hEnd) {
          fx.stage = "hit";
          if (!fx.hitFired) {
            fx.hitFired = true;
            fx.orb.alpha = 0;
            const hx = fx.target.x;
            const hy = fx.target.y;
            // boom impact: multi-layer explosion + shockwave + heavy hit-stop
            this.spawnParticles(hx, hy, Math.round(58 * this.perfScale), "crit", 1.85);
            this.spawnParticles(hx, hy, Math.round(34 * this.perfScale), "hit", 1.55);
            this.spawnParticles(hx, hy, Math.round(22 * this.perfScale), "ko", 1.35);
            this.shakeScreen(16, 460);
            this.flashScreen(0.72, "255,248,210");
            this.hitStopFor(120);
            if (fx.targetUid) {
              const card =
                document.querySelector(`.unit-card[data-uid="${fx.targetUid}"]`) ||
                document.querySelector(`[data-uid="${fx.targetUid}"]`);
              if (card) this.pulseDom(card, "hit-crit", 720);
              this.spawnBurstOn(fx.targetUid, "crit");
            }
            const stage = document.querySelector(".battle-stage") || document.querySelector("#battle-stage");
            if (stage) this.pulseDom(stage, "impact", 760);
            fx.blast = {
              x: hx,
              y: hy,
              r: 10,
              maxR: 150,
              alpha: 1,
              core: 1,
            };
            fx.rings = [
              { x: hx, y: hy, r: 10, maxR: 92, alpha: 1, width: 7, color: "rgba(255,250,210,0.98)" },
              { x: hx, y: hy, r: 6, maxR: 140, alpha: 0.9, width: 4.5, color: "rgba(255,180,90,0.95)" },
              { x: hx, y: hy, r: 3, maxR: 190, alpha: 0.75, width: 3, color: "rgba(120,210,255,0.9)" },
              { x: hx, y: hy, r: 1, maxR: 240, alpha: 0.5, width: 2, color: "rgba(255,255,255,0.75)" },
            ];
            fx.sparks = [];
            const sparkN = Math.max(10, Math.round(18 * this.perfScale));
            for (let i = 0; i < sparkN; i += 1) {
              const ang = (Math.PI * 2 * i) / sparkN + Math.random() * 0.35;
              const spd = 220 + Math.random() * 340;
              fx.sparks.push({
                x: hx,
                y: hy,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd - 40,
                life: 0.28 + Math.random() * 0.22,
                maxLife: 0.5,
                size: 2.2 + Math.random() * 3.4,
                color: i % 2 === 0 ? "#fff4b0" : "#ff8a4c",
              });
            }
            this.showFloatGlobal("BOOM!", "crit", hx, hy - 24, 1.45);
            this.showFloatGlobal("HIT!", "crit", hx + 18, hy + 10, 1.05);
            if (!fx.sfxHit) {
              // layered boom: noise + low boom + high crack
              this.playNoise({ dur: 0.16, gain: 0.22 });
              this.playNoise({ dur: 0.1, gain: 0.14, delay: 0.04 });
              this.playTone({ freq: 90, dur: 0.22, type: "sawtooth", gain: 0.18, slide: -50 });
              this.playTone({ freq: 160, dur: 0.16, type: "square", gain: 0.14, delay: 0.02, slide: -70 });
              this.playTone({ freq: 720, dur: 0.1, type: "triangle", gain: 0.1, delay: 0.01, slide: 180 });
              this.sfx("crit", 1.25);
              this.sfx("hit", 1.05);
              this.sfx("ko", 0.75);
              fx.sfxHit = true;
            }
          }
          // evolve blast core
          if (fx.blast) {
            const bp = Math.max(0, Math.min(1, (t - fEnd) / Math.max(0.001, fx.hitDur)));
            fx.blast.r = 10 + bp * fx.blast.maxR;
            fx.blast.alpha = Math.max(0, 1 - bp * 1.15);
            fx.blast.core = Math.max(0, 1 - bp * 1.6);
            if (fx.blast.alpha <= 0.02) fx.blast = null;
          }
          // radial sparks
          if (fx.sparks && fx.sparks.length) {
            for (let i = fx.sparks.length - 1; i >= 0; i -= 1) {
              const sp = fx.sparks[i];
              sp.life -= dt;
              if (sp.life <= 0) {
                fx.sparks.splice(i, 1);
                continue;
              }
              sp.x += sp.vx * dt;
              sp.y += sp.vy * dt;
              sp.vx *= 1 - 1.8 * dt;
              sp.vy *= 1 - 0.6 * dt;
              sp.vy += 180 * dt;
            }
          }
          if (fx.rings && fx.rings.length) {
            for (let i = fx.rings.length - 1; i >= 0; i -= 1) {
              const ring = fx.rings[i];
              ring.r += (ring.maxR - ring.r) * Math.min(1, dt * 11) + 140 * dt;
              ring.alpha = Math.max(0, ring.alpha - dt * 2.1);
              ring.width = Math.max(0.5, ring.width * (1 - dt * 1.5));
              if (ring.alpha <= 0.02 || ring.r >= ring.maxR) {
                fx.rings.splice(i, 1);
              }
            }
          }
        } else {
          this.finishMathAnswerFx(fx.token);
        }
      } else {
        // wrong: darken → crack → fade
        const dEnd = fx.darkenDur;
        const cEnd = dEnd + fx.crackDur;
        const fEnd = cEnd + fx.fadeDur;
        if (t <= dEnd) {
          fx.stage = "darken";
          const p = Math.max(0, Math.min(1, t / dEnd));
          fx.overlayAlpha = p * 0.9;
          fx.cardAlpha = 1 - p * 0.28;
          fx.flashPulse = Math.max(fx.flashPulse || 0, p * 0.35);
          for (let i = 0; i < fx.particles.length; i += 1) {
            const pt = fx.particles[i];
            // lerp color toward near-black
            const shade = Math.round(18 + (1 - p) * 70);
            pt.color = `rgb(${shade},${shade + 4},${shade + 10})`;
            pt.alpha = 0.55 + p * 0.45;
            pt.x = pt.ox + (Math.random() - 0.5) * p * 2.4;
            pt.y = pt.oy + (Math.random() - 0.5) * p * 2.4;
          }
        } else if (t <= cEnd) {
          fx.stage = "crack";
          if (!fx.cracked) {
            fx.cracked = true;
            fx.overlayAlpha = 0;
            this.shakeScreen(10, 360);
            this.flashScreen(0.38, "90,20,30");
            this.hitStopFor(70);
            this.playNoise({ dur: 0.12, gain: 0.18 });
            this.playNoise({ dur: 0.08, gain: 0.12, delay: 0.05 });
            this.playTone({ freq: 120, dur: 0.18, type: "sawtooth", gain: 0.16, slide: -70 });
            this.playTone({ freq: 70, dur: 0.24, type: "square", gain: 0.12, delay: 0.03, slide: -30 });
            // crack lines across the card
            fx.cracks = [];
            const crackN = 5 + Math.floor(Math.random() * 3);
            for (let i = 0; i < crackN; i += 1) {
              const x1 = fx.source.left + Math.random() * fx.source.width;
              const y1 = fx.source.top + Math.random() * fx.source.height;
              const ang = Math.random() * Math.PI * 2;
              const len = 40 + Math.random() * 90;
              fx.cracks.push({
                x1,
                y1,
                x2: x1 + Math.cos(ang) * len,
                y2: y1 + Math.sin(ang) * len,
                alpha: 0.95,
                width: 1.5 + Math.random() * 2.2,
              });
            }
            // red shock rings
            fx.rings = [
              { x: fx.source.cx, y: fx.source.cy, r: 8, maxR: 90, alpha: 0.9, width: 5, color: "rgba(255,90,90,0.9)" },
              { x: fx.source.cx, y: fx.source.cy, r: 4, maxR: 140, alpha: 0.65, width: 3, color: "rgba(180,40,60,0.8)" },
            ];
            // dark sparks
            fx.sparks = [];
            const sparkN = Math.max(12, Math.round(20 * this.perfScale));
            for (let i = 0; i < sparkN; i += 1) {
              const ang = (Math.PI * 2 * i) / sparkN + Math.random() * 0.4;
              const spd = 160 + Math.random() * 280;
              fx.sparks.push({
                x: fx.source.cx,
                y: fx.source.cy,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd - 30,
                life: 0.28 + Math.random() * 0.24,
                maxLife: 0.52,
                size: 2 + Math.random() * 3.2,
                color: i % 2 === 0 ? "#ff6b7a" : "#7a1f2b",
              });
            }
            this.showFloatGlobal("FAIL!", "debuff", fx.source.cx, fx.source.cy - 18, 1.35);
            this.showFloatGlobal("MISS", "debuff", fx.source.cx + 16, fx.source.cy + 16, 1.05);
            for (let i = 0; i < fx.particles.length; i += 1) {
              const pt = fx.particles[i];
              pt.vx = pt.burstVx * 1.25;
              pt.vy = pt.burstVy * 1.25;
              pt.color = `rgb(${28 + Math.floor(Math.random() * 40)},${18 + Math.floor(Math.random() * 18)},${24 + Math.floor(Math.random() * 24)})`;
            }
          }
          const p = (t - dEnd) / fx.crackDur;
          if (fx.cracks && fx.cracks.length) {
            for (let i = 0; i < fx.cracks.length; i += 1) {
              fx.cracks[i].alpha = Math.max(0, 0.95 - p * 0.9);
            }
          }
          if (fx.rings && fx.rings.length) {
            for (let i = fx.rings.length - 1; i >= 0; i -= 1) {
              const ring = fx.rings[i];
              ring.r += (ring.maxR - ring.r) * Math.min(1, dt * 10) + 110 * dt;
              ring.alpha = Math.max(0, ring.alpha - dt * 2.2);
              ring.width = Math.max(0.5, ring.width * (1 - dt * 1.6));
              if (ring.alpha <= 0.02 || ring.r >= ring.maxR) fx.rings.splice(i, 1);
            }
          }
          if (fx.sparks && fx.sparks.length) {
            for (let i = fx.sparks.length - 1; i >= 0; i -= 1) {
              const sp = fx.sparks[i];
              sp.life -= dt;
              if (sp.life <= 0) {
                fx.sparks.splice(i, 1);
                continue;
              }
              sp.x += sp.vx * dt;
              sp.y += sp.vy * dt;
              sp.vx *= 1 - 1.6 * dt;
              sp.vy *= 1 - 0.5 * dt;
              sp.vy += 220 * dt;
            }
          }
          for (let i = 0; i < fx.particles.length; i += 1) {
            const pt = fx.particles[i];
            pt.vy += 460 * dt;
            pt.x += pt.vx * dt;
            pt.y += pt.vy * dt;
            pt.vx *= 1 - 0.55 * dt;
            pt.rotation += pt.spin * dt;
            pt.alpha = Math.max(0, 1 - p * 0.28);
          }
        } else if (t <= fEnd) {
          fx.stage = "fade";
          const p = (t - cEnd) / fx.fadeDur;
          if (fx.cracks) {
            for (let i = 0; i < fx.cracks.length; i += 1) {
              fx.cracks[i].alpha = Math.max(0, fx.cracks[i].alpha - dt * 2.5);
            }
          }
          if (fx.sparks && fx.sparks.length) {
            for (let i = fx.sparks.length - 1; i >= 0; i -= 1) {
              const sp = fx.sparks[i];
              sp.life -= dt;
              if (sp.life <= 0) {
                fx.sparks.splice(i, 1);
                continue;
              }
              sp.x += sp.vx * dt;
              sp.y += sp.vy * dt;
              sp.vy += 260 * dt;
            }
          }
          for (let i = 0; i < fx.particles.length; i += 1) {
            const pt = fx.particles[i];
            pt.vy += 520 * dt;
            pt.x += pt.vx * dt;
            pt.y += pt.vy * dt;
            pt.rotation += pt.spin * dt;
            pt.alpha = Math.max(0, 0.75 * (1 - p));
            pt.w *= 1 - dt * 1.05;
            pt.h *= 1 - dt * 1.05;
          }
        } else {
          // ensure no residue
          fx.particles.length = 0;
          fx.cracks = [];
          fx.sparks = [];
          fx.rings = [];
          this.finishMathAnswerFx(fx.token);
        }
      }
    }

    drawMathAnswerFx() {
      const fx = this.mathFx;
      if (!fx || !fx.active || !this.ctx) return;
      const ctx = this.ctx;

      // wrong-path darken overlay over source card area
      if (!fx.correct && fx.stage === "darken" && fx.source) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, fx.overlayAlpha || 0));
        ctx.fillStyle = "rgba(18, 4, 8, 0.94)";
        const { left, top, width, height } = fx.source;
        const r = 16;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(left, top, width, height, r);
        } else {
          ctx.rect(left, top, width, height);
        }
        ctx.fill();
        ctx.restore();
      }

      for (let i = 0; i < fx.particles.length; i += 1) {
        const p = fx.particles[i];
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation || 0);
        ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha != null ? p.alpha : 0.85));
        ctx.fillStyle = p.color;
        if (!fx.correct) {
          // shard fragments
          const w = Math.max(1, p.w || p.size * 1.6);
          const h = Math.max(1, p.h || p.size);
          ctx.beginPath();
          ctx.moveTo(-w * 0.5, -h * 0.35);
          ctx.lineTo(w * 0.45, -h * 0.5);
          ctx.lineTo(w * 0.55, h * 0.4);
          ctx.lineTo(-w * 0.35, h * 0.55);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, Math.max(0.5, p.size), 0, Math.PI * 2);
          ctx.fill();
          if (p.glow) {
            ctx.globalAlpha = 0.28;
            ctx.beginPath();
            ctx.arc(0, 0, Math.max(1, p.size * 2.1), 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }

      // fail crack lines
      if (!fx.correct && fx.cracks && fx.cracks.length) {
        for (let i = 0; i < fx.cracks.length; i += 1) {
          const c = fx.cracks[i];
          if (!c || c.alpha <= 0.02) continue;
          ctx.save();
          ctx.globalAlpha = Math.max(0, Math.min(1, c.alpha));
          ctx.strokeStyle = "rgba(255,120,130,0.95)";
          ctx.lineWidth = Math.max(1, c.width || 2);
          ctx.beginPath();
          ctx.moveTo(c.x1, c.y1);
          ctx.lineTo(c.x2, c.y2);
          ctx.stroke();
          ctx.globalAlpha = Math.max(0, Math.min(0.45, c.alpha * 0.5));
          ctx.strokeStyle = "rgba(255,255,255,0.75)";
          ctx.lineWidth = Math.max(0.6, (c.width || 2) * 0.45);
          ctx.beginPath();
          ctx.moveTo(c.x1, c.y1);
          ctx.lineTo(c.x2, c.y2);
          ctx.stroke();
          ctx.restore();
        }
      }

      if (fx.orb && fx.orb.alpha > 0.02) {
        const { x, y, r, alpha } = fx.orb;
        const stretch = Math.max(1, fx.orb.stretch || 1);
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.translate(x, y);
        ctx.scale(stretch, 1 / Math.sqrt(stretch));
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2.6);
        grad.addColorStop(0, "rgba(255,255,255,0.95)");
        grad.addColorStop(0.28, "rgba(255,244,190,0.95)");
        grad.addColorStop(0.55, "rgba(154,215,255,0.85)");
        grad.addColorStop(0.82, "rgba(47,155,255,0.4)");
        grad.addColorStop(1, "rgba(47,155,255,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r * 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(2, r * 0.58), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // explosion core / fireball
      if (fx.blast && fx.blast.alpha > 0.02) {
        const b = fx.blast;
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, b.alpha));
        const outer = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        outer.addColorStop(0, "rgba(255,255,255,0.95)");
        outer.addColorStop(0.18, "rgba(255,244,180,0.9)");
        outer.addColorStop(0.42, "rgba(255,140,60,0.7)");
        outer.addColorStop(0.72, "rgba(255,70,40,0.28)");
        outer.addColorStop(1, "rgba(255,70,40,0)");
        ctx.fillStyle = outer;
        ctx.beginPath();
        ctx.arc(b.x, b.y, Math.max(1, b.r), 0, Math.PI * 2);
        ctx.fill();
        if (b.core > 0.02) {
          ctx.globalAlpha = Math.max(0, Math.min(1, b.core));
          ctx.fillStyle = "rgba(255,255,255,0.95)";
          ctx.beginPath();
          ctx.arc(b.x, b.y, Math.max(2, 10 + b.core * 18), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // radial sparks
      if (fx.sparks && fx.sparks.length) {
        for (let i = 0; i < fx.sparks.length; i += 1) {
          const sp = fx.sparks[i];
          if (!sp || sp.life <= 0) continue;
          const a = Math.max(0, Math.min(1, sp.life / Math.max(0.001, sp.maxLife || 0.5)));
          ctx.save();
          ctx.globalAlpha = a;
          ctx.fillStyle = sp.color || "#fff4b0";
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, Math.max(0.8, sp.size * a), 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = a * 0.35;
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, Math.max(1.2, sp.size * 2.2 * a), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      if (fx.rings && fx.rings.length) {
        for (let i = 0; i < fx.rings.length; i += 1) {
          const ring = fx.rings[i];
          if (!ring || ring.alpha <= 0.02) continue;
          ctx.save();
          ctx.globalAlpha = Math.max(0, Math.min(1, ring.alpha));
          ctx.strokeStyle = ring.color || (i === 0 ? "rgba(255,244,180,0.95)" : "rgba(154,215,255,0.9)");
          ctx.lineWidth = Math.max(0.8, ring.width || 2);
          ctx.beginPath();
          ctx.arc(ring.x, ring.y, Math.max(1, ring.r), 0, Math.PI * 2);
          ctx.stroke();
          // soft outer bloom
          ctx.globalAlpha = Math.max(0, Math.min(0.35, ring.alpha * 0.45));
          ctx.lineWidth = Math.max(1, (ring.width || 2) * 2.2);
          ctx.beginPath();
          ctx.arc(ring.x, ring.y, Math.max(1, ring.r * 1.05), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }

  const fx = new ArcadeFX();
  window.ArcadeFX = fx;
  window.FX_SPECS = FX_SPECS;
})();
