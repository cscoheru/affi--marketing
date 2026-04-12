# Mobile Responsive Adaptation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the tower defense game fully playable on mobile browsers via CSS responsive layout and touch gesture support, without changing desktop behavior.

**Architecture:** CSS `@media (max-width: 768px)` breakpoint switches from fixed 1100×700 container to full-screen layout. Canvas stays at 800×600 logical pixels, scaled by CSS. A new `ViewportManager` class wraps canvas in a pannable/zoomable div. `InputHandler` gains touch event handling with gesture recognition (tap/long-press/drag/pinch). Shop panel becomes a bottom drawer on mobile.

**Tech Stack:** Vanilla CSS media queries, CSS transform for viewport, Touch Events API, no dependencies.

---

### Task 1: HTML Structure Changes

**Files:**
- Modify: `index.html:43-68` (game-screen area)
- Modify: `index.html:83-102` (editor-screen)
- Modify: `index.html:114-151` (pvp-lobby-screen)
- Modify: `index.html:153-169` (pvp-game-screen)

**Step 1: Add viewport meta tag**

The `<head>` already has `<meta name="viewport" content="width=device-width, initial-scale=1.0">`. Verify it exists. If not, add it.

**Step 2: Wrap game canvas in a viewport div**

In `index.html`, inside `#game-area`, wrap the canvas:

```html
<!-- Before -->
<canvas id="game-canvas" width="800" height="600"></canvas>

<!-- After -->
<div id="canvas-viewport">
    <canvas id="game-canvas" width="800" height="600"></canvas>
</div>
```

**Step 3: Add shop drawer toggle button for mobile**

After the `#shop-panel` div, add a mobile-only toggle:

```html
<button id="btn-toggle-shop" class="mobile-only ctrl-btn">武器库</button>
```

**Step 4: Wrap editor canvas in viewport div**

```html
<!-- Before -->
<canvas id="editor-canvas" width="800" height="600"></canvas>

<!-- After -->
<div id="editor-viewport">
    <canvas id="editor-canvas" width="800" height="600"></canvas>
</div>
```

**Step 5: Add editor mode toggle button**

Add inside `#editor-toolbar` before the save button:

```html
<button id="btn-editor-pan" class="tool-btn mobile-only">拖拽</button>
```

**Step 6: Wrap PvP canvas in viewport div**

```html
<!-- Before -->
<canvas id="pvp-canvas" width="800" height="600"></canvas>

<!-- After -->
<div id="pvp-viewport">
    <canvas id="pvp-canvas" width="800" height="600"></canvas>
</div>
```

**Step 7: Commit**

```bash
git add index.html
git commit -m "refactor: add viewport wrappers and mobile toggle buttons"
```

---

### Task 2: ViewportManager Class

**Files:**
- Create: `js/viewport.js`

**Step 1: Create the ViewportManager class**

```javascript
// js/viewport.js - Pan/zoom viewport for mobile canvas interaction

export class ViewportManager {
    constructor(viewportEl) {
        this.el = viewportEl;
        this.canvas = viewportEl.querySelector('canvas');
        this.translateX = 0;
        this.translateY = 0;
        this.scale = 1;
        this.minScale = 0.5;
        this.maxScale = 2.0;
        this._isPanning = false;
        this._lastTouchX = 0;
        this._lastTouchY = 0;
        this._lastPinchDist = 0;
        this._enabled = false; // only active when touch events exist
        this._setupTouch();
    }

    enable() { this._enabled = true; }
    disable() { this._enabled = false; }

    _setupTouch() {
        this.el.addEventListener('touchstart', (e) => this._onTouchStart(e), { passive: false });
        this.el.addEventListener('touchmove', (e) => this._onTouchMove(e), { passive: false });
        this.el.addEventListener('touchend', (e) => this._onTouchEnd(e), { passive: false });
    }

    _onTouchStart(e) {
        if (!this._enabled) return;
        if (e.touches.length === 1) {
            this._isPanning = true;
            this._lastTouchX = e.touches[0].clientX;
            this._lastTouchY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
            this._isPanning = false;
            this._lastPinchDist = this._pinchDist(e.touches);
        }
    }

    _onTouchMove(e) {
        if (!this._enabled) return;
        e.preventDefault();

        if (e.touches.length === 1 && this._isPanning) {
            const dx = e.touches[0].clientX - this._lastTouchX;
            const dy = e.touches[0].clientY - this._lastTouchY;
            this._lastTouchX = e.touches[0].clientX;
            this._lastTouchY = e.touches[0].clientY;
            this.translateX += dx;
            this.translateY += dy;
            this._applyTransform();
        } else if (e.touches.length === 2) {
            const dist = this._pinchDist(e.touches);
            const delta = dist / this._lastPinchDist;
            this.scale = Math.max(this.minScale, Math.min(this.maxScale, this.scale * delta));
            this._lastPinchDist = dist;
            this._applyTransform();
        }
    }

    _onTouchEnd(e) {
        if (e.touches.length < 2) this._isPanning = false;
    }

    _pinchDist(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.hypot(dx, dy);
    }

    _applyTransform() {
        this.canvas.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
        this.canvas.style.transformOrigin = '0 0';
    }

    // Convert screen coordinates to canvas logical coordinates
    screenToCanvas(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const cssX = clientX - rect.left;
        const cssY = clientY - rect.top;
        const logicalX = cssX / this.scale;
        const logicalY = cssY / this.scale;
        return { x: logicalX, y: logicalY };
    }

    reset() {
        this.translateX = 0;
        this.translateY = 0;
        this.scale = 1;
        this._applyTransform();
    }

    // Clamp translate so canvas doesn't go too far off-screen
    clampToViewport() {
        const containerW = this.el.clientWidth;
        const containerH = this.el.clientHeight;
        const canvasW = 800 * this.scale;
        const canvasH = 600 * this.scale;
        // Allow some overflow but clamp extremes
        if (canvasW <= containerW) {
            this.translateX = (containerW - canvasW) / 2;
        } else {
            this.translateX = Math.min(0, Math.max(containerW - canvasW, this.translateX));
        }
        if (canvasH <= containerH) {
            this.translateY = (containerH - canvasH) / 2;
        } else {
            this.translateY = Math.min(0, Math.max(containerH - canvasH, this.translateY));
        }
        this._applyTransform();
    }
}
```

**Step 2: Commit**

```bash
git add js/viewport.js
git commit -m "feat: add ViewportManager for mobile pan/zoom"
```

---

### Task 3: Touch Input Handling

**Files:**
- Modify: `js/input.js` (full rewrite)

**Step 1: Add touch gesture recognition to InputHandler**

Replace the entire `js/input.js` with:

```javascript
// js/input.js - Input handling system (mouse + touch)

export class InputHandler {
    constructor(canvas, viewportManager = null) {
        this.canvas = canvas;
        this.viewport = viewportManager;
        this.mouse = { x: 0, y: 0, gridX: 0, gridY: 0, clicked: false, rightClicked: false, longPressed: false };
        this.keys = {};
        this.isMobile = 'ontouchstart' in window;

        // Touch state
        this._touchStartTime = 0;
        this._touchStartPos = { x: 0, y: 0 };
        this._touchMoved = false;
        this._longPressTimer = null;
        this._touchEnded = false; // flag for tap detection

        // Drawing mode for editor
        this.drawMode = !this.isMobile; // desktop starts in draw mode, mobile in pan mode

        this._setupMouse();
        if (this.isMobile) this._setupTouch();

        // Keyboard
        document.addEventListener('keydown', (e) => this.keys[e.key] = true);
        document.addEventListener('keyup', (e) => this.keys[e.key] = false);
    }

    _setupMouse() {
        this.canvas.addEventListener('mousemove', (e) => this._onMouseMove(e));
        this.canvas.addEventListener('mousedown', (e) => this._onMouseDown(e));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    _onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
        this.mouse.gridX = Math.floor(this.mouse.x / 20);
        this.mouse.gridY = Math.floor(this.mouse.y / 20);
    }

    _onMouseDown(e) {
        if (e.button === 0) this.mouse.clicked = true;
        if (e.button === 2) this.mouse.rightClicked = true;
    }

    _setupTouch() {
        this.canvas.addEventListener('touchstart', (e) => this._onTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this._onTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this._onTouchEnd(e), { passive: false });
    }

    _onTouchStart(e) {
        if (e.touches.length !== 1) return;
        // Don't prevent default here — let ViewportManager handle multi-touch
        const touch = e.touches[0];
        this._touchStartTime = Date.now();
        this._touchStartPos = { x: touch.clientX, y: touch.clientY };
        this._touchMoved = false;
        this._touchEnded = false;

        // Long press timer
        this._longPressTimer = setTimeout(() => {
            if (!this._touchMoved) {
                this.mouse.longPressed = true;
                this._updateTouchCoords(touch);
            }
        }, 500);
    }

    _onTouchMove(e) {
        if (e.touches.length !== 1) return;
        const touch = e.touches[0];
        const dx = touch.clientX - this._touchStartPos.x;
        const dy = touch.clientY - this._touchStartPos.y;

        if (Math.hypot(dx, dy) > 10) {
            this._touchMoved = true;
            clearTimeout(this._longPressTimer);
        }

        // Update coords for hover/preview
        this._updateTouchCoords(touch);
    }

    _onTouchEnd(e) {
        clearTimeout(this._longPressTimer);

        if (!this._touchMoved && e.changedTouches.length === 1) {
            // It's a tap
            const elapsed = Date.now() - this._touchStartTime;
            if (elapsed < 200) {
                this.mouse.clicked = true;
                this._updateTouchCoords(e.changedTouches[0]);
            }
        }
    }

    _updateTouchCoords(touch) {
        if (this.viewport) {
            const logical = this.viewport.screenToCanvas(touch.clientX, touch.clientY);
            this.mouse.x = logical.x;
            this.mouse.y = logical.y;
        } else {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = touch.clientX - rect.left;
            this.mouse.y = touch.clientY - rect.top;
        }
        this.mouse.gridX = Math.floor(this.mouse.x / 20);
        this.mouse.gridY = Math.floor(this.mouse.y / 20);
    }

    clearFrame() {
        this.mouse.clicked = false;
        this.mouse.rightClicked = false;
        this.mouse.longPressed = false;
    }
}
```

**Step 2: Commit**

```bash
git add js/input.js
git commit -m "feat: add touch gesture support to InputHandler"
```

---

### Task 4: CSS Responsive Layout — Global & Menu Screens

**Files:**
- Modify: `css/style.css`

**Step 1: Add mobile global styles and menu/difficulty/map screen overrides**

Append to the end of `css/style.css`:

```css
/* ========== Mobile Responsive (≤768px) ========== */

.mobile-only { display: none !important; }

@media (max-width: 768px) {
    .mobile-only { display: block !important; }

    body {
        overflow: auto;
        -webkit-tap-highlight-color: transparent;
    }

    #game-container {
        width: 100vw;
        height: 100vh;
        border-radius: 0;
        box-shadow: none;
    }

    /* Main Menu */
    .game-title {
        font-size: 36px;
        letter-spacing: 4px;
        margin-bottom: 24px;
    }
    .menu-buttons {
        width: 80%;
    }
    .menu-btn {
        width: 100%;
        font-size: 20px;
        padding: 14px 24px;
        touch-action: manipulation;
    }

    /* Difficulty */
    .difficulty-buttons {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        width: 80%;
    }
    .diff-btn {
        padding: 16px 12px;
        font-size: 16px;
        touch-action: manipulation;
    }

    /* Map Select */
    .map-list {
        flex-direction: column;
        width: 90%;
        max-height: 50vh;
    }
    .map-item {
        padding: 12px 16px;
        touch-action: manipulation;
    }

    /* Result overlay */
    #result-title {
        font-size: 32px;
    }
    #result-stats {
        font-size: 15px;
    }
}
```

**Step 2: Verify desktop unchanged**

Open in desktop browser, confirm layout is identical.

**Step 3: Commit**

```bash
git add css/style.css
git commit -m "feat(mobile): add responsive CSS for menu screens"
```

---

### Task 5: CSS Responsive — Game Screen

**Files:**
- Modify: `css/style.css` (append)

**Step 1: Add game screen mobile styles**

Append after the previous `@media` block (outside it, or add new `@media` block):

```css
@media (max-width: 768px) {
    /* Game Screen */
    #game-screen {
        justify-content: flex-start;
    }

    #hud {
        gap: 8px;
        padding: 6px 10px;
        font-size: 12px;
    }
    #hud span { padding: 2px 6px; }
    #hud-difficulty { display: none; }

    #game-area {
        flex-direction: column;
        position: relative;
        flex: 1;
        overflow: hidden;
    }

    #canvas-viewport {
        flex: 1;
        overflow: hidden;
        position: relative;
        touch-action: none;
    }
    #canvas-viewport canvas {
        transform-origin: 0 0;
        display: block;
    }

    /* Shop panel becomes bottom drawer */
    #shop-panel {
        width: 100%;
        max-height: 40vh;
        border-left: none;
        border-top: 2px solid #533483;
        overflow-y: auto;
        transition: max-height 0.3s ease;
    }
    #shop-panel.collapsed {
        max-height: 0;
        padding: 0 12px;
        overflow: hidden;
    }

    #btn-toggle-shop {
        position: absolute;
        bottom: 60px;
        right: 10px;
        z-index: 20;
        background: #533483;
        border: 2px solid #e94560;
        border-radius: 50%;
        width: 48px;
        height: 48px;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        touch-action: manipulation;
    }

    /* Control bar */
    #control-bar {
        gap: 6px;
        padding: 8px 10px;
    }
    .ctrl-btn {
        min-height: 44px;
        min-width: 44px;
        font-size: 13px;
        touch-action: manipulation;
    }

    /* Tower info becomes bottom panel */
    #tower-info {
        position: fixed !important;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 50;
        border-radius: 12px 12px 0 0;
        width: 100% !important;
    }
    .tower-info-content {
        padding: 16px;
    }
    .tower-info-buttons .ctrl-btn {
        min-height: 44px;
        font-size: 14px;
        flex: 1;
    }
}
```

**Step 2: Commit**

```bash
git add css/style.css
git commit -m "feat(mobile): add responsive CSS for game screen"
```

---

### Task 6: CSS Responsive — Editor & PvP Screens

**Files:**
- Modify: `css/style.css` (append)

**Step 1: Add editor and PvP mobile styles**

```css
@media (max-width: 768px) {
    /* Editor Screen */
    #editor-screen {
        flex-direction: column-reverse;
    }
    #editor-toolbar {
        order: 2;
        flex-wrap: nowrap;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        padding: 6px 8px;
        gap: 6px;
    }
    .tool-label { display: none; }
    .tool-sep { display: none; }
    .tool-btn {
        flex-shrink: 0;
        padding: 8px 14px;
        font-size: 14px;
        touch-action: manipulation;
        min-height: 40px;
    }
    #map-name-input {
        width: 100px;
        min-height: 40px;
        font-size: 14px;
    }

    #editor-viewport {
        flex: 1;
        overflow: hidden;
        position: relative;
        touch-action: none;
        order: 1;
    }
    #editor-viewport canvas {
        transform-origin: 0 0;
        display: block;
    }

    /* PvP Lobby */
    .lobby-section {
        flex-direction: column;
        width: 90%;
    }
    .lobby-box {
        min-width: auto;
        width: 100%;
    }
    .lobby-input {
        font-size: 22px;
        min-height: 48px;
    }
    .room-id {
        font-size: 24px;
    }

    /* PvP Game */
    #pvp-game-area {
        flex-direction: column;
        position: relative;
        overflow: hidden;
    }
    #pvp-viewport {
        flex: 1;
        overflow: hidden;
        position: relative;
        touch-action: none;
    }
    #pvp-viewport canvas {
        transform-origin: 0 0;
        display: block;
    }

    #pvp-side-panel {
        width: 100%;
        max-height: 40vh;
        border-left: none;
        border-top: 2px solid #533483;
        overflow-y: auto;
    }
    #pvp-side-panel.collapsed {
        max-height: 0;
        padding: 0 12px;
        overflow: hidden;
    }

    #pvp-hud {
        gap: 8px;
        padding: 6px 10px;
        font-size: 12px;
        flex-wrap: wrap;
    }

    #pvp-control-bar {
        gap: 6px;
        padding: 8px 10px;
    }
}
```

**Step 2: Commit**

```bash
git add css/style.css
git commit -m "feat(mobile): add responsive CSS for editor and PvP screens"
```

---

### Task 7: Integrate ViewportManager into App

**Files:**
- Modify: `js/main.js:1-16` (imports)
- Modify: `js/main.js:176-199` (_startGame)
- Modify: `js/main.js:403-407` (_initEditor)
- Modify: `js/main.js:497-528` (_startPvPGame)

**Step 1: Add ViewportManager import**

At the top of `js/main.js`, add after the existing imports:

```javascript
import { ViewportManager } from './viewport.js';
```

**Step 2: Add mobile detection property to App constructor**

After `this.lastTime = 0;` (line 31), add:

```javascript
this.isMobile = 'ontouchstart' in window;
```

**Step 3: Integrate viewport into _startGame**

In `_startGame`, after `this.input = new InputHandler(canvas);` (line 187), add viewport setup:

```javascript
// Viewport for mobile pan/zoom
const viewportEl = document.getElementById('canvas-viewport');
this.gameViewport = new ViewportManager(viewportEl);
this.input = new InputHandler(canvas, this.gameViewport);
if (this.isMobile) {
    this.gameViewport.enable();
    this.gameViewport.clampToViewport();
}
```

Remove the old `this.input = new InputHandler(canvas);` line (the one before the viewport code).

Also add shop drawer toggle logic at the end of `_startGame`, after `this._gameLoop(this.lastTime);`:

```javascript
// Mobile shop drawer
if (this.isMobile) {
    const shopPanel = document.getElementById('shop-panel');
    shopPanel.classList.add('collapsed');
    document.getElementById('btn-toggle-shop').addEventListener('click', () => {
        shopPanel.classList.toggle('collapsed');
    });
}
```

**Step 4: Integrate viewport into _initEditor**

Replace `_initEditor` with:

```javascript
_initEditor() {
    if (this.mapEditor) this.mapEditor.destroy();
    const canvas = document.getElementById('editor-canvas');
    this.mapEditor = new MapEditor(canvas, this.mapLoader);

    // Mobile viewport for editor
    if (this.isMobile) {
        const viewportEl = document.getElementById('editor-viewport');
        this.editorViewport = new ViewportManager(viewportEl);
        this.editorViewport.enable();
        this.editorViewport.clampToViewport();

        // Pan/draw mode toggle
        const panBtn = document.getElementById('btn-editor-pan');
        panBtn.addEventListener('click', () => {
            this.editorDrawMode = !this.editorDrawMode;
            panBtn.textContent = this.editorDrawMode ? '绘制' : '拖拽';
            panBtn.classList.toggle('active', this.editorDrawMode);
            this.editorViewport.enable();
        });
        this.editorDrawMode = false;
    }
}
```

**Step 5: Integrate viewport into _startPvPGame**

After `const input = new InputHandler(canvas);` (line 503), add:

```javascript
const input = new InputHandler(canvas, this.pvpViewport || null);
if (this.isMobile) {
    const viewportEl = document.getElementById('pvp-viewport');
    this.pvpViewport = new ViewportManager(viewportEl);
    this.pvpViewport.enable();
    this.pvpViewport.clampToViewport();
}
```

Remove the old `const input = new InputHandler(canvas);` line.

**Step 6: Commit**

```bash
git add js/main.js
git commit -m "feat: integrate ViewportManager into game, editor, and PvP"
```

---

### Task 8: Tower Info Mobile Behavior

**Files:**
- Modify: `js/main.js:335-365` (_showTowerInfo)
- Modify: `js/main.js:274-299` (_handleCanvasClick)

**Step 1: Update _handleCanvasClick to handle long press**

In `_handleCanvasClick`, after the existing code that checks `if (placed)`, add long press handling:

```javascript
_handleCanvasClick() {
    const { gridX, gridY, longPressed } = this.input.mouse;
    const { grid, economy, selectedTower } = this.game;

    if (selectedTower) {
        this._hideTowerInfo();
        const towerDef = TOWER_TYPES[selectedTower];
        if (economy.gold >= towerDef.price && grid.canPlace(gridX, gridY, towerDef)) {
            economy.spendGold(towerDef.price);
            const tower = createTower(selectedTower, gridX, gridY);
            this.game.towers.push(tower);
            grid.setOccupied(gridX, gridY, tower);
            this.sound.placeTower();
        }
        return;
    }

    const placed = grid.getEntityAt(gridX, gridY);
    if (placed) {
        this.game.selectedPlacedTower = placed;
        this._showTowerInfo(placed);
    } else {
        this.game.selectedPlacedTower = null;
        this._hideTowerInfo();
    }
}
```

This is the same as current code — long press is already handled by InputHandler setting `longPressed = true`, and `_showTowerInfo` is called when a placed tower is tapped. No change needed for this step.

**Step 2: Update _showTowerInfo for mobile**

Replace the `_showTowerInfo` method to position as bottom panel on mobile:

```javascript
_showTowerInfo(tower) {
    const panel = document.getElementById('tower-info');

    if (this.isMobile) {
        // Mobile: show as fixed bottom panel
        panel.style.left = '';
        panel.style.top = '';
        panel.style.display = 'block';
    } else {
        // Desktop: position near tower
        const gameArea = document.getElementById('game-area');
        const rect = gameArea.getBoundingClientRect();
        const containerRect = document.getElementById('game-container').getBoundingClientRect();

        let left = rect.left - containerRect.left + tower.centerX + 20;
        let top = rect.top - containerRect.top + tower.centerY - 40;

        if (left + 180 > containerRect.width) {
            left = rect.left - containerRect.left + tower.centerX - 190;
        }
        if (top < 0) top = 10;
        if (top + 120 > containerRect.height) top = containerRect.height - 130;

        panel.style.left = left + 'px';
        panel.style.top = top + 'px';
        panel.style.display = 'block';
    }

    document.getElementById('tower-info-name').textContent = `${tower.name} Lv.${tower.level}`;

    const upgradeCost = Math.floor(TOWER_TYPES[tower.type].price * 0.75 * tower.level);
    const sellValue = Math.floor(tower.price * 0.5 * tower.level);
    document.getElementById('tower-info-stats').innerHTML =
        `伤害: ${Math.round(tower.damage * 10) / 10}<br>` +
        `范围: ${Math.round(tower.range * 10) / 10}<br>` +
        `升级费用: ${upgradeCost} 金币<br>` +
        `出售价值: ${sellValue} 金币`;
}
```

**Step 3: Commit**

```bash
git add js/main.js
git commit -m "feat(mobile): tower info as bottom panel on mobile"
```

---

### Task 9: Editor Touch Drawing Support

**Files:**
- Modify: `js/map/map-editor.js:82-93` (_setupCanvasEvents)

**Step 1: Add touch events to MapEditor**

Replace `_setupCanvasEvents` in `map-editor.js`:

```javascript
_setupCanvasEvents() {
    // Mouse events
    this.canvas.addEventListener('mousedown', (e) => {
        this.isDrawing = true;
        this._paint(e);
    });
    this.canvas.addEventListener('mousemove', (e) => {
        if (this.isDrawing) this._paint(e);
    });
    this.canvas.addEventListener('mouseup', () => this.isDrawing = false);
    this.canvas.addEventListener('mouseleave', () => this.isDrawing = false);
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Touch events
    this.canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            this.isDrawing = true;
            this._paintTouch(e.touches[0]);
        }
    }, { passive: true });
    this.canvas.addEventListener('touchmove', (e) => {
        if (this.isDrawing && e.touches.length === 1) {
            this._paintTouch(e.touches[0]);
        }
    }, { passive: true });
    this.canvas.addEventListener('touchend', () => this.isDrawing = false);
}

_paintTouch(touch) {
    const rect = this.canvas.getBoundingClientRect();
    // Account for CSS scaling
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = Math.floor((touch.clientX - rect.left) * scaleX / CELL_SIZE);
    const y = Math.floor((touch.clientY - rect.top) * scaleY / CELL_SIZE);
    if (x < 0 || x >= GRID_COLS || y < 0 || y >= GRID_ROWS) return;

    const tool = this.currentTool;
    if (tool === 'start') {
        for (let ry = 0; ry < GRID_ROWS; ry++)
            for (let rx = 0; rx < GRID_COLS; rx++)
                if (this.grid[ry][rx] === CELL.START) this.grid[ry][rx] = CELL.PATH;
        this.grid[y][x] = CELL.START;
    } else if (tool === 'end') {
        for (let ry = 0; ry < GRID_ROWS; ry++)
            for (let rx = 0; rx < GRID_COLS; rx++)
                if (this.grid[ry][rx] === CELL.END) this.grid[ry][rx] = CELL.PATH;
        this.grid[y][x] = CELL.END;
    } else {
        const cellMap = { grass: CELL.GRASS, path: CELL.PATH, obstacle: CELL.OBSTACLE };
        this.grid[y][x] = cellMap[tool];
    }
    this.render();
}
```

**Step 2: Commit**

```bash
git add js/map/map-editor.js
git commit -m "feat(mobile): add touch drawing support to map editor"
```

---

### Task 10: Window Resize Handling

**Files:**
- Modify: `js/main.js` (add resize handler)

**Step 1: Add resize handler in App constructor**

After `this._showScreen('menu-screen');` in the constructor, add:

```javascript
window.addEventListener('resize', () => this._onResize());
```

**Step 2: Add _onResize method**

Add this method to the App class:

```javascript
_onResize() {
    if (this.gameViewport) this.gameViewport.clampToViewport();
    if (this.editorViewport) this.editorViewport.clampToViewport();
    if (this.pvpViewport) this.pvpViewport.clampToViewport();
}
```

**Step 3: Commit**

```bash
git add js/main.js
git commit -m "feat(mobile): add viewport resize handling"
```

---

### Task 11: Deploy Updated Files

**Files:**
- Deploy all changed files to Hangzhou server

**Step 1: Sync to server**

```bash
rsync -avz --exclude='node_modules' --exclude='.git' --exclude='docs' --exclude='.DS_Store' \
  -e "ssh hz-via-hk" \
  /Users/kjonekong/Documents/chuanqi-games/ \
  hz-via-hk:/opt/chuanqi-games/
```

**Step 2: Rebuild Docker image**

```bash
ssh hz-via-hk "cd /opt/chuanqi-games && docker build -t chuanqi-games . && docker rm -f chuanqi-games && docker run -d --name chuanqi-games --restart unless-stopped -p 3010:3010 chuanqi-games"
```

**Step 3: Verify**

Open `https://games.rana.asia` on both desktop and mobile. Verify:
- Desktop: layout unchanged
- Mobile: full-screen, touch controls work, shop drawer opens/closes
