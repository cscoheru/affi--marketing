// js/systems/grid.js - Grid management for tower placement and path validation

import { CELL, CELL_SIZE, TOWER_TYPES } from '../config.js';

export class Grid {
    constructor(gridData) {
        this.cols = gridData[0].length;
        this.rows = gridData.length;
        this.cells = gridData.map(row => [...row]);
        this.occupants = {};
    }

    getCell(x, y) {
        if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return CELL.OBSTACLE;
        return this.cells[y][x];
    }

    setCell(x, y, type) {
        if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
            this.cells[y][x] = type;
        }
    }

    canPlace(x, y, towerDef) {
        if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return false;
        const cell = this.cells[y][x];
        if (cell !== CELL.GRASS && cell !== CELL.PATH) return false;

        if (towerDef.category === 'trap' && cell !== CELL.PATH) return false;
        if (towerDef.category === 'tower' && cell !== CELL.GRASS) return false;

        if (this.occupants[`${x},${y}`]) return false;

        return true;
    }

    setOccupied(x, y, tower) {
        this.occupants[`${x},${y}`] = tower;
    }

    removeOccupant(x, y) {
        delete this.occupants[`${x},${y}`];
    }

    getEntityAt(x, y) {
        return this.occupants[`${x},${y}`] || null;
    }

    isPath(x, y) {
        return this.getCell(x, y) === CELL.PATH || this.getCell(x, y) === CELL.START;
    }

    getStartPos() {
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.cells[y][x] === CELL.START) return { x, y };
            }
        }
        return null;
    }

    getEndPos() {
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.cells[y][x] === CELL.END) return { x, y };
            }
        }
        return null;
    }

    clone() {
        return new Grid(this.cells);
    }
}
