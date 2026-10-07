// src/entities.js —— 实体/规则
// 职责：Ball/Paddle/Bricks 的运动、碰撞几何与关卡/得分规则（纯逻辑，不渲染）

var Entities = {
  // 签名: makePaddle(w:Number, h:Number) -> Object  底部挡板实体
  makePaddle: function (w, h) {
    return { x: 0, y: 0, w: w, h: h };
  },

  // 签名: makeBall(state:Object) -> Object  依附挡板的待发球（phase ready 时跟随）
  makeBall: function (state) {
    var p = state.paddle;
    return {
      x: p.x + p.w / 2,
      y: p.y - 10,
      vx: 0,
      vy: 0,
      r: 8
    };
  },

  // 签名: stepBall(state:Object) -> void  球位移+墙反弹；返回前写 state.missed
  stepBall: function (state) {
    state.missed = false;
    var b = state.ball;
    b.x += b.vx;
    b.y += b.vy;
    if (b.x - b.r < 0) { b.x = b.r; b.vx = Math.abs(b.vx); }
    if (b.x + b.r > state.w) { b.x = state.w - b.r; b.vx = -Math.abs(b.vx); }
    if (b.y - b.r < 0) { b.y = b.r; b.vy = Math.abs(b.vy); }
    if (b.y - b.r > state.h) { state.missed = true; }
  },

  // 签名: bouncePaddle(state:Object) -> void  球撞挡板：按命中位置偏移反射角
  bouncePaddle: function (state) {
    var b = state.ball, p = state.paddle;
    if (b.vy <= 0) return;
    if (b.y + b.r < p.y || b.y - b.r > p.y + p.h) return;
    if (b.x < p.x - b.r || b.x > p.x + p.w + b.r) return;
    b.y = p.y - b.r;
    var speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy) || 1;
    var offset = (b.x - (p.x + p.w / 2)) / (p.w / 2); // -1..1
    if (offset > 1) offset = 1;
    if (offset < -1) offset = -1;
    var angle = offset * (Math.PI / 3); // 最大 60°
    b.vx = speed * Math.sin(angle);
    b.vy = -Math.abs(speed * Math.cos(angle));
  },

  // 签名: hitBricks(state:Object) -> Number  球-砖 AABB 碰撞：反弹+置死+返回本帧得分
  hitBricks: function (state) {
    var b = state.ball, score = 0;
    var bricks = state.bricks || [];
    for (var i = 0; i < bricks.length; i++) {
      var k = bricks[i];
      if (k.dead) continue;
      // 圆-矩形最近点判定
      var cx = Math.max(k.x, Math.min(b.x, k.x + k.w));
      var cy = Math.max(k.y, Math.min(b.y, k.y + k.h));
      var dx = b.x - cx, dy = b.y - cy;
      if (dx * dx + dy * dy > b.r * b.r) continue;
      k.dead = true;
      score += k.points || 10;
      // 按最近点位置决定反弹轴（用重叠量比较更稳）
      var overlapL = b.x + b.r - k.x;
      var overlapR = k.x + k.w - (b.x - b.r);
      var overlapT = b.y + b.r - k.y;
      var overlapB = k.y + k.h - (b.y - b.r);
      var minX = Math.min(overlapL, overlapR);
      var minY = Math.min(overlapT, overlapB);
      if (minX < minY) {
        b.vx = -b.vx;
      } else {
        b.vy = -b.vy;
      }
      break; // 每帧只处理一块砖
    }
    return score;
  },

  // 签名: bricksLeft(state:Object) -> Number  存活砖数（0 = 过关）
  bricksLeft: function (state) {
    var n = 0, bricks = state.bricks || [];
    for (var i = 0; i < bricks.length; i++) {
      if (!bricks[i].dead) n++;
    }
    return n;
  },

  // 签名: nextLevel(state:Object) -> void  过关：level+1、球加速、重建砖阵
  nextLevel: function (state) {
    state.level += 1;
    var b = state.ball;
    var speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
    if (speed > 0) {
      var ns = speed * 1.1;
      var s = ns / speed;
      b.vx *= s;
      b.vy *= s;
    }
    state.bricks = Game.buildLevel(state.level);
  },

  // 签名: clampPaddle(state:Object, x:Number) -> void  挡板跟随并夹在画布内
  clampPaddle: function (state, x) {
    var p = state.paddle;
    p.x = x - p.w / 2;
    if (p.x < 0) p.x = 0;
    if (p.x + p.w > state.w) p.x = state.w - p.w;
  }
};
