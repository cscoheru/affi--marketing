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
        this._enabled = false;
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
