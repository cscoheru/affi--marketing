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
        this._drawEnemyBombs(game.enemyBombs || []);
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
                this._drawGoldBoost(tower);
                continue;
            }

            if (tower.category === 'trap') {
                this._drawSpike(tower);
                continue;
            }

            // Level 3 golden ring (pulsing)
            if (tower.level >= 3) {
                const pulse = 0.6 + Math.sin(Date.now() / 300) * 0.2;
                ctx.beginPath();
                ctx.arc(cx, cy, 13, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(255, 215, 0, ${pulse})`;
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            // Draw by type and level
            this._drawTowerByLevel(ctx, tower, cx, cy);

            // Beam for laser towers
            if (tower.beamTarget && tower.beamTimer > 0) {
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(tower.beamTarget.x, tower.beamTarget.y);
                ctx.strokeStyle = tower.beamColor;
                ctx.lineWidth = tower.level >= 3 ? 4 : 3;
                ctx.globalAlpha = tower.beamTimer / 100;
                ctx.stroke();
                ctx.lineWidth = 1;
                ctx.strokeStyle = '#fff';
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            // Chain lightning beams
            if (tower.chainTargets && tower.chainTargets.length > 0) {
                for (const ct of tower.chainTargets) {
                    const alpha = ct.timer / 150;
                    ctx.beginPath();
                    ctx.moveTo(cx, cy);
                    // Jagged lightning path
                    const dx = ct.x - cx, dy = ct.y - cy;
                    const segments = 4;
                    ctx.lineTo(cx + dx * 0.3 + (Math.random() - 0.5) * 10, cy + dy * 0.3 + (Math.random() - 0.5) * 10);
                    ctx.lineTo(cx + dx * 0.6 + (Math.random() - 0.5) * 8, cy + dy * 0.6 + (Math.random() - 0.5) * 8);
                    ctx.lineTo(ct.x, ct.y);
                    ctx.strokeStyle = `rgba(46, 204, 113, ${alpha})`;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }

            // Level indicator
            if (tower.level >= 2) {
                ctx.fillStyle = tower.level >= 3 ? '#ffd700' : '#fff';
                ctx.font = 'bold 8px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`★${tower.level}`, cx, cy - 13);
            }
        }
    }

    _drawTowerByLevel(ctx, tower, cx, cy) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(tower.angle);

        switch (tower.type) {
            case 'machinegun': this._drawMachinegun(ctx, tower); break;
            case 'missile': this._drawMissile(ctx, tower); break;
            case 'laser': this._drawLaser(ctx, tower); break;
            case 'emp': this._drawEMP(ctx, tower); break;
            case 'freeze': this._drawFreeze(ctx, tower); break;
            case 'sniper': this._drawSniper(ctx, tower); break;
            case 'grenade': this._drawGrenade(ctx, tower); break;
            default: this._drawGeneric(ctx, tower); break;
        }

        ctx.restore();
    }

    // ─── Machinegun ───
    _drawMachinegun(ctx, tower) {
        const lv = tower.level;
        if (lv === 1) {
            // Small grey circle + single barrel
            ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#95a5a6'; ctx.fill();
            ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = '#555'; ctx.fillRect(2, -1.5, 10, 3);
        } else if (lv === 2) {
            // Larger body + dual barrel
            ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2);
            ctx.fillStyle = '#7f8c8d'; ctx.fill();
            ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = '#444';
            ctx.fillRect(2, -3, 12, 2.5);
            ctx.fillRect(2, 0.5, 12, 2.5);
            // Muzzle flash hint
            ctx.beginPath(); ctx.arc(14, -1.75, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#f1c40f'; ctx.fill();
            ctx.beginPath(); ctx.arc(14, 1.75, 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Quad barrel + larger body + glow
            ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fillStyle = '#6c7a89'; ctx.fill();
            ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = '#333';
            ctx.fillRect(2, -4.5, 13, 2);
            ctx.fillRect(2, -1.5, 13, 2);
            ctx.fillRect(2, 1.5, 13, 2);
            ctx.fillRect(2, 4.5, 13, 2);
            // Muzzle glow
            ctx.beginPath(); ctx.arc(15, 0, 3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(241, 196, 15, 0.6)'; ctx.fill();
        }
        // Center hub
        ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#333'; ctx.fill();
    }

    // ─── Missile ───
    _drawMissile(ctx, tower) {
        const lv = tower.level;
        if (lv === 1) {
            ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2);
            ctx.fillStyle = '#e67e22'; ctx.fill();
            ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.stroke();
            // Single rocket tube
            ctx.fillStyle = '#c0392b';
            ctx.fillRect(3, -2, 9, 4);
        } else if (lv === 2) {
            ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fillStyle = '#d35400'; ctx.fill();
            ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.stroke();
            // Double rocket
            ctx.fillStyle = '#c0392b';
            ctx.fillRect(3, -4, 10, 3);
            ctx.fillRect(3, 1, 10, 3);
            // Fins
            ctx.fillStyle = '#95a5a6';
            ctx.fillRect(12, -5, 3, 2);
            ctx.fillRect(12, 3, 3, 2);
        } else {
            // Launch pad base
            ctx.fillStyle = '#a04000';
            ctx.fillRect(-7, -7, 14, 14);
            ctx.strokeStyle = '#222'; ctx.lineWidth = 2;
            ctx.strokeRect(-7, -7, 14, 14);
            // Warning stripes
            ctx.fillStyle = '#f1c40f';
            for (let i = -5; i < 5; i += 4) {
                ctx.fillRect(i, -7, 2, 14);
            }
            // Triple rocket
            ctx.fillStyle = '#c0392b';
            ctx.fillRect(3, -5.5, 11, 3);
            ctx.fillRect(3, -1.5, 11, 3);
            ctx.fillRect(3, 2.5, 11, 3);
        }
        ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#c0392b'; ctx.fill();
    }

    // ─── Laser ───
    _drawLaser(ctx, tower) {
        const lv = tower.level;
        if (lv === 1) {
            ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#2ecc71'; ctx.fill();
            ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = '#27ae60';
            ctx.fillRect(2, -1.5, 10, 3);
        } else if (lv === 2) {
            ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2);
            ctx.fillStyle = '#27ae60'; ctx.fill();
            ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.stroke();
            // Lens detail
            ctx.beginPath(); ctx.arc(3, 0, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#1abc9c'; ctx.fill();
            ctx.fillStyle = '#145a32';
            ctx.fillRect(6, -1.5, 8, 3);
        } else {
            // Crystal prism shape
            ctx.beginPath();
            ctx.moveTo(0, -9); ctx.lineTo(8, 0); ctx.lineTo(0, 9); ctx.lineTo(-8, 0);
            ctx.closePath();
            ctx.fillStyle = '#1abc9c'; ctx.fill();
            ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.stroke();
            // Inner crystal
            ctx.beginPath();
            ctx.moveTo(0, -5); ctx.lineTo(4, 0); ctx.lineTo(0, 5); ctx.lineTo(-4, 0);
            ctx.closePath();
            ctx.fillStyle = '#2ecc71'; ctx.fill();
            // Energy ring
            const pulse = 0.5 + Math.sin(Date.now() / 200) * 0.3;
            ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(46, 204, 113, ${pulse})`; ctx.lineWidth = 1; ctx.stroke();
            // Barrel
            ctx.fillStyle = '#145a32';
            ctx.fillRect(7, -1.5, 6, 3);
        }
    }

    // ─── EMP ───
    _drawEMP(ctx, tower) {
        const lv = tower.level;
        if (lv === 1) {
            ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#9b59b6'; ctx.fill();
            ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.stroke();
        } else if (lv === 2) {
            ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2);
            ctx.fillStyle = '#8e44ad'; ctx.fill();
            ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.stroke();
            // Coil rings
            ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2);
            ctx.strokeStyle = '#d4a5e5'; ctx.lineWidth = 1; ctx.stroke();
            ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            // Tesla coil
            ctx.fillStyle = '#6c3483';
            ctx.fillRect(-3, -3, 6, 6);
            ctx.strokeStyle = '#222'; ctx.lineWidth = 2;
            ctx.strokeRect(-3, -3, 6, 6);
            // Coil rings
            ctx.strokeStyle = '#d4a5e5'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.stroke();
            // Arcing sparks
            const t = Date.now() / 150;
            for (let i = 0; i < 3; i++) {
                const a = (t + i * 2.1) % (Math.PI * 2);
                ctx.beginPath();
                ctx.moveTo(Math.cos(a) * 7, Math.sin(a) * 7);
                ctx.lineTo(Math.cos(a) * 10 + (Math.random() - 0.5) * 4, Math.sin(a) * 10 + (Math.random() - 0.5) * 4);
                ctx.strokeStyle = `rgba(155, 89, 182, ${0.5 + Math.random() * 0.5})`;
                ctx.lineWidth = 1; ctx.stroke();
            }
        }
        // Antenna
        ctx.fillStyle = '#555';
        ctx.fillRect(-1, -10, 2, 7);
        ctx.beginPath(); ctx.arc(0, -10, 2, 0, Math.PI * 2);
        ctx.fillStyle = lv >= 3 ? '#e8daef' : '#9b59b6'; ctx.fill();
    }

    // ─── Freeze ───
    _drawFreeze(ctx, tower) {
        const lv = tower.level;
        if (lv === 1) {
            ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#1abc9c'; ctx.fill();
            ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.stroke();
        } else if (lv === 2) {
            ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2);
            ctx.fillStyle = '#16a085'; ctx.fill();
            ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.stroke();
            // Snowflake pattern
            ctx.strokeStyle = '#d5f5e3'; ctx.lineWidth = 1;
            for (let i = 0; i < 6; i++) {
                const a = (Math.PI * 2 / 6) * i;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(a) * 7, Math.sin(a) * 7);
                ctx.stroke();
            }
        } else {
            // Large crystal
            ctx.beginPath();
            ctx.moveTo(0, -10); ctx.lineTo(6, -2); ctx.lineTo(6, 4);
            ctx.lineTo(0, 10); ctx.lineTo(-6, 4); ctx.lineTo(-6, -2);
            ctx.closePath();
            ctx.fillStyle = '#148f77'; ctx.fill();
            ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.stroke();
            // Inner facet
            ctx.beginPath();
            ctx.moveTo(0, -6); ctx.lineTo(3, -1); ctx.lineTo(3, 3);
            ctx.lineTo(0, 6); ctx.lineTo(-3, 3); ctx.lineTo(-3, -1);
            ctx.closePath();
            ctx.fillStyle = '#1abc9c'; ctx.fill();
            // Frost aura
            const pulse = 0.3 + Math.sin(Date.now() / 400) * 0.15;
            ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 210, 255, ${pulse})`; ctx.fill();
        }
        // Center dot
        ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#d5f5e3'; ctx.fill();
    }

    // ─── Sniper ───
    _drawSniper(ctx, tower) {
        const lv = tower.level;
        if (lv === 1) {
            ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#34495e'; ctx.fill();
            ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(2, -1.5, 12, 3);
        } else if (lv === 2) {
            ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2);
            ctx.fillStyle = '#2c3e50'; ctx.fill();
            ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.stroke();
            // Longer barrel
            ctx.fillStyle = '#1a252f';
            ctx.fillRect(2, -2, 15, 4);
            // Scope
            ctx.fillStyle = '#555';
            ctx.fillRect(4, -5, 6, 3);
        } else {
            ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2);
            ctx.fillStyle = '#1a252f'; ctx.fill();
            ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.stroke();
            // Long barrel
            ctx.fillStyle = '#111';
            ctx.fillRect(2, -2, 16, 4);
            // Scope with lens
            ctx.fillStyle = '#444';
            ctx.fillRect(4, -6, 8, 4);
            ctx.beginPath(); ctx.arc(12, -4, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#e74c3c'; ctx.fill(); // Red dot sight
            // Scope reticle lines
            ctx.strokeStyle = 'rgba(231, 76, 60, 0.5)'; ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(18, -6); ctx.lineTo(22, -6); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(20, -8); ctx.lineTo(20, -2); ctx.stroke();
        }
        // Bipod
        ctx.strokeStyle = '#555'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(-3, 5); ctx.lineTo(-6, 9); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(3, 5); ctx.lineTo(6, 9); ctx.stroke();
    }

    // ─── Grenade ───
    _drawGrenade(ctx, tower) {
        const lv = tower.level;
        if (lv === 1) {
            ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#2c3e50'; ctx.fill();
            ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.stroke();
            // Mortar tube
            ctx.fillStyle = '#556b2f';
            ctx.fillRect(1, -3, 8, 6);
        } else if (lv === 2) {
            ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2);
            ctx.fillStyle = '#1c2833'; ctx.fill();
            ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.stroke();
            // Wider mortar + hazard mark
            ctx.fillStyle = '#556b2f';
            ctx.fillRect(1, -4, 10, 8);
            ctx.fillStyle = '#f1c40f';
            ctx.fillRect(5, -2, 2, 4);
        } else {
            // Ammo belt base
            ctx.fillStyle = '#4a3728';
            ctx.fillRect(-8, -6, 16, 12);
            ctx.strokeStyle = '#222'; ctx.lineWidth = 2;
            ctx.strokeRect(-8, -6, 16, 12);
            // Belt detail
            ctx.fillStyle = '#556b2f';
            for (let i = -6; i < 5; i += 4) {
                ctx.beginPath(); ctx.arc(i, -3, 2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(i, 3, 2, 0, Math.PI * 2); ctx.fill();
            }
            // Mortar tube
            ctx.fillStyle = '#556b2f';
            ctx.fillRect(3, -4, 10, 8);
            // Fuse glow
            const pulse = 0.5 + Math.sin(Date.now() / 200) * 0.3;
            ctx.beginPath(); ctx.arc(13, 0, 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 100, 0, ${pulse})`; ctx.fill();
        }
    }

    // ─── Gold Boost ───
    _drawGoldBoost(tower) {
        const ctx = this.ctx;
        const cx = tower.centerX, cy = tower.centerY;
        const lv = tower.level;

        // Range circle
        ctx.beginPath(); ctx.arc(cx, cy, tower.range, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(241, 196, 15, 0.08)'; ctx.fill();
        ctx.strokeStyle = 'rgba(241, 196, 15, 0.25)'; ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);

        if (lv === 1) {
            ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#f1c40f'; ctx.fill();
            ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.stroke();
        } else if (lv === 2) {
            ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2);
            ctx.fillStyle = '#f39c12'; ctx.fill();
            ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.stroke();
            // Coin icon
            ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#f1c40f'; ctx.fill();
            ctx.strokeStyle = '#e67e22'; ctx.lineWidth = 1; ctx.stroke();
            ctx.fillStyle = '#e67e22';
            ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('$', cx, cy + 2.5);
        } else {
            // Rotating coin animation
            const t = Date.now() / 500;
            const scaleX = Math.cos(t); // Creates rotation illusion
            ctx.save();
            ctx.translate(cx, cy);
            ctx.scale(scaleX, 1);
            ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2);
            ctx.fillStyle = '#f1c40f'; ctx.fill();
            ctx.strokeStyle = '#e67e22'; ctx.lineWidth = 1.5; ctx.stroke();
            ctx.fillStyle = '#e67e22';
            ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('$', 0, 3);
            ctx.restore();
            // Sparkle particles
            const sparkles = 4;
            for (let i = 0; i < sparkles; i++) {
                const a = t * 2 + (Math.PI * 2 / sparkles) * i;
                const r = 12;
                const sx = cx + Math.cos(a) * r;
                const sy = cy + Math.sin(a) * r;
                const alpha = 0.4 + Math.sin(Date.now() / 200 + i) * 0.3;
                ctx.fillStyle = `rgba(241, 196, 15, ${alpha})`;
                ctx.fillRect(sx - 1, sy - 1, 2, 2);
            }
        }

        // Level indicator
        if (lv >= 2) {
            ctx.fillStyle = lv >= 3 ? '#ffd700' : '#fff';
            ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(`★${lv}`, cx, cy - 13);
        }
    }

    // ─── Spike (trap, not rotated) ───
    _drawSpike(tower) {
        const ctx = this.ctx;
        const cx = tower.centerX, cy = tower.centerY;
        const lv = tower.level;

        const active = tower.usesLeft > 0;
        const baseColor = active ? tower.color : '#666';

        if (lv === 1) {
            ctx.fillStyle = baseColor;
            ctx.fillRect(cx - 8, cy - 8, 16, 16);
            ctx.strokeStyle = '#222'; ctx.lineWidth = 1.5;
            ctx.strokeRect(cx - 8, cy - 8, 16, 16);
            const spikes = [[0, -6], [5, 0], [0, 6], [-5, 0]];
            ctx.fillStyle = active ? '#ecf0f1' : '#999';
            for (const [sx, sy] of spikes) {
                ctx.beginPath();
                ctx.moveTo(cx + sx, cy + sy - 3);
                ctx.lineTo(cx + sx + 2, cy + sy + 2);
                ctx.lineTo(cx + sx - 2, cy + sy + 2);
                ctx.fill();
            }
        } else if (lv === 2) {
            ctx.fillStyle = baseColor;
            ctx.fillRect(cx - 9, cy - 9, 18, 18);
            ctx.strokeStyle = '#222'; ctx.lineWidth = 1.5;
            ctx.strokeRect(cx - 9, cy - 9, 18, 18);
            // More spikes
            const spikes = [[0, -7], [5, -5], [7, 0], [5, 5], [0, 7], [-5, 5], [-7, 0], [-5, -5]];
            ctx.fillStyle = active ? '#ecf0f1' : '#999';
            for (const [sx, sy] of spikes) {
                ctx.beginPath();
                ctx.moveTo(cx + sx, cy + sy - 2.5);
                ctx.lineTo(cx + sx + 1.5, cy + sy + 2);
                ctx.lineTo(cx + sx - 1.5, cy + sy + 2);
                ctx.fill();
            }
        } else {
            ctx.fillStyle = baseColor;
            ctx.fillRect(cx - 10, cy - 10, 20, 20);
            ctx.strokeStyle = '#222'; ctx.lineWidth = 1.5;
            ctx.strokeRect(cx - 10, cy - 10, 20, 20);
            // Full spike array
            const spikes = [[0, -8], [4, -6], [8, 0], [4, 6], [0, 8], [-4, 6], [-8, 0], [-4, -6],
                            [3, -3], [6, -3], [6, 3], [3, 3], [-3, 3], [-6, 3], [-6, -3], [-3, -3]];
            ctx.fillStyle = active ? '#ecf0f1' : '#999';
            for (const [sx, sy] of spikes) {
                ctx.beginPath();
                ctx.moveTo(cx + sx, cy + sy - 2);
                ctx.lineTo(cx + sx + 1.5, cy + sy + 1.5);
                ctx.lineTo(cx + sx - 1.5, cy + sy + 1.5);
                ctx.fill();
            }
            // Red glow
            if (active) {
                ctx.beginPath(); ctx.arc(cx, cy, 11, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(231, 76, 60, 0.15)'; ctx.fill();
            }
        }

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(tower.usesLeft, cx, cy + 2.5);

        if (lv >= 2) {
            ctx.fillStyle = lv >= 3 ? '#ffd700' : '#fff';
            ctx.font = 'bold 8px sans-serif';
            ctx.fillText(`★${lv}`, cx, cy - 13);
        }
    }

    // ─── Generic fallback ───
    _drawGeneric(ctx, tower) {
        ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fillStyle = tower.color; ctx.fill();
        ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#333'; ctx.fillRect(2, -2, 10, 4);
        ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#555'; ctx.fill();
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

            if (enemy.type === 'demolisher') {
                // Bomb icon on body
                ctx.fillStyle = '#c0392b';
                ctx.beginPath();
                ctx.arc(x, y, s * 0.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#222';
                ctx.lineWidth = 1;
                ctx.stroke();
            }

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

            if (proj.arc && proj.z > 0) {
                ctx.globalAlpha = 0.3;
                ctx.beginPath();
                ctx.ellipse(proj.x, proj.y, 4, 2, 0, 0, Math.PI * 2);
                ctx.fillStyle = '#000';
                ctx.fill();
                ctx.globalAlpha = 1;
                const drawY = proj.y - proj.z;
                ctx.beginPath();
                ctx.arc(proj.x, drawY, 4, 0, Math.PI * 2);
                ctx.fillStyle = proj.color;
                ctx.fill();
                ctx.strokeStyle = '#222';
                ctx.lineWidth = 1;
                ctx.stroke();
            } else {
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
    }

    _drawEnemyBombs(bombs) {
        const ctx = this.ctx;
        for (const bomb of bombs) {
            // Shadow
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.ellipse(bomb.x, bomb.y, 4, 2, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#000';
            ctx.fill();
            ctx.globalAlpha = 1;
            // Bomb body
            const drawY = bomb.y - bomb.z;
            ctx.beginPath();
            ctx.arc(bomb.x, drawY, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#c0392b';
            ctx.fill();
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 1;
            ctx.stroke();
            // Fuse spark
            if (bomb.progress < 0.9) {
                ctx.beginPath();
                ctx.arc(bomb.x, drawY - 4, 2, 0, Math.PI * 2);
                ctx.fillStyle = '#ffcc00';
                ctx.fill();
            }
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
