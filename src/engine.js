// src/engine.js —— 状态与主循环
// 职责：Game 全局对象：初始化、步进更新、指针/键盘输入、状态导出

var Game = {
  w: 0, h: 0,
  state: null, // {phase:'ready'|'play'|'over', score, lives, level, ball, paddle, bricks}

  init: function (w, h) {
    this.w = w; this.h = h;
    this.state = {
      phase: 'ready',
      score: 0,
      lives: 3,
      level: 1,
      ball: null,
      paddle: null,
      bricks: []
    };
    this.state.paddle = {
      x: w / 2, y: h - 40,
      w: Math.max(70, w * 0.16), h: 12
    };
    this.state.ball = {
      x: w / 2, y: h - 60,
      r: 7,
      vx: 0, vy: 0,
      speed: 5
    };
    this.buildLevel(1);
  },

  resize: function (w, h) {
    if (!this.state) { this.w = w; this.h = h; return; }
    var ow = this.w, oh = this.h;
    if (!ow || !oh) ow = oh = 1;
    var sx = w / ow, sy = h / oh;
    this.w = w; this.h = h;
    var s = this.state;
    if (s.paddle) {
      s.paddle.x *= sx;
      s.paddle.y = Math.min(h - 20, s.paddle.y * sy);
      s.paddle.w = Math.max(70, w * 0.16);
    }
    if (s.ball) {
      s.ball.x *= sx;
      s.ball.y *= sy;
    }
    for (var i = 0; i < s.bricks.length; i++) {
      var b = s.bricks[i];
      b.x *= sx; b.y *= sy;
      b.w *= sx; b.h *= sy;
    }
  },

  buildLevel: function (level) {
    var s = this.state;
    s.bricks = [];
    var cols = Math.min(10, 5 + level);
    var rows = Math.min(7, 3 + Math.floor(level / 2));
    var margin = 20;
    var bw = (this.w - margin * 2) / cols;
    var bh = 20;
    var hpMax = Math.min(3, 1 + Math.floor(level / 3));
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        s.bricks.push({
          x: margin + c * bw + 2,
          y: 50 + r * (bh + 6),
          w: bw - 4,
          h: bh,
          alive: true,
          hp: hpMax
        });
      }
    }
  },

  onPointer: function (x, y, phase) {
    if (!this.state) return;
    var s = this.state;
    if (phase === 'down') {
      if (s.phase === 'ready') {
        s.phase = 'play';
        s.ball.vx = (Math.random() * 2 - 1) * 0.5 * s.ball.speed;
        var n = Math.sqrt(1 - Math.pow(s.ball.vx / s.ball.speed, 2));
        s.ball.vy = -n * s.ball.speed;
      } else if (s.phase === 'over') {
        this.init(this.w, this.h);
      }
    }
    if (s.paddle) {
      s.paddle.x = Math.max(s.paddle.w / 2, Math.min(this.w - s.paddle.w / 2, x));
    }
  },

  onKey: function (key) {
    if (!this.state) return;
    var s = this.state;
    var p = s.paddle;
    if (!p) return;
    var move = p.w * 0.5;
    if (key === 'ArrowLeft') {
      p.x = Math.max(p.w / 2, p.x - move);
    } else if (key === 'ArrowRight') {
      p.x = Math.min(this.w - p.w / 2, p.x + move);
    } else if (key === ' ') {
      if (s.phase === 'ready') this.onPointer(p.x, p.y, 'down');
      else if (s.phase === 'over') this.init(this.w, this.h);
    }
  },

  step: function (t) {
    if (!this.state || this.state.phase !== 'play') return;
    var s = this.state;
    var ball = s.ball, pad = s.paddle;
    var sp = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy) || 1;
    var steps = Math.max(1, Math.ceil(sp / (ball.r * 0.8)));
    for (var k = 0; k < steps; k++) {
      ball.x += ball.vx / steps;
      ball.y += ball.vy / steps;
      if (ball.x - ball.r < 0) { ball.x = ball.r; ball.vx = Math.abs(ball.vx); }
      if (ball.x + ball.r > this.w) { ball.x = this.w - ball.r; ball.vx = -Math.abs(ball.vx); }
      if (ball.y - ball.r < 0) { ball.y = ball.r; ball.vy = Math.abs(ball.vy); }
      // 挡板
      if (ball.vy > 0 &&
          ball.y + ball.r >= pad.y - pad.h / 2 &&
          ball.y - ball.r <= pad.y + pad.h / 2 &&
          ball.x >= pad.x - pad.w / 2 - ball.r &&
          ball.x <= pad.x + pad.w / 2 + ball.r) {
        ball.y = pad.y - pad.h / 2 - ball.r;
        var rel = (ball.x - pad.x) / (pad.w / 2);
        var ang = rel * Math.PI / 3;
        ball.vx = Math.sin(ang) * ball.speed;
        ball.vy = -Math.abs(Math.cos(ang) * ball.speed);
      }
      // 砖块
      for (var i = 0; i < s.bricks.length; i++) {
        var b = s.bricks[i];
        if (!b.alive) continue;
        if (ball.x + ball.r > b.x && ball.x - ball.r < b.x + b.w &&
            ball.y + ball.r > b.y && ball.y - ball.r < b.y + b.h) {
          var fromLeft = Math.abs(ball.x - b.x);
          var fromRight = Math.abs(b.x + b.w - ball.x);
          var fromTop = Math.abs(ball.y - b.y);
          var fromBottom = Math.abs(b.y + b.h - ball.y);
          var m = Math.min(fromLeft, fromRight, fromTop, fromBottom);
          if (m === fromTop || m === fromBottom) ball.vy = -ball.vy;
          else ball.vx = -ball.vx;
          b.hp -= 1;
          if (b.hp <= 0) b.alive = false;
          s.score += 10 * s.level;
          break;
        }
      }
    }
    // 漏球
    if (ball.y - ball.r > this.h) {
      s.lives -= 1;
      if (s.lives <= 0) {
        s.phase = 'over';
      } else {
        s.phase = 'ready';
        ball.x = pad.x;
        ball.y = pad.y - ball.r - 14;
        ball.vx = 0; ball.vy = 0;
      }
      return;
    }
    // 过关
    var anyAlive = false;
    for (var j = 0; j < s.bricks.length; j++) {
      if (s.bricks[j].alive) { anyAlive = true; break; }
    }
    if (!anyAlive) {
      s.level += 1;
      s.score += 100;
      s.phase = 'ready';
      ball.speed += 0.6;
      ball.x = pad.x;
      ball.y = pad.y - ball.r - 14;
      ball.vx = 0; ball.vy = 0;
      this.buildLevel(s.level);
    }
  },

  getState: function () {
    return this.state;
  },

  dispose: function () {
    this.state = null;
  }
};
