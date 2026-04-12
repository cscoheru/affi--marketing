// js/map/map-loader.js - Map save/load with localStorage

import { GRID_COLS, GRID_ROWS, CELL } from '../config.js';
import { findPath, calculatePathPixels } from '../systems/pathfinding.js';
import { Grid } from '../systems/grid.js';

const STORAGE_PREFIX = 'td_map_';

export class MapLoader {
    listMaps() {
        const maps = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(STORAGE_PREFIX)) {
                maps.push(key.slice(STORAGE_PREFIX.length));
            }
        }
        return maps;
    }

    saveMap(name, gridData) {
        const data = JSON.stringify(gridData);
        localStorage.setItem(STORAGE_PREFIX + name, data);
    }

    loadMap(name) {
        const data = localStorage.getItem(STORAGE_PREFIX + name);
        if (!data) return null;

        const gridData = JSON.parse(data);
        const grid = new Grid(gridData);

        const start = grid.getStartPos();
        const end = grid.getEndPos();

        if (!start || !end) return null;

        const path = findPath(grid, start.x, start.y, end.x, end.y);
        if (!path) return null;

        return {
            grid: gridData,
            path: calculatePathPixels(path),
            pathGrid: path,
            pathLength: path.length,
            start, end
        };
    }

    deleteMap(name) {
        localStorage.removeItem(STORAGE_PREFIX + name);
    }

    createEmptyGrid() {
        const grid = [];
        for (let y = 0; y < GRID_ROWS; y++) {
            grid.push(new Array(GRID_COLS).fill(CELL.GRASS));
        }
        return grid;
    }

    createDefaultMap() {
        const grid = this.createEmptyGrid();

        const pathCells = [];
        for (let x = 2; x < 38; x++) pathCells.push({ x, y: 5 });
        for (let y = 6; y < 15; y++) pathCells.push({ x: 37, y });
        for (let x = 36; x >= 3; x--) pathCells.push({ x, y: 15 });
        for (let y = 16; y < 25; y++) pathCells.push({ x: 3, y });
        for (let x = 4; x < 38; x++) pathCells.push({ x, y: 25 });

        pathCells.forEach(p => grid[p.y][p.x] = CELL.PATH);
        grid[5][2] = CELL.START;
        grid[25][37] = CELL.END;

        return grid;
    }
}
