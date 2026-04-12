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

        this._setupMouse();
        if (this.isMobile) this._setupTouch();

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
        this.canvas.addEventListener('touchstart', (e) => this._onTouchStart(e), { passive: true });
        this.canvas.addEventListener('touchmove', (e) => this._onTouchMove(e), { passive: true });
        this.canvas.addEventListener('touchend', (e) => this._onTouchEnd(e), { passive: true });
    }

    _onTouchStart(e) {
        if (e.touches.length !== 1) return;
        const touch = e.touches[0];
        this._touchStartTime = Date.now();
        this._touchStartPos = { x: touch.clientX, y: touch.clientY };
        this._touchMoved = false;

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

        this._updateTouchCoords(touch);
    }

    _onTouchEnd(e) {
        clearTimeout(this._longPressTimer);

        if (!this._touchMoved && e.changedTouches.length === 1) {
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
