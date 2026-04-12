// js/systems/pathfinding.js - BFS pathfinding for enemy movement

import { CELL } from '../config.js';

export function findPath(grid, startX, startY, endX, endY) {
    const cols = grid.cols;
    const rows = grid.rows;
    const visited = new Set();
    const queue = [{ x: startX, y: startY, path: [{ x: startX, y: startY }] }];
    visited.add(`${startX},${startY}`);

    const directions = [
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 }
    ];

    while (queue.length > 0) {
        const current = queue.shift();

        if (current.x === endX && current.y === endY) {
            return current.path;
        }

        for (const { dx, dy } of directions) {
            const nx = current.x + dx;
            const ny = current.y + dy;
            const key = `${nx},${ny}`;

            if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
            if (visited.has(key)) continue;

            const cell = grid.getCell(nx, ny);
            if (cell === CELL.PATH || cell === CELL.START || cell === CELL.END) {
                visited.add(key);
                queue.push({ x: nx, y: ny, path: [...current.path, { x: nx, y: ny }] });
            }
        }
    }

    return null;
}

export function calculatePathPixels(path) {
    return path.map(p => ({
        x: p.x * 20 + 10,
        y: p.y * 20 + 10
    }));
}
