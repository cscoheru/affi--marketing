// js/game.js - Game loop and state management

import { GAME_STATE, CANVAS_WIDTH, CANVAS_HEIGHT, ENEMY_TYPES, CELL_SIZE } from './config.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.state = GAME_STATE.MENU;
        this.lastTime = 0;
        this.deltaTime = 0;
        this.speedMultiplier = 1;

        this.enemies = [];
        this.towers = [];
        this.projectiles = [];
        this.particles = [];

        this.grid = null;
        this.waveSystem = null;
        this.economy = null;
        this.renderer = null;
        this.input = null;

        this.selectedTower = null;
        this.selectedPlacedTower = null;

        this.totalKills = 0;
        this.currentWave = 0;
        this.totalWaves = 0;
    }

    init(grid, waveSystem, economy, renderer, input) {
        this.grid = grid;
        this.waveSystem = waveSystem;
        this.economy = economy;
        this.renderer = renderer;
        this.input = input;
    }

    start() {
        this.state = GAME_STATE.PREPARING;
        this.enemies = [];
        this.towers = [];
        this.projectiles = [];
        this.particles = [];
        this.selectedTower = null;
        this.selectedPlacedTower = null;
        this.totalKills = 0;
        this.speedMultiplier = 1;
    }

    update(deltaTime) {
        if (this.state === GAME_STATE.PAUSED || this.state === GAME_STATE.MENU) return;
        if (this.state === GAME_STATE.VICTORY || this.state === GAME_STATE.DEFEAT) return;

        const dt = deltaTime * this.speedMultiplier;

        if (this.state === GAME_STATE.PREPARING) return;

        if (this.state === GAME_STATE.WAVE_ACTIVE) {
            this.waveSystem.update(dt);

            // Spawn enemies
            const spawns = this.waveSystem.getPendingSpawns();
            for (const spawn of spawns) {
                this.enemies.push(this._createEnemy(spawn));
            }

            // Update enemies
            for (const enemy of this.enemies) {
                enemy.update(dt);
            }

            this._checkEnemyReachEnd();

            // Tower targeting and shooting
            for (const tower of this.towers) {
                tower.update(dt, this.enemies, this.projectiles);
            }

            // Update projectiles
            for (const proj of this.projectiles) {
                proj.update(dt);
            }

            this._checkProjectileHits();

            // Update particles
            for (const p of this.particles) {
                p.update(dt);
            }

            this._cleanup();
            this._checkWaveEnd();
        }
    }

    _createEnemy(spawn) {
        const def = ENEMY_TYPES[spawn.type];
        const path = this.waveSystem.pathPixels;
        return {
            type: spawn.type,
            x: path[0].x,
            y: path[0].y,
            hp: spawn.hp,
            maxHp: spawn.hp,
            speed: spawn.speed,
            armor: def.armor,
            livesCost: def.livesCost,
            goldReward: def.goldReward,
            color: def.color,
            size: def.size,
            flying: def.flying,
            pathIndex: 0,
            path: path,
            dead: false,
            reachedEnd: false,
            frozen: false,
            frozenTimer: 0,
            slowFactor: 1.0,
            slowTimer: 0,

            update(dt) {
                if (this.dead || this.reachedEnd) return;

                if (this.frozen) {
                    this.frozenTimer -= dt * 1000;
                    if (this.frozenTimer <= 0) this.frozen = false;
                    return;
                }

                if (this.slowTimer > 0) {
                    this.slowTimer -= dt * 1000;
                    if (this.slowTimer <= 0) this.slowFactor = 1.0;
                }

                const speed = this.speed * this.slowFactor * 60 * dt;
                let remaining = speed;

                while (remaining > 0 && this.pathIndex < this.path.length - 1) {
                    const target = this.path[this.pathIndex + 1];
                    const dx = target.x - this.x;
                    const dy = target.y - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist <= remaining) {
                        this.x = target.x;
                        this.y = target.y;
                        this.pathIndex++;
                        remaining -= dist;
                    } else {
                        this.x += (dx / dist) * remaining;
                        this.y += (dy / dist) * remaining;
                        remaining = 0;
                    }
                }

                if (this.pathIndex >= this.path.length - 1) {
                    this.reachedEnd = true;
                }
            },

            takeDamage(amount) {
                this.hp -= amount;
            },

            applySlow(factor, duration) {
                if (!this.frozen) {
                    this.slowFactor = factor;
                    this.slowTimer = duration;
                }
            },

            applyFreeze(duration) {
                this.frozen = true;
                this.frozenTimer = duration;
            }
        };
    }

    _checkEnemyReachEnd() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (enemy.reachedEnd) {
                this.economy.loseLife(enemy.livesCost);
                this.enemies.splice(i, 1);
                if (this.economy.lives <= 0) {
                    this.state = GAME_STATE.DEFEAT;
                }
            }
        }
    }

    _checkProjectileHits() {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            if (proj.hit) {
                this._onEnemyHit(proj.target, proj);
                this.projectiles.splice(i, 1);
            } else if (proj.expired) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    _onEnemyHit(enemy, projectile) {
        if (!enemy || enemy.hp <= 0 || enemy.dead) return;

        let damage = projectile.damage;
        if (!projectile.ignoresArmor && enemy.armor > 0) {
            damage = Math.max(1, damage * (1 - enemy.armor));
        }

        enemy.takeDamage(damage);

        if (projectile.slow) {
            enemy.applySlow(projectile.slowFactor, projectile.slowDuration);
        }
        if (projectile.freeze) {
            enemy.applyFreeze(projectile.freezeDuration);
        }
        if (projectile.splashRadius) {
            this._applySplash(projectile.x, projectile.y, projectile.splashRadius, damage * 0.5);
        }

        this.particles.push(this._createHitParticle(projectile.x, projectile.y));

        if (enemy.hp <= 0) {
            this._onEnemyKill(enemy);
        }
    }

    _applySplash(x, y, radius, damage) {
        for (const enemy of this.enemies) {
            if (enemy.hp <= 0 || enemy.dead) continue;
            const dx = enemy.x - x;
            const dy = enemy.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= radius) {
                let d = damage;
                if (enemy.armor > 0) d = Math.max(1, d * (1 - enemy.armor));
                enemy.takeDamage(d);
                if (enemy.hp <= 0) this._onEnemyKill(enemy);
            }
        }
    }

    _onEnemyKill(enemy) {
        if (enemy.dead) return;
        enemy.dead = true;
        this.totalKills++;

        let goldMult = this.economy.goldMultiplier;
        for (const tower of this.towers) {
            if (tower.type === 'goldBoost') {
                const dx = enemy.x - tower.centerX;
                const dy = enemy.y - tower.centerY;
                if (Math.sqrt(dx * dx + dy * dy) <= tower.range) {
                    goldMult = tower.goldMultiplier;
                    break;
                }
            }
        }

        const reward = Math.floor(enemy.goldReward * goldMult);
        this.economy.addGold(reward);

        for (let i = 0; i < 5; i++) {
            this.particles.push(this._createDeathParticle(enemy.x, enemy.y, enemy.color));
        }
    }

    _createHitParticle(x, y) {
        return {
            x, y, vx: (Math.random() - 0.5) * 60, vy: (Math.random() - 0.5) * 60,
            life: 0.3, maxLife: 0.3, size: 3, color: '#fff',
            update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt; }
        };
    }

    _createDeathParticle(x, y, color) {
        return {
            x, y, vx: (Math.random() - 0.5) * 120, vy: (Math.random() - 0.5) * 120,
            life: 0.5, maxLife: 0.5, size: 4, color,
            update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt; }
        };
    }

    _cleanup() {
        this.enemies = this.enemies.filter(e => e.hp > 0 && !e.dead);
        this.projectiles = this.projectiles.filter(p => !p.hit && !p.expired);
        this.particles = this.particles.filter(p => p.life > 0);
    }

    _checkWaveEnd() {
        if (this.waveSystem.isWaveComplete()) {
            if (this.enemies.length === 0) {
                if (this.waveSystem.allWavesComplete()) {
                    this.state = GAME_STATE.VICTORY;
                } else {
                    this.state = GAME_STATE.PREPARING;
                }
            }
        }
    }

    render() {
        this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        this.renderer.render(this);
    }

    togglePause() {
        if (this.state === GAME_STATE.WAVE_ACTIVE) {
            this.state = GAME_STATE.PAUSED;
        } else if (this.state === GAME_STATE.PAUSED) {
            this.state = GAME_STATE.WAVE_ACTIVE;
        }
    }

    cycleSpeed() {
        const speeds = [1, 2, 3];
        const idx = speeds.indexOf(this.speedMultiplier);
        this.speedMultiplier = speeds[(idx + 1) % speeds.length];
        return this.speedMultiplier;
    }
}
