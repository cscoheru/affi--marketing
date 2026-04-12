// js/input.js - Input handling system

export class InputHandler {
    constructor(canvas) {
        this.canvas = canvas;
        this.mouse = { x: 0, y: 0, gridX: 0, gridY: 0, clicked: false, rightClicked: false };
        this.keys = {};

        canvas.addEventListener('mousemove', (e) => this._onMouseMove(e));
        canvas.addEventListener('mousedown', (e) => this._onMouseDown(e));
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        document.addEventListener('keydown', (e) => this.keys[e.key] = true);
        document.addEventListener('keyup', (e) => this.keys[e.key] = false);
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

    clearFrame() {
        this.mouse.clicked = false;
        this.mouse.rightClicked = false;
    }
}
