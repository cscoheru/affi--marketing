// server/game-engine.js - Server-authoritative game logic

import { ENEMY_TYPES, TOWER_TYPES, DIFFICULTY, CELL, CELL_SIZE } from '../js/config.js';

const TICK_RATE = 20;
const TICK_INTERVAL = 1000 / TICK_RATE;

const PVP_DIFFICULTY = {
    easy:   { defenderGold: 500, attackerGold: 200, regenRate: 4, breachBonus: 25 },
    normal: { defenderGold: 300, attackerGold: 300, regenRate: 5, breachBonus: 30 },
    hard:   { defenderGold: 200, attackerGold: 400, regenRate: 6, breachBonus: 35 },
    hell:   { defenderGold: 100, attackerGold: 500, regenRate: 8, breachBonus: 40 }
};

const SEND_COSTS = {
    infantry: 10, heavy: 30, armored: 25, scout: 15, flyer: 20, boss: 100
};

const SEND_COOLDOWNS = {
    infantry: 500, heavy: 1000, armored: 1000, scout: 300, flyer: 800, boss: 3000
};

export class GameEngine {
    constructor(room) {
        this.room = room;
        this.diffConfig = PVP_DIFFICULTY[room.difficulty];
        this.mapData = room.mapData;
        this.grid = room.mapData.grid;
        this.path = room.mapData.path;

        this.defenderGold = this.diffConfig.defenderGold;
        this.attackerGold = this.diffConfig.attackerGold;
        this.lives = DIFFICULTY[room.difficulty].lives;

        this.towers = [];
        this.occupants = {};
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.enemyIdCounter = 0;
        this.lastSendTime = {};

        this.tickInterval = null;
        this.regenAccum = 0;
        this.endTime = null;
    }

    start() {
        this.room.state = 'playing';
        this.room.broadcast({ type: 'game_start' });
        this.tickInterval = setInterval(() => this.tick(), TICK_INTERVAL);
    }

    stop() {
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
            this.tickInterval = null;
        }
    }

    tick() {
        if (this.room.state !== 'playing') return;
        const dt = TICK_INTERVAL / 1000;

        // Attacker resource regen
        this.regenAccum += this.diffConfig.regenRate * dt;
        if (this.regenAccum >= 1) {
            const gain = Math.floor(this.regenAccum);
            this.attackerGold += gain;
            this.regenAccum -= gain;
        }

        this._updateEnemies(dt);
        this._updateTowers(dt);
        this._updateProjectiles(dt);

        this.particles = this.particles.filter(p => { p.life -= dt; return p.life > 0; });
        this.enemies = this.enemies.filter(e => !e.dead && !e.reachedEnd);

        this._checkWinCondition();
        this._broadcastState();
    }

    handleAction(ws, action) {
        const role = ws.roomRole;
        if (!role || this.room.state !== 'playing') return;

        switch (action.type) {
            case 'place_tower':
                if (role !== 'defender') return;
                this._placeTower(action.towerType, action.x, action.y);
                break;
            case 'send_enemy':
                if (role !== 'attacker') return;
                this._sendEnemy(action.enemyType);
                break;
            case 'sell_tower':
                if (role !== 'defender') return;
                this._sellTower(action.x, action.y);
                break;
            case 'upgrade_tower':
                if (role !== 'defender') return;
                this._upgradeTower(action.x, action.y);
                break;
        }
    }

    _placeTower(towerType, x, y) {
        const def = TOWER_TYPES[towerType];
        if (!def) return;
        if (this.defenderGold < def.price) return;

        const cell = this.grid[y]?.[x];
        if (cell === undefined) return;
        if (cell !== CELL.GRASS && cell !== CELL.PATH) return;
        if (def.category === 'trap' && cell !== CELL.PATH) return;
        if (def.category === 'tower' && cell !== CELL.GRASS) return;
        if (this.occupants[`${x},${y}`]) return;

        this.defenderGold -= def.price;

        const tower = {
            type: towerType, gridX: x, gridY: y,
            centerX: x * CELL_SIZE + CELL_SIZE / 2,
            centerY: y * CELL_SIZE + CELL_SIZE / 2,
            name: def.name, price: def.price,
            damage: def.damage, range: def.range,
            fireRate: def.fireRate, color: def.color,
            canHitAir: def.canHitAir, category: def.category,
            lastFired: 0, angle: 0, level: 1,
            splashRadius: def.splashRadius || 0,
            slowFactor: def.slowFactor || 0, slowDuration: def.slowDuration || 0,
            freezeDuration: def.freezeDuration || 0,
            instant: def.instant || false, beamColor: def.beamColor || null,
            goldMultiplier: def.goldMultiplier || 0,
            projectileColor: def.projectileColor || '#fff',
            projectileSpeed: def.projectileSpeed || 5,
            triggerDamage: def.triggerDamage || 0, usesLeft: def.uses || null,
            triggeredEnemies: new Set(), beamTarget: null, beamTimer: 0
        };

        this.towers.push(tower);
        this.occupants[`${x},${y}`] = tower;
    }

    _sellTower(x, y) {
        const key = `${x},${y}`;
        const tower = this.occupants[key];
        if (!tower) return;
        this.defenderGold += Math.floor(tower.price * 0.5 * tower.level);
        const idx = this.towers.indexOf(tower);
        if (idx !== -1) this.towers.splice(idx, 1);
        delete this.occupants[key];
    }

    _upgradeTower(x, y) {
        const tower = this.occupants[`${x},${y}`];
        if (!tower) return;
        const cost = Math.floor(TOWER_TYPES[tower.type].price * 0.75 * tower.level);
        if (this.defenderGold < cost) return;
        this.defenderGold -= cost;
        tower.damage *= 1.25;
        tower.range *= 1.1;
        tower.level++;
    }

    _sendEnemy(enemyType) {
        const cost = SEND_COSTS[enemyType];
        if (!cost || this.attackerGold < cost) return;
        const now = Date.now();
        const cooldown = SEND_COOLDOWNS[enemyType] || 500;
        if (this.lastSendTime[enemyType] && now - this.lastSendTime[enemyType] < cooldown) return;

        this.attackerGold -= cost;
        this.lastSendTime[enemyType] = now;

        const def = ENEMY_TYPES[enemyType];
        const diffConfig = DIFFICULTY[this.room.difficulty];

        this.enemies.push({
            id: this.enemyIdCounter++, type: enemyType,
            x: this.path[0].x, y: this.path[0].y,
            hp: Math.floor(def.hp * diffConfig.hpMultiplier),
            maxHp: Math.floor(def.hp * diffConfig.hpMultiplier),
            speed: def.speed * diffConfig.speedMultiplier,
            armor: def.armor, livesCost: def.livesCost, goldReward: def.goldReward,
            color: def.color, size: def.size, flying: def.flying,
            pathIndex: 0, dead: false, reachedEnd: false,
            frozen: false, frozenTimer: 0, slowFactor: 1.0, slowTimer: 0
        });
    }

    _updateEnemies(dt) {
        for (const enemy of this.enemies) {
            if (enemy.dead || enemy.reachedEnd) continue;

            if (enemy.frozen) {
                enemy.frozenTimer -= dt * 1000;
                if (enemy.frozenTimer <= 0) enemy.frozen = false;
                continue;
            }
            if (enemy.slowTimer > 0) {
                enemy.slowTimer -= dt * 1000;
                if (enemy.slowTimer <= 0) enemy.slowFactor = 1.0;
            }

            const speed = enemy.speed * enemy.slowFactor * 60 * dt;
            let remaining = speed;

            while (remaining > 0 && enemy.pathIndex < this.path.length - 1) {
                const target = this.path[enemy.pathIndex + 1];
                const dx = target.x - enemy.x;
                const dy = target.y - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist <= remaining) {
                    enemy.x = target.x; enemy.y = target.y;
                    enemy.pathIndex++; remaining -= dist;
                } else {
                    enemy.x += (dx / dist) * remaining;
                    enemy.y += (dy / dist) * remaining;
                    remaining = 0;
                }
            }

            if (enemy.pathIndex >= this.path.length - 1) {
                enemy.reachedEnd = true;
                this.lives = Math.max(0, this.lives - enemy.livesCost);
                this.attackerGold += this.diffConfig.breachBonus;
            }
        }
    }

    _updateTowers(dt) {
        for (const tower of this.towers) {
            if (tower.category === 'trap') { this._updateTrap(tower); continue; }
            if (tower.category === 'gadget') continue;

            tower.lastFired += dt * 1000;
            if (tower.beamTimer > 0) {
                tower.beamTimer -= dt * 1000;
                if (tower.beamTimer <= 0) tower.beamTarget = null;
            }

            const target = this._findTarget(tower);
            if (!target) continue;

            const dx = target.x - tower.centerX;
            const dy = target.y - tower.centerY;
            tower.angle = Math.atan2(dy, dx);

            if (tower.lastFired >= tower.fireRate) {
                tower.lastFired = 0;
                if (tower.instant) {
                    tower.beamTarget = { x: target.x, y: target.y };
                    tower.beamTimer = 100;
                    this._applyDamage(target, tower.damage, tower);
                } else {
                    this.projectiles.push({
                        x: tower.centerX, y: tower.centerY, targetId: target.id,
                        target, damage: tower.damage, speed: tower.projectileSpeed,
                        type: tower.type, color: tower.projectileColor,
                        splashRadius: tower.splashRadius,
                        slow: tower.slowFactor > 0, slowFactor: tower.slowFactor, slowDuration: tower.slowDuration,
                        freeze: tower.freezeDuration > 0, freezeDuration: tower.freezeDuration,
                        hit: false, expired: false
                    });
                }
            }
        }
    }

    _updateTrap(tower) {
        if (tower.usesLeft <= 0) return;
        for (const enemy of this.enemies) {
            if (enemy.dead || enemy.reachedEnd || enemy.flying) continue;
            if (tower.triggeredEnemies.has(enemy.id)) continue;
            const ex = Math.floor(enemy.x / CELL_SIZE);
            const ey = Math.floor(enemy.y / CELL_SIZE);
            if (ex === tower.gridX && ey === tower.gridY) {
                tower.triggeredEnemies.add(enemy.id);
                enemy.hp -= tower.triggerDamage;
                tower.usesLeft--;
                if (enemy.hp <= 0) { enemy.dead = true; this.defenderGold += enemy.goldReward; }
            }
        }
    }

    _findTarget(tower) {
        let closest = null, closestDist = Infinity;
        for (const enemy of this.enemies) {
            if (enemy.dead || enemy.reachedEnd) continue;
            if (!tower.canHitAir && enemy.flying) continue;
            const dx = enemy.x - tower.centerX, dy = enemy.y - tower.centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= tower.range && dist < closestDist) { closest = enemy; closestDist = dist; }
        }
        return closest;
    }

    _updateProjectiles(dt) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            if (proj.hit || proj.expired) { this.projectiles.splice(i, 1); continue; }

            const target = this.enemies.find(e => e.id === proj.targetId);
            if (!target || target.dead) { this.projectiles.splice(i, 1); continue; }

            const dx = target.x - proj.x, dy = target.y - proj.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 5) {
                proj.hit = true; proj.x = target.x; proj.y = target.y;
                this._applyDamage(target, proj.damage, proj);
                this.projectiles.splice(i, 1);
            } else {
                const spd = proj.speed * 60 * dt;
                proj.x += (dx / dist) * spd;
                proj.y += (dy / dist) * spd;
            }
        }
    }

    _applyDamage(enemy, damage, source) {
        if (!enemy || enemy.dead) return;
        let d = damage;
        if (enemy.armor > 0) d = Math.max(1, d * (1 - enemy.armor));
        enemy.hp -= d;

        if (source.slow && !enemy.frozen) {
            enemy.slowFactor = source.slowFactor;
            enemy.slowTimer = source.slowDuration;
        }
        if (source.freeze) { enemy.frozen = true; enemy.frozenTimer = source.freezeDuration; }
        if (source.splashRadius) {
            this._applySplash(enemy.x, enemy.y, source.splashRadius, d * 0.5);
        }

        this.particles.push({ x: enemy.x, y: enemy.y, vx: (Math.random() - 0.5) * 60, vy: (Math.random() - 0.5) * 60, life: 0.3, maxLife: 0.3, size: 3, color: '#fff' });

        if (enemy.hp <= 0) {
            enemy.dead = true;
            this.defenderGold += enemy.goldReward;
            for (let i = 0; i < 5; i++) {
                this.particles.push({ x: enemy.x, y: enemy.y, vx: (Math.random() - 0.5) * 120, vy: (Math.random() - 0.5) * 120, life: 0.5, maxLife: 0.5, size: 4, color: enemy.color });
            }
        }
    }

    _applySplash(x, y, radius, damage) {
        for (const enemy of this.enemies) {
            if (enemy.dead) continue;
            const dx = enemy.x - x, dy = enemy.y - y;
            if (Math.sqrt(dx * dx + dy * dy) <= radius) {
                let d = damage;
                if (enemy.armor > 0) d = Math.max(1, d * (1 - enemy.armor));
                enemy.hp -= d;
                if (enemy.hp <= 0) { enemy.dead = true; this.defenderGold += enemy.goldReward; }
            }
        }
    }

    _checkWinCondition() {
        if (this.lives <= 0) { this._endGame('attacker'); return; }
        if (this.attackerGold <= 0 && this.enemies.length === 0 && !this.endTime) {
            this.endTime = Date.now() + 30000;
        }
        if (this.endTime && Date.now() >= this.endTime) {
            if (this.attackerGold <= 0 && this.enemies.length === 0) this._endGame('defender');
            this.endTime = null;
        }
        if (this.endTime && this.enemies.length > 0) this.endTime = null;
    }

    _endGame(winner) {
        this.room.state = 'ended';
        this.stop();
        this.room.broadcast({
            type: 'game_over', winner,
            stats: { defenderGold: this.defenderGold, attackerGold: this.attackerGold, livesLeft: this.lives, towersPlaced: this.towers.length, enemiesSent: this.enemyIdCounter }
        });
    }

    _broadcastState() {
        this.room.broadcast({
            type: 'state',
            defenderGold: this.defenderGold,
            attackerGold: this.attackerGold,
            lives: this.lives,
            enemies: this.enemies.map(e => ({ id: e.id, type: e.type, x: e.x, y: e.y, hp: e.hp, maxHp: e.maxHp, size: e.size, color: e.color, flying: e.flying, frozen: e.frozen, slowFactor: e.slowFactor, pathIndex: e.pathIndex })),
            towers: this.towers.map(t => ({ type: t.type, gridX: t.gridX, gridY: t.gridY, centerX: t.centerX, centerY: t.centerY, color: t.color, angle: t.angle, level: t.level, range: t.range, category: t.category, beamTarget: t.beamTarget, beamTimer: t.beamTimer, usesLeft: t.usesLeft })),
            projectiles: this.projectiles.map(p => ({ x: p.x, y: p.y, color: p.color, type: p.type })),
            particles: this.particles
        });
    }
}
