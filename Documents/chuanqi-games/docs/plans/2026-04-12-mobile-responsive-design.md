# 手机版响应式适配 - 设计文档

## 概述

在现有桌面版传奇塔防基础上，通过 CSS 响应式 + 触摸事件层实现手机浏览器适配。一套代码同时支持桌面和手机。

## 技术方案

**方案 A：CSS 响应式 + 触摸事件层**

- CSS `@media (max-width: 768px)` 断点切换全屏布局
- Canvas 逻辑分辨率不变（800×600），用 CSS 缩放适配
- InputHandler 新增触摸手势识别（点击/长按/拖拽/缩放）
- 桌面版零影响

## 响应式布局

| 区域 | 桌面 | 手机 (≤768px) |
|------|------|------|
| 游戏容器 | 1100×700 居中 | 100vw × 100vh 全屏 |
| HUD | 顶栏一行，18px | 顶栏紧凑，12px |
| Canvas + 商店 | 左右并排 | Canvas 占满，商店变底部抽屉 |
| 控制栏 | 底部一行 | 底部固定，按钮 44px+ |
| 编辑器工具栏 | 顶部横排 | 底部水平滚动 |
| PvP 大厅 | 左右两栏 | 上下堆叠 |
| Tower Info | 鼠标位置浮窗 | 底部弹出面板 |

## 触摸交互系统

### 手势识别

| 手势 | 识别条件 | 行为 |
|------|---------|------|
| 点击 | touchstart → touchend < 200ms，位移 < 10px | 等同鼠标点击 |
| 长按 | touchstart > 500ms | 查看塔信息 |
| 拖拽 | touchmove 位移 > 10px | 平移地图 viewport |
| 双指缩放 | 两指距离变化 | 缩放 0.5~2.0 |

### 实现

- Canvas 外层包 `#canvas-viewport` div
- CSS `transform: translate(x, y) scale(s)` 控制视口
- 触摸坐标通过 `getBoundingClientRect()` + inverse transform 换算回逻辑坐标
- 加 `touch-action: none` 在 canvas 上防止浏览器默认手势

### 地图编辑器特殊处理

- 新增"拖拽/绘制"模式切换按钮
- 绘制模式：单指滑动连续画格子
- 拖拽模式：单指移动视口

## 各屏幕适配

### 主菜单
- 标题 36px，按钮全宽 80%，字号 20px
- `touch-action: manipulation` 消除 300ms 延迟

### 难度选择
- 按钮改为 2×2 网格

### 地图选择
- 地图列表单列显示

### 游戏画面
- HUD 紧凑：12px 字号
- 商店底部抽屉：默认收起（图标行），点击展开
- 控制栏按钮 min-height 44px
- Tower Info 底部弹出面板

### 地图编辑器
- 工具栏底部水平滚动
- Canvas 占满上方

### PvP 大厅
- 两栏改上下堆叠
- 房间号 24px，输入框加大

### PvP 游戏
- 进攻方派兵面板底部抽屉
- 准备/返回按钮加大

## 文件变更范围

- `css/style.css` — 新增 `@media` 断点，所有屏幕的移动样式
- `js/input.js` — 新增触摸事件处理和手势识别
- `js/main.js` — 商店抽屉逻辑、视口管理、触摸坐标转换
- `index.html` — Canvas 外层 viewport div、商店抽屉结构、meta viewport 标签确认
