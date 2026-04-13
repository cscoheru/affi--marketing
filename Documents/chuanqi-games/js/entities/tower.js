// js/entities/tower.js - Tower targeting and shooting logic

import { TOWER_TYPES, CELL_SIZE, UPGRADE_STATS } from '../config.js';

export function createTower(type, gridX, gridY) {
    const def = TOWER_TYPES[type];
    return {
        type,
        gridX, gridY,
        centerX: gridX * CELL_SIZE + CELL_SIZE / 2,
        centerY: gridY * CELL_SIZE + CELL_SIZE / 2,
        name: def.name,
        price: def.price,
        damage: def.damage,
        range: def.range,
        fireRate: def.fireRate,
        color: def.color,
        canHitAir: def.canHitAir,
        category: def.category,
        lastFired: 0,
        angle: 0,
        level: 1,
        splashRadius: def.splashRadius || 0,
        slowFactor: def.slowFactor || 0,
        slowDuration: def.slowDuration || 0,
        freezeDuration: def.freezeDuration || 0,
        instant: def.instant || false,
        beamColor: def.beamColor || null,
        ignoresArmor: def.ignoresArmor || false,
        goldMultiplier: def.goldMultiplier || 0,
        projectileColor: def.projectileColor || '#fff',
        projectileSpeed: def.projectileSpeed || 5,
        triggerDamage: def.triggerDamage || 0,
        uses: def.uses || null,
        usesLeft: def.uses || null,
        triggeredEnemies: new Set(),
        beamTarget: null,
        beamTimer: 0,
        // Special effect state (populated at level 3)
        specialEffect: null,
        chainTargets: null,
        clusterPending: null,

        update(dt, enemies, projectiles) {
            if (this.category === 'trap') {
                this._updateTrap(dt, enemies);
                return;
            }
            if (this.category === 'gadget') return;

            this.lastFired += dt * 1000;

            if (this.beamTimer > 0) {
                this.beamTimer -= dt * 1000;
                if (this.beamTimer <= 0) this.beamTarget = null;
            }

            const target = this._findTarget(enemies);
            if (!target) return;

            const dx = target.x - this.centerX;
            const dy = target.y - this.centerY;
            this.angle = Math.atan2(dy, dx);

            if (this.lastFired >= this.fireRate) {
                this.lastFired = 0;

                if (this.instant) {
                    this.beamTarget = { x: target.x, y: target.y };
                    this.beamTimer = 100;
                    projectiles.push({
                        x: this.centerX, y: this.centerY,
                        targetX: target.x, targetY: target.y,
                        damage: this.damage,
                        target: target,
                        type: this.type,
                        instant: true,
                        beamColor: this.beamColor,
                        ignoresArmor: false,
                        hit: false,
                        expired: false,
                        splashRadius: this.splashRadius,
                        slow: this.slowFactor > 0,
                        slowFactor: this.slowFactor,
                        slowDuration: this.slowDuration,
                        freeze: this.freezeDuration > 0,
                        freezeDuration: this.freezeDuration,
                        specialEffect: this.specialEffect,
                        towerRef: this,
                        update(dt) { this.hit = true; }
                    });
                } else {
                    projectiles.push({
                        x: this.centerX, y: this.centerY,
                        startX: this.centerX, startY: this.centerY,
                        target: target,
                        damage: this.damage,
                        speed: this.projectileSpeed,
                        type: this.type,
                        color: this.projectileColor,
                        ignoresArmor: false,
                        hit: false,
                        expired: false,
                        splashRadius: this.splashRadius,
                        slow: this.slowFactor > 0,
                        slowFactor: this.slowFactor,
                        slowDuration: this.slowDuration,
                        freeze: this.freezeDuration > 0,
                        freezeDuration: this.freezeDuration,
                        arc: def.arc || false,
                        arcProgress: 0,
                        specialEffect: this.specialEffect,
                        towerRef: this,
                        update(dt) {
                            if (!this.target || this.target.dead) { this.expired = true; return; }
                            const dx = this.target.x - this.startX;
                            const dy = this.target.y - this.startY;
                            const totalDist = Math.sqrt(dx * dx + dy * dy);
                            const spd = this.speed * 60 * dt;
                            this.arcProgress = Math.min(1, this.arcProgress + spd / Math.max(1, totalDist));
                            if (this.arcProgress >= 1) {
                                this.hit = true;
                                this.x = this.target.x;
                                this.y = this.target.y;
                            } else {
                                this.x = this.startX + dx * this.arcProgress;
                                this.y = this.startY + dy * this.arcProgress;
                                if (this.arc) {
                                    this.z = Math.sin(this.arcProgress * Math.PI) * 30;
                                }
                            }
                        },
                        z: 0
                    });
                }
            }
        },

        _findTarget(enemies) {
            let closest = null;
            let closestDist = Infinity;

            for (const enemy of enemies) {
                if (enemy.dead || enemy.reachedEnd) continue;
                if (!this.canHitAir && enemy.flying) continue;

                const dx = enemy.x - this.centerX;
                const dy = enemy.y - this.centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist <= this.range && dist < closestDist) {
                    closest = enemy;
                    closestDist = dist;
                }
            }

            return closest;
        },

        _updateTrap(dt, enemies) {
            if (this.usesLeft <= 0) return;

            for (const enemy of enemies) {
                if (enemy.dead || enemy.reachedEnd || enemy.flying) continue;
                if (this.triggeredEnemies.has(enemy)) continue;

                const ex = Math.floor(enemy.x / CELL_SIZE);
                const ey = Math.floor(enemy.y / CELL_SIZE);
                if (ex === this.gridX && ey === this.gridY) {
                    this.triggeredEnemies.add(enemy);
                    enemy.takeDamage(this.triggerDamage);
                    this.usesLeft--;

                    // Spike special: extra triggers on adjacent cells
                    if (this.specialEffect && this.specialEffect.extraTriggers) {
                        let extra = 0;
                        for (const other of enemies) {
                            if (extra >= this.specialEffect.extraTriggers) break;
                            if (other === enemy || other.dead || other.reachedEnd || other.flying) continue;
                            const ox = Math.floor(other.x / CELL_SIZE);
                            const oy = Math.floor(other.y / CELL_SIZE);
                            if (Math.abs(ox - this.gridX) <= 1 && Math.abs(oy - this.gridY) <= 1) {
                                other.takeDamage(this.triggerDamage);
                                if (other.hp <= 0) other.dead = true;
                                extra++;
                            }
                        }
                    }

                    if (enemy.hp <= 0) enemy.dead = true;
                }
            }
        }
    };
}
