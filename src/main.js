// src/main.js —— 入口：画布创建、模块装配、容器合同
// 职责：唯一 Work.register 声明处；mount 建画布+监听；destroy 清 RAF/监听

var __rafId = 0;            // RAF 句柄（闭包可见，destroy 取消）
var __canvas = null;        // 画布元素
var __g = null;             // 2D 上下文（约定名 g，禁止叫 ctx）
var __handlers = [];        // 待解绑的 [el, type, fn] 列表

function _on(el, type, fn) {
  el.addEventListener(type, fn);
  __handlers.push([el, type, fn]);
}

function _offAll() {
  for (var i = 0; i < __handlers.length; i++) {
    __handlers[i][0].removeEventListener(__handlers[i][1], __handlers[i][2]);
  }
  __handlers = [];
}

Work.register({
  mount: function (ctx) {
    // 1) 建画布（尺寸合同：w/h 字段 + onBounds 跟随，注册即补发一次）
    __canvas = document.createElement('canvas');
    __canvas.width = ctx.bounds.w;
    __canvas.height = ctx.bounds.h;
    __canvas.style.position = 'absolute';
    __canvas.style.left = '0';
    __canvas.style.top = '0';
    __canvas.style.touchAction = 'none'; // 触屏拖动不被浏览器手势打断
    __g = __canvas.getContext('2d');
    ctx.stage.appendChild(__canvas);

    ctx.onBounds(function (b) {
      __canvas.width = b.w;
      __canvas.height = b.h;
      Game.resize(b.w, b.h);
    });

    // 2) 装配模块
    Game.init(ctx.bounds.w, ctx.bounds.h);
    UI.init(ctx.stage, __canvas);

    // 3) 交互合同：指针事件承载核心操作（拖挡板 + 发球），键盘为快捷方式
    _on(__canvas, 'pointerdown', function (e) {
      Game.onPointer(e.offsetX, e.offsetY, 'down');
    });
    _on(__canvas, 'pointermove', function (e) {
      Game.onPointer(e.offsetX, e.offsetY, 'move');
    });
    _on(window, 'keydown', function (e) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
      }
      Game.onKey(e.key);
    });

    // 4) 主循环：步进引擎状态，交给 UI 渲染
    var loop = function (t) {
      Game.step(t);
      UI.render(__g, Game.getState());
      __rafId = requestAnimationFrame(loop);
    };
    __rafId = requestAnimationFrame(loop);
  },
  destroy: function () {
    // 清理合同：cancel RAF + 解绑全部监听 + 引擎/界面清理 + 移除节点
    if (__rafId) { cancelAnimationFrame(__rafId); __rafId = 0; }
    _offAll();
    Game.dispose();
    UI.dispose();
    if (__canvas && __canvas.parentNode) __canvas.parentNode.removeChild(__canvas);
    __canvas = null; __g = null;
  }
});
