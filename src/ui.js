// src/ui.js —— 界面与渲染
// 职责：UI 全局对象：canvas 主渲染 + stage 内 absolute 覆盖层（开始引导/结算）

var UI = {
  _stage: null,
  _overlay: null, // 开始/结束覆盖层（position:absolute，挂 stage 内）
  _hpColors: ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db'],

  // 签名: init(stage:Element, canvas:Element) -> void  建覆盖层 DOM（首帧给「点击/触摸开始」引导）
  init: function (stage, canvas) {
    this._stage = stage;
    this._overlay = document.createElement('div');
    this._overlay.style.position = 'absolute';
    this._overlay.style.left = '0';
    this._overlay.style.top = '0';
    this._overlay.style.width = '100%';
    this._overlay.style.height = '100%';
    this._overlay.style.display = 'flex';
    this._overlay.style.flexDirection = 'column';
    this._overlay.style.alignItems = 'center';
    this._overlay.style.justifyContent = 'center';
    this._overlay.style.color = '#fff';
    this._overlay.style.fontSize = '22px';
    this._overlay.style.textAlign = 'center';
    this._overlay.style.textShadow = '0 2px 4px rgba(0,0,0,0.6)';
    this._overlay.style.background = 'rgba(0,0,0,0.45)';
    this._overlay.style.pointerEvents = 'none';
    this._overlay.style.zIndex = '10';
    this._overlay.textContent = '点击 / 触摸开始 · 拖动挡板';
    stage.appendChild(this._overlay);
  },

  // 签名: render(g:CanvasRenderingContext2D, state:Object|null) -> void  每帧绘制
  render: function (g, state) {
    if (!state) return;
    var w = g.canvas.width, h = g.canvas.height;

    // 背景
    g.fillStyle = '#101828';
    g.fillRect(0, 0, w, h);

    // 砖块（按 hp 分色）
    var bricks = state.bricks || [];
    for (var i = 0; i < bricks.length; i++) {
      var b = bricks[i];
      if (!b || b.hp <= 0) continue;
      var ci = Math.min(b.hp - 1, this._hpColors.length - 1);
      g.fillStyle = this._hpColors[ci];
      g.fillRect(b.x, b.y, b.w, b.h);
      g.strokeStyle = 'rgba(0,0,0,0.35)';
      g.lineWidth = 1;
      g.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
    }

    // 挡板
    if (state.paddle) {
      var p = state.paddle;
      g.fillStyle = '#ecf0f1';
      g.fillRect(p.x, p.y, p.w, p.h);
    }

    // 球
    if (state.ball) {
      var ball = state.ball;
      g.beginPath();
      g.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      g.fillStyle = '#ffffff';
      g.fill();
    }

    // HUD：得分 / 关卡 / 命
    g.fillStyle = 'rgba(255,255,255,0.9)';
    g.font = 'bold 14px sans-serif';
    g.textBaseline = 'top';
    g.textAlign = 'left';
    g.fillText('得分: ' + (state.score || 0), 10, 8);
    g.fillText('关卡: ' + (state.level || 1), 10, 28);
    var livesStr = '';
    var lives = state.lives || 0;
    for (var j = 0; j < lives; j++) livesStr += '\u25CF ';
    g.fillText('命: ' + livesStr, 10, 48);
  },

  // 签名: showOverlay(text:String) -> void / hideOverlay() -> void
  showOverlay: function (text) {
    if (!this._overlay) return;
    this._overlay.style.display = 'flex';
    this._overlay.textContent = text;
  },
  hideOverlay: function () {
    if (!this._overlay) return;
    this._overlay.style.display = 'none';
  },

  // 签名: dispose() -> void  移除覆盖层（main.destroy 已移除 canvas）
  dispose: function () {
    if (this._overlay && this._overlay.parentNode) {
      this._overlay.parentNode.removeChild(this._overlay);
    }
    this._overlay = null;
    this._stage = null;
  }
};
