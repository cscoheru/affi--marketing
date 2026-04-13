// js/game.js - Game loop and state management

import { GAME_STATE, CANVAS_WIDTH, CANVAS_HEIGHT, ENEMY_TYPES, CELL_SIZE, CELL, UPGRADE_STATS, MAX_TOWER_LEVEL, STARTING_TOWERS } from './config.js';
import { createTower } from './entities/tower.js';

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
        this.enemyBombs = [];

        this.grid = null;
        this.waveSystem = null;
        this.economy = null;
        this.renderer = null;
        this.input = null;

        this.selectedTower = null;
        this.selectedPlacedTower = null;
        this.difficulty = null;

        this.totalKills = 0;
        this.currentWave = 0;
        this.totalWaves = 0;
        this.sound = null;
    }

    init(grid, waveSystem, economy, renderer, input, sound) {
        this.grid = grid;
        this.waveSystem = waveSystem;
        this.economy = economy;
        this.renderer = renderer;
        this.input = input;
        this.sound = sound;
    }

    start() {
        this.state = GAME_STATE.PREPARING;
        this.enemies = [];
        this.towers = [];
        this.projectiles = [];
        this.particles = [];
        this.enemyBombs = [];
        this.selectedTower = null;
        this.selectedPlacedTower = null;
        this.totalKills = 0;
        this.speedMultiplier = 1;
    }

    placeStartingTowers() {
        const config = STARTING_TOWERS[this.difficulty];
        if (!config) return;
        const startPos = this.grid.getStartPos();
        if (!startPos) return;

        const candidates = [];
        for (let y = 0; y < this.grid.rows; y++) {
            for (let x = 0; x < this.grid.cols; x++) {
                if (this.grid.getCell(x, y) === CELL.GRASS && !this.grid.occupants[`${x},${y}`]) {
                    const dist = Math.abs(x - startPos.x) + Math.abs(y - startPos.y);
                    candidates.push({ x, y, dist });
                }
            }
        }
        candidates.sort((a, b) => a.dist - b.dist);

        for (let i = 0; i < Math.min(config.count, candidates.length); i++) {
            const type = config.types[i] || config.types[config.types.length - 1];
            const { x, y } = candidates[i];
            const tower = createTower(type, x, y);
            this.towers.push(tower);
            this.grid.setOccupied(x, y, tower);
        }
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
                this._updateDemolisher(enemy, dt);
            }

            this._checkEnemyReachEnd();

            // Update enemy bombs
            this._updateEnemyBombs(dt);

            // Tower targeting and shooting
            for (const tower of this.towers) {
                tower.update(dt, this.enemies, this.projectiles);
            }

            // Decay chain/cluster timers
            for (const tower of this.towers) {
                if (tower.chainTargets) {
                    tower.chainTargets = tower.chainTargets.filter(ct => { ct.timer -= dt * 1000; return ct.timer > 0; });
                    if (tower.chainTargets.length === 0) tower.chainTargets = null;
                }
                if (tower.clusterPending) {
                    for (const cl of tower.clusterPending) {
                        cl.timer -= dt * 1000;
                        if (cl.timer <= 0 && !cl.exploded) {
                            cl.exploded = true;
                            this._applySplash(cl.x, cl.y, cl.splashRadius, cl.damage);
                            this.particles.push(...this._createExplosionParticles(cl.x, cl.y));
                            if (this.sound) this.sound.explosion();
                        }
                    }
                    tower.clusterPending = tower.clusterPending.filter(c => !c.exploded);
                    if (tower.clusterPending.length === 0) tower.clusterPending = null;
                }
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
                if (this.sound) this.sound.lifeLost();
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
            if (this.sound) this.sound.slow();
        }
        if (projectile.freeze) {
            enemy.applyFreeze(projectile.freezeDuration);
            if (this.sound) this.sound.freeze();
        }
        if (projectile.splashRadius) {
            this._applySplash(projectile.x, projectile.y, projectile.splashRadius, damage * 0.5);
        }

        // Special effects for level 3
        if (projectile.specialEffect) {
            const spec = projectile.specialEffect;
            // Machinegun: stun
            if (spec.stunChance && !enemy.frozen && Math.random() < spec.stunChance) {
                enemy.frozen = true;
                enemy.frozenTimer = spec.stunDuration;
                enemy.stunned = true;
                this.particles.push(...this._createStunParticles(enemy.x, enemy.y));
            }
            // Sniper: crit
            if (spec.critMultiplier) {
                const extra = damage * (spec.critMultiplier - 1);
                enemy.takeDamage(extra);
                this.particles.push(...this._createCritParticles(enemy.x, enemy.y));
            }
            // Laser: chain lightning
            if (spec.chainCount) {
                const chains = [];
                for (const other of this.enemies) {
                    if (other === enemy || other.hp <= 0 || other.dead) continue;
                    const dx = other.x - enemy.x, dy = other.y - enemy.y;
                    if (Math.sqrt(dx * dx + dy * dy) <= spec.chainRange) {
                        chains.push(other);
                        if (chains.length >= spec.chainCount) break;
                    }
                }
                for (const ch of chains) {
                    ch.takeDamage(Math.floor(damage * 0.6));
                    if (ch.hp <= 0) this._onEnemyKill(ch);
                    if (projectile.towerRef) {
                        projectile.towerRef.chainTargets = projectile.towerRef.chainTargets || [];
                        projectile.towerRef.chainTargets.push({ x: ch.x, y: ch.y, timer: 150 });
                    }
                    this.particles.push(this._createHitParticle(ch.x, ch.y));
                }
            }
            // Grenade: cluster bombs
            if (spec.clusterCount && projectile.towerRef) {
                const t = projectile.towerRef;
                t.clusterPending = t.clusterPending || [];
                for (let c = 0; c < spec.clusterCount; c++) {
                    t.clusterPending.push({
                        x: projectile.x + (Math.random() - 0.5) * 60,
                        y: projectile.y + (Math.random() - 0.5) * 60,
                        timer: 200 + c * 100, exploded: false,
                        splashRadius: spec.clusterSplash,
                        damage: damage * spec.clusterDamageRatio
                    });
                }
            }
        }

        if (projectile.arc) {
            this.particles.push(...this._createExplosionParticles(projectile.x, projectile.y));
            if (this.sound) this.sound.explosion();
        } else {
            this.particles.push(this._createHitParticle(projectile.x, projectile.y));
            if (this.sound) this.sound.smallHit();
        }

        if (enemy.hp <= 0) {
            this._onEnemyKill(enemy);
        }
    }

    _applySplash(x, y, radius, damage) {
        if (this.sound) this.sound.splash();
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
        if (this.sound) this.sound.goldEarned();

        for (let i = 0; i < 5; i++) {
            this.particles.push(this._createDeathParticle(enemy.x, enemy.y, enemy.color));
        }
        if (this.sound) this.sound.explosion();
    }

    _updateDemolisher(enemy, dt) {
        if (enemy.type !== 'demolisher' || enemy.dead || enemy.reachedEnd || enemy.frozen) return;
        const def = ENEMY_TYPES.demolisher;
        if (!enemy._bombCooldown) enemy._bombCooldown = def.bombCooldown;
        enemy._bombCooldown -= dt * 1000;
        if (enemy._bombCooldown > 0) return;

        // Find nearest tower in range
        let nearest = null, nearestDist = Infinity;
        for (const tower of this.towers) {
            const dx = tower.centerX - enemy.x, dy = tower.centerY - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= def.bombRange && dist < nearestDist) {
                nearest = tower; nearestDist = dist;
            }
        }
        if (!nearest) return;

        enemy._bombCooldown = def.bombCooldown;
        const dx = nearest.centerX - enemy.x, dy = nearest.centerY - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        this.enemyBombs.push({
            startX: enemy.x, startY: enemy.y,
            x: enemy.x, y: enemy.y,
            targetX: nearest.centerX, targetY: nearest.centerY,
            targetTower: nearest,
            speed: 3,
            progress: 0,
            totalDist: dist,
            z: 0,
            hit: false
        });
        if (this.sound) this.sound.grenadeThrow();
    }

    _updateEnemyBombs(dt) {
        for (let i = this.enemyBombs.length - 1; i >= 0; i--) {
            const bomb = this.enemyBombs[i];
            const spd = bomb.speed * 60 * dt;
            bomb.progress = Math.min(1, bomb.progress + spd / Math.max(1, bomb.totalDist));

            bomb.x = bomb.startX + (bomb.targetX - bomb.startX) * bomb.progress;
            bomb.y = bomb.startY + (bomb.targetY - bomb.startY) * bomb.progress;
            bomb.z = Math.sin(bomb.progress * Math.PI) * 25;

            if (bomb.progress >= 1) {
                this._onEnemyBombHit(bomb);
                this.enemyBombs.splice(i, 1);
            }
        }
    }

    _onEnemyBombHit(bomb) {
        const tower = bomb.targetTower;
        if (!tower) return;
        const idx = this.towers.indexOf(tower);
        if (idx === -1) return;

        // Destroy tower
        this.towers.splice(idx, 1);
        this.grid.occupants[`${tower.gridX},${tower.gridY}`] = null;

        // Explosion particles
        this.particles.push(...this._createExplosionParticles(tower.centerX, tower.centerY));
        if (this.sound) this.sound.explosion();
    }

    _createHitParticle(x, y) {
        return {
            x, y, vx: (Math.random() - 0.5) * 60, vy: (Math.random() - 0.5) * 60,
            life: 0.3, maxLife: 0.3, size: 3, color: '#fff',
            update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt; }
        };
    }

    _createExplosionParticles(x, y) {
        const particles = [];
        const colors = ['#ff6600', '#ff3300', '#ff9900', '#ffcc00', '#ff0000'];
        // Fire burst particles
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 40 + Math.random() * 100;
            particles.push({
                x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                life: 0.4 + Math.random() * 0.3, maxLife: 0.7, size: 3 + Math.random() * 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.vx *= 0.96; this.vy *= 0.96; this.life -= dt; }
            });
        }
        // Smoke particles
        for (let i = 0; i < 6; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 20 + Math.random() * 40;
            particles.push({
                x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 15,
                life: 0.5 + Math.random() * 0.4, maxLife: 0.9, size: 5 + Math.random() * 6,
                color: '#555',
                update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.vx *= 0.94; this.vy *= 0.94; this.life -= dt; }
            });
        }
        return particles;
    }

    _createStunParticles(x, y) {
        const particles = [];
        for (let i = 0; i < 6; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 30 + Math.random() * 50;
            particles.push({
                x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                life: 0.4 + Math.random() * 0.2, maxLife: 0.6, size: 3 + Math.random() * 3,
                color: '#ffff00',
                update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.vx *= 0.9; this.vy *= 0.9; this.life -= dt; }
            });
        }
        // Star burst
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI * 2 / 4) * i;
            particles.push({
                x, y, vx: Math.cos(angle) * 80, vy: Math.sin(angle) * 80,
                life: 0.3, maxLife: 0.3, size: 5, color: '#ffd700',
                update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt; }
            });
        }
        return particles;
    }

    _createCritParticles(x, y) {
        const particles = [];
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 60 + Math.random() * 80;
            particles.push({
                x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                life: 0.3 + Math.random() * 0.3, maxLife: 0.6, size: 2 + Math.random() * 4,
                color: i % 2 === 0 ? '#ff0000' : '#ff4444',
                update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.vx *= 0.92; this.vy *= 0.92; this.life -= dt; }
            });
        }
        // Damage number particle
        particles.push({
            x, y: y - 10, vx: 0, vy: -60,
            life: 0.8, maxLife: 0.8, size: 0, color: '#ff0000', text: '暴击!',
            update(dt) { this.y += this.vy * dt; this.life -= dt; }
        });
        return particles;
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
        this.enemyBombs = this.enemyBombs.filter(b => !b.hit);
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
