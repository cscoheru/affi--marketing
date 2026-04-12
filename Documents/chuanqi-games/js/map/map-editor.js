// js/map/map-editor.js - Interactive map editor

import { GRID_COLS, GRID_ROWS, CELL, CELL_SIZE } from '../config.js';
import { findPath } from '../systems/pathfinding.js';

export class MapEditor {
    constructor(canvas, mapLoader) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.mapLoader = mapLoader;
        this.grid = mapLoader.createDefaultMap();
        this.currentTool = 'grass';
        this.isDrawing = false;

        this._setupToolbar();
        this._setupCanvasEvents();
        this.render();
    }

    _setupToolbar() {
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentTool = btn.dataset.tool;
            });
        });

        document.getElementById('btn-clear-map').addEventListener('click', () => {
            this.grid = this.mapLoader.createEmptyGrid();
            this.render();
        });

        document.getElementById('btn-save-map').addEventListener('click', () => {
            const name = document.getElementById('map-name-input').value.trim();
            if (!name) { alert('请输入地图名称'); return; }

            let hasStart = false, hasEnd = false;
            for (let y = 0; y < GRID_ROWS; y++) {
                for (let x = 0; x < GRID_COLS; x++) {
                    if (this.grid[y][x] === CELL.START) hasStart = true;
                    if (this.grid[y][x] === CELL.END) hasEnd = true;
                }
            }
            if (!hasStart || !hasEnd) { alert('请设置起点和终点'); return; }

            this.mapLoader.saveMap(name, this.grid);
            alert(`地图 "${name}" 已保存`);
        });

        document.getElementById('btn-load-map').addEventListener('click', () => {
            const maps = this.mapLoader.listMaps();
            if (maps.length === 0) { alert('没有已保存的地图'); return; }
            const name = prompt('输入地图名称:\n' + maps.join(', '));
            if (!name) return;
            const data = this.mapLoader.loadMap(name);
            if (data) {
                this.grid = data.grid;
                this.render();
            } else {
                alert('地图不存在或无效');
            }
        });

        document.getElementById('btn-test-map').addEventListener('click', () => {
            let start = null, end = null;
            for (let y = 0; y < GRID_ROWS; y++) {
                for (let x = 0; x < GRID_COLS; x++) {
                    if (this.grid[y][x] === CELL.START) start = { x, y };
                    if (this.grid[y][x] === CELL.END) end = { x, y };
                }
            }
            if (!start || !end) { alert('请设置起点和终点'); return; }

            const path = findPath({ cols: GRID_COLS, rows: GRID_ROWS, getCell: (x, y) => this.grid[y]?.[x] ?? CELL.OBSTACLE }, start.x, start.y, end.x, end.y);
            if (!path) { alert('起点到终点之间没有有效路径'); return; }

            alert('地图验证通过！');
        });
    }

    _setupCanvasEvents() {
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
    }

    _paint(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
        const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);
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

    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let y = 0; y < GRID_ROWS; y++) {
            for (let x = 0; x < GRID_COLS; x++) {
                const cell = this.grid[y][x];
                const px = x * CELL_SIZE;
                const py = y * CELL_SIZE;

                switch (cell) {
                    case CELL.GRASS:
                        ctx.fillStyle = (x + y) % 2 === 0 ? '#2a5d45' : '#2d6349';
                        break;
                    case CELL.PATH:
                        ctx.fillStyle = '#8b7355';
                        break;
                    case CELL.OBSTACLE:
                        ctx.fillStyle = '#555';
                        break;
                    case CELL.START:
                        ctx.fillStyle = '#4ecca3';
                        break;
                    case CELL.END:
                        ctx.fillStyle = '#e94560';
                        break;
                }

                ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);

                ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                ctx.strokeRect(px, py, CELL_SIZE, CELL_SIZE);
            }
        }
    }

    destroy() {
        this.canvas.replaceWith(this.canvas.cloneNode(true));
    }
}
