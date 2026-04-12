// js/renderer.js - Canvas renderer with cartoon art style

import {
    CELL, CELL_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT,
    COLORS, TOWER_TYPES, GRID_COLS, GRID_ROWS
} from './config.js';

export class Renderer {
    constructor(ctx, grid) {
        this.ctx = ctx;
        this.grid = grid;
    }

    render(game) {
        this._drawGrid();
        this._drawTowers(game.towers);
        this._drawEnemies(game.enemies);
        this._drawProjectiles(game.projectiles);
        this._drawParticles(game.particles);
        this._drawPlacementPreview(game);
        this._drawSelectedTowerInfo(game);
    }

    _drawGrid() {
        const ctx = this.ctx;
        const grid = this.grid;

        for (let y = 0; y < grid.rows; y++) {
            for (let x = 0; x < grid.cols; x++) {
                const cell = grid.getCell(x, y);
                const px = x * CELL_SIZE;
                const py = y * CELL_SIZE;

                switch (cell) {
                    case CELL.GRASS:
                        ctx.fillStyle = (x + y) % 2 === 0 ? COLORS.grass : COLORS.grassAlt;
                        ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
                        if ((x * 7 + y * 13) % 5 === 0) {
                            ctx.fillStyle = '#3a7d5a';
                            ctx.fillRect(px + 3, py + 3, 2, 6);
                            ctx.fillRect(px + 8, py + 6, 2, 5);
                            ctx.fillRect(px + 14, py + 2, 2, 7);
                        }
                        break;

                    case CELL.PATH:
                        ctx.fillStyle = COLORS.path;
                        ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
                        ctx.strokeStyle = COLORS.pathBorder;
                        ctx.lineWidth = 1;
                        ctx.strokeRect(px + 0.5, py + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
                        if ((x + y) % 3 === 0) {
                            ctx.fillStyle = '#7a6545';
                            ctx.fillRect(px + 5, py + 8, 2, 2);
                            ctx.fillRect(px + 13, py + 4, 2, 2);
                        }
                        break;

                    case CELL.OBSTACLE:
                        ctx.fillStyle = COLORS.obstacle;
                        ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
                        ctx.fillStyle = COLORS.obstacleTop;
                        ctx.fillRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 6);
                        break;

                    case CELL.START:
                        ctx.fillStyle = COLORS.start;
                        ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
                        ctx.fillStyle = '#fff';
                        ctx.font = 'bold 14px sans-serif';
                        ctx.textAlign = 'center';
                        ctx.fillText('S', px + CELL_SIZE / 2, py + CELL_SIZE / 2 + 5);
                        break;

                    case CELL.END:
                        ctx.fillStyle = COLORS.end;
                        ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
                        ctx.fillStyle = '#fff';
                        ctx.font = 'bold 14px sans-serif';
                        ctx.textAlign = 'center';
                        ctx.fillText('E', px + CELL_SIZE / 2, py + CELL_SIZE / 2 + 5);
                        break;
                }

                ctx.strokeStyle = COLORS.grid;
                ctx.lineWidth = 0.5;
                ctx.strokeRect(px, py, CELL_SIZE, CELL_SIZE);
            }
        }
    }

    _drawTowers(towers) {
        const ctx = this.ctx;

        for (const tower of towers) {
            const cx = tower.centerX;
            const cy = tower.centerY;

            if (tower.category === 'gadget') {
                ctx.beginPath();
                ctx.arc(cx, cy, tower.range, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(241, 196, 15, 0.1)';
                ctx.fill();
                ctx.strokeStyle = 'rgba(241, 196, 15, 0.3)';
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 4]);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            if (tower.category === 'trap') {
                this._drawSpike(tower);
                continue;
            }

            ctx.beginPath();
            ctx.arc(cx, cy, 9, 0, Math.PI * 2);
            ctx.fillStyle = tower.color;
            ctx.fill();
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(tower.angle);

            ctx.fillStyle = '#333';
            ctx.fillRect(0, -2, 12, 4);
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 1;
            ctx.strokeRect(0, -2, 12, 4);

            ctx.restore();

            ctx.beginPath();
            ctx.arc(cx, cy, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#555';
            ctx.fill();

            if (tower.level > 1) {
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 8px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`★${tower.level}`, cx, cy - 12);
            }

            if (tower.beamTarget && tower.beamTimer > 0) {
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(tower.beamTarget.x, tower.beamTarget.y);
                ctx.strokeStyle = tower.beamColor;
                ctx.lineWidth = 3;
                ctx.globalAlpha = tower.beamTimer / 100;
                ctx.stroke();
                ctx.lineWidth = 1;
                ctx.strokeStyle = '#fff';
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
        }
    }

    _drawSpike(tower) {
        const ctx = this.ctx;
        const cx = tower.centerX;
        const cy = tower.centerY;

        ctx.fillStyle = tower.usesLeft > 0 ? tower.color : '#666';
        ctx.fillRect(cx - 8, cy - 8, 16, 16);
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cx - 8, cy - 8, 16, 16);

        const spikes = [[0, -6], [5, 0], [0, 6], [-5, 0]];
        ctx.fillStyle = tower.usesLeft > 0 ? '#ecf0f1' : '#999';
        for (const [sx, sy] of spikes) {
            ctx.beginPath();
            ctx.moveTo(cx + sx, cy + sy - 3);
            ctx.lineTo(cx + sx + 2, cy + sy + 2);
            ctx.lineTo(cx + sx - 2, cy + sy + 2);
            ctx.fill();
        }

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 7px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(tower.usesLeft, cx, cy + 2.5);
    }

    _drawEnemies(enemies) {
        const ctx = this.ctx;

        for (const enemy of enemies) {
            if (enemy.dead || enemy.reachedEnd) continue;

            const x = enemy.x;
            const y = enemy.y;
            const s = enemy.size;

            if (enemy.frozen) {
                ctx.beginPath();
                ctx.arc(x, y, s + 3, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0, 210, 255, 0.3)';
                ctx.fill();
            }

            if (enemy.slowFactor < 1 && !enemy.frozen) {
                ctx.beginPath();
                ctx.arc(x, y, s + 2, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(155, 89, 182, 0.3)';
                ctx.fill();
            }

            ctx.beginPath();
            ctx.arc(x, y, s, 0, Math.PI * 2);
            ctx.fillStyle = enemy.frozen ? '#00d2ff' : enemy.color;
            ctx.fill();
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 2;
            ctx.stroke();

            const eyeOffset = s * 0.3;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(x - eyeOffset, y - eyeOffset * 0.5, s * 0.25, 0, Math.PI * 2);
            ctx.arc(x + eyeOffset, y - eyeOffset * 0.5, s * 0.25, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#222';
            ctx.beginPath();
            ctx.arc(x - eyeOffset + 1, y - eyeOffset * 0.5, s * 0.12, 0, Math.PI * 2);
            ctx.arc(x + eyeOffset + 1, y - eyeOffset * 0.5, s * 0.12, 0, Math.PI * 2);
            ctx.fill();

            if (enemy.type === 'boss') {
                ctx.fillStyle = '#f1c40f';
                ctx.beginPath();
                ctx.moveTo(x - 6, y - s - 2);
                ctx.lineTo(x - 4, y - s - 8);
                ctx.lineTo(x, y - s - 4);
                ctx.lineTo(x + 4, y - s - 8);
                ctx.lineTo(x + 6, y - s - 2);
                ctx.fill();
                ctx.strokeStyle = '#222';
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            if (enemy.flying) {
                ctx.fillStyle = 'rgba(52, 152, 219, 0.3)';
                ctx.beginPath();
                ctx.ellipse(x, y + s + 4, s * 0.8, 3, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            if (enemy.hp < enemy.maxHp) {
                const barW = s * 2.5;
                const barH = 3;
                const barX = x - barW / 2;
                const barY = y - s - 6;

                ctx.fillStyle = COLORS.hpBarBg;
                ctx.fillRect(barX, barY, barW, barH);

                const hpRatio = enemy.hp / enemy.maxHp;
                ctx.fillStyle = hpRatio > 0.5 ? COLORS.hpBar : COLORS.hpBarLost;
                ctx.fillRect(barX, barY, barW * hpRatio, barH);

                ctx.strokeStyle = '#222';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(barX, barY, barW, barH);
            }
        }
    }

    _drawProjectiles(projectiles) {
        const ctx = this.ctx;

        for (const proj of projectiles) {
            if (proj.hit || proj.expired) continue;
            if (proj.instant) continue;

            ctx.beginPath();
            ctx.arc(proj.x, proj.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = proj.color;
            ctx.fill();
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(proj.x, proj.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = proj.color + '44';
            ctx.fill();
        }
    }

    _drawParticles(particles) {
        const ctx = this.ctx;

        for (const p of particles) {
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
        ctx.globalAlpha = 1;
    }

    _drawPlacementPreview(game) {
        if (!game.selectedTower || !game.input) return;

        const ctx = this.ctx;
        const { gridX, gridY } = game.input.mouse;
        const towerDef = TOWER_TYPES[game.selectedTower];
        const canPlace = game.grid.canPlace(gridX, gridY, towerDef);

        ctx.fillStyle = canPlace ? COLORS.placementValid : COLORS.placementInvalid;
        ctx.fillRect(gridX * CELL_SIZE, gridY * CELL_SIZE, CELL_SIZE, CELL_SIZE);

        if (towerDef.range > 0) {
            const cx = gridX * CELL_SIZE + CELL_SIZE / 2;
            const cy = gridY * CELL_SIZE + CELL_SIZE / 2;
            ctx.beginPath();
            ctx.arc(cx, cy, towerDef.range, 0, Math.PI * 2);
            ctx.fillStyle = COLORS.rangePreview;
            ctx.fill();
            ctx.strokeStyle = COLORS.rangeBorder;
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    _drawSelectedTowerInfo(game) {
        const tower = game.selectedPlacedTower;
        if (!tower) return;

        const ctx = this.ctx;
        const cx = tower.centerX;
        const cy = tower.centerY;

        if (tower.range > 0) {
            ctx.beginPath();
            ctx.arc(cx, cy, tower.range, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(tower.gridX * CELL_SIZE, tower.gridY * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
}
