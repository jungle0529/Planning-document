// <pano-view> — WebGL equirectangular panorama viewer with crossfade + drag inertia.
(function () {
  const VS = `attribute vec2 a;varying vec2 v;void main(){v=a;gl_Position=vec4(a,0.,1.);}`;
  const FS = `precision highp float;
uniform sampler2D t0;uniform sampler2D t1;uniform float mixf,yaw,pitch,fovy,aspect,fade;
varying vec2 v;
void main(){
  float tf=tan(fovy*0.5);
  vec3 d=normalize(vec3(v.x*tf*aspect, v.y*tf, -1.0));
  float cp=cos(pitch), sp=sin(pitch);
  d=vec3(d.x, d.y*cp-d.z*sp, d.y*sp+d.z*cp);
  float cy=cos(yaw), sy=sin(yaw);
  d=vec3(d.x*cy+d.z*sy, d.y, -d.x*sy+d.z*cy);
  float u=atan(d.x,-d.z)/6.2831853+0.5;
  float w=acos(clamp(d.y,-1.,1.))/3.14159265;
  vec4 c=mix(texture2D(t0,vec2(u,w)), texture2D(t1,vec2(u,w)), mixf);
  gl_FragColor=vec4(c.rgb*fade, 1.0);
}`;

  class PanoView extends HTMLElement {
    constructor() {
      super();
      this._yaw = 0; this._pitch = 0; this._fov = 1.25;
      this._vy = 0; this._vp = 0;
      this._mix = 0; this._fade = 1;
      this._ready = false;
    }

    connectedCallback() {
      if (this._init) return;
      this._init = true;
      this.style.display = 'block';
      this.style.position = 'relative';
      this.style.touchAction = 'none';
      const cv = document.createElement('canvas');
      cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
      this.appendChild(cv);
      this.canvas = cv;
      const gl = cv.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: false });
      if (!gl) { this.innerHTML = ''; return; }
      this.gl = gl;
      const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; };
      const p = gl.createProgram();
      gl.attachShader(p, sh(gl.VERTEX_SHADER, VS));
      gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(p); gl.useProgram(p);
      this.prog = p;
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(p, 'a');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      this.u = {};
      ['t0', 't1', 'mixf', 'yaw', 'pitch', 'fovy', 'aspect', 'fade'].forEach(k => this.u[k] = gl.getUniformLocation(p, k));
      gl.uniform1i(this.u.t0, 0); gl.uniform1i(this.u.t1, 1);
      this.tex = [this._mkTex(), this._mkTex()];
      this._bindGestures();
      this._ro = new ResizeObserver(() => this._resize());
      this._ro.observe(this);
      this._resize();
      const tick = () => { this._raf = requestAnimationFrame(tick); this._step(); };
      tick();
      if (this.getAttribute('src')) this.setSrc(this.getAttribute('src'), false);
    }

    disconnectedCallback() { cancelAnimationFrame(this._raf); this._ro && this._ro.disconnect(); }

    _mkTex() {
      const gl = this.gl, t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([230, 230, 228]));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    }

    _resize() {
      const gl = this.gl; if (!gl) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(this.clientWidth * dpr));
      const h = Math.max(1, Math.round(this.clientHeight * dpr));
      if (this.canvas.width !== w || this.canvas.height !== h) {
        this.canvas.width = w; this.canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      this._aspect = w / h;
    }

    // src ------------------------------------------------------------
    setSrc(url, crossfade = true) {
      this._pending = url;
      return new Promise(res => {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => {
          if (this._pending !== url) return res(false);
          const gl = this.gl;
          const slot = crossfade && this._ready ? 1 : 0;
          gl.activeTexture(slot ? gl.TEXTURE1 : gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, this.tex[slot]);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
          gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex[0]);
          gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.tex[1]);
          if (slot === 1) { this._mix = 0; this._fading = true; this._img1 = img; }
          else { this._mix = 0; this._img0 = img; }
          this._ready = true;
          this.dispatchEvent(new CustomEvent('loaded'));
          res(true);
        };
        img.onerror = () => res(false);
        img.src = url;
      });
    }

    // view -----------------------------------------------------------
    get yaw() { return this._yaw; }
    set yaw(v) { this._yaw = v; }
    get pitch() { return this._pitch; }
    set pitch(v) { this._pitch = Math.max(-1.15, Math.min(1.15, v)); }
    get fov() { return this._fov; }
    set fov(v) { this._fov = Math.max(0.55, Math.min(1.7, v)); }
    rotateBy(d) { this._yaw += d; this._vy = 0; this._emit(); }
    setView(y, p) { this._yaw = y; if (p != null) this.pitch = p; this._vy = 0; this._vp = 0; this._emit(); }
    spinTo(y, dur = 900) {
      const from = this._yaw, delta = ((y - from + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
      const t0 = performance.now();
      this._tween = () => {
        const k = Math.min(1, (performance.now() - t0) / dur);
        const e = 1 - Math.pow(1 - k, 3);
        this._yaw = from + delta * e;
        if (k >= 1) this._tween = null;
        this._emit();
      };
    }
    _emit() { this.dispatchEvent(new CustomEvent('viewchange', { detail: { yaw: this._yaw, pitch: this._pitch } })); }

    _bindGestures() {
      const pts = new Map();
      let last = null, lastT = 0, pinch = 0;
      const el = this;
      el.addEventListener('pointerdown', e => {
        el.setPointerCapture(e.pointerId);
        pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        last = { x: e.clientX, y: e.clientY }; lastT = performance.now();
        this._vy = this._vp = 0; this._tween = null;
        this._drag = true;
        this.dispatchEvent(new CustomEvent('interact'));
      });
      el.addEventListener('pointermove', e => {
        if (!pts.has(e.pointerId)) return;
        pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pts.size >= 2) {
          const [a, b] = [...pts.values()];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (pinch) this.fov = this._fov * (pinch / d);
          pinch = d; last = null; return;
        }
        if (!last) { last = { x: e.clientX, y: e.clientY }; return; }
        const k = (this._fov / Math.max(1, this.clientHeight)) * 1.35;
        const dx = e.clientX - last.x, dy = e.clientY - last.y;
        this._yaw -= dx * k; this.pitch = this._pitch - dy * k;
        const now = performance.now(), dt = Math.max(8, now - lastT);
        this._vy = (-dx * k) / dt * 16; this._vp = (-dy * k) / dt * 16;
        last = { x: e.clientX, y: e.clientY }; lastT = now;
        this._emit();
      });
      const up = e => {
        pts.delete(e.pointerId);
        if (pts.size < 2) pinch = 0;
        if (pts.size === 0) { this._drag = false; last = null; this.dispatchEvent(new CustomEvent('release')); }
      };
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
      el.addEventListener('wheel', e => { e.preventDefault(); this.fov = this._fov + e.deltaY * 0.0012; }, { passive: false });
    }

    _step() {
      const gl = this.gl; if (!gl) return;
      if (this._tween) this._tween();
      if (!this._drag) {
        if (Math.abs(this._vy) > 1e-5 || Math.abs(this._vp) > 1e-5) {
          this._yaw += this._vy; this.pitch = this._pitch + this._vp;
          this._vy *= 0.94; this._vp *= 0.9;
          this._emit();
        }
        if (this.autoSpin && !this._tween) { this._yaw += 0.0012; this._emit(); }
      }
      if (this._fading) {
        this._mix = Math.min(1, this._mix + 0.055);
        if (this._mix >= 1) {
          this._fading = false;
          gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex[0]);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, this._img1);
          this._img0 = this._img1; this._mix = 0;
        }
      }
      gl.uniform1f(this.u.mixf, this._mix);
      gl.uniform1f(this.u.yaw, this._yaw);
      gl.uniform1f(this.u.pitch, this._pitch);
      gl.uniform1f(this.u.fovy, this._fov);
      gl.uniform1f(this.u.aspect, this._aspect || 1);
      gl.uniform1f(this.u.fade, this._fade);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  }
  if (!window.customElements.get('pano-view')) customElements.define('pano-view', PanoView);
})();
