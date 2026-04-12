// js/systems/wave.js - Wave spawning and management

import { ENEMY_TYPES, DIFFICULTY, WAVE_CONFIG } from '../config.js';

export class WaveSystem {
    constructor(difficulty, pathPixels, grid) {
        this.difficulty = difficulty;
        this.diffConfig = DIFFICULTY[difficulty];
        this.pathPixels = pathPixels;
        this.totalWaves = this.diffConfig.waves;
        this.currentWave = 0;
        this.waveActive = false;
        this.spawnQueue = [];
        this.spawnTimer = 0;
        this.allSpawned = false;
    }

    startNextWave() {
        this.currentWave++;
        this.waveActive = true;
        this.allSpawned = false;
        this.spawnQueue = this._generateWave(this.currentWave);
        this.spawnTimer = 0;
    }

    _generateWave(waveNum) {
        const queue = [];
        const hpMult = this.diffConfig.hpMultiplier * Math.pow(WAVE_CONFIG.enemyScalePerWave, waveNum - 1);
        const speedMult = this.diffConfig.speedMultiplier;

        const baseCount = 3 + Math.floor(waveNum * 1.5);
        const enemies = [];

        const infantryCount = Math.max(2, baseCount - Math.floor(waveNum / 2));
        for (let i = 0; i < infantryCount; i++) enemies.push('infantry');

        if (waveNum >= 3) {
            const count = Math.floor(waveNum / 3);
            for (let i = 0; i < count; i++) enemies.push('heavy');
        }

        if (waveNum >= 5) {
            const count = Math.floor(waveNum / 4);
            for (let i = 0; i < count; i++) enemies.push('armored');
        }

        if (waveNum >= 2) {
            const count = Math.floor(waveNum / 2);
            for (let i = 0; i < count; i++) enemies.push('scout');
        }

        if (waveNum >= 6) {
            const count = Math.floor((waveNum - 4) / 3);
            for (let i = 0; i < count; i++) enemies.push('flyer');
        }

        if (waveNum % WAVE_CONFIG.bossEveryNWaves === 0) {
            enemies.push('boss');
        }

        if (waveNum === this.totalWaves) {
            enemies.push('boss');
            enemies.push('boss');
        }

        for (let i = enemies.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [enemies[i], enemies[j]] = [enemies[j], enemies[i]];
        }

        enemies.forEach((type, idx) => {
            const def = ENEMY_TYPES[type];
            queue.push({
                type,
                hp: Math.floor(def.hp * hpMult),
                speed: def.speed * speedMult,
                spawnDelay: idx * WAVE_CONFIG.spawnInterval / 1000
            });
        });

        return queue;
    }

    update(dt) {
        if (!this.waveActive || this.allSpawned) return;
        this.spawnTimer += dt;
    }

    getPendingSpawns() {
        if (!this.waveActive) return [];

        const toSpawn = [];
        while (this.spawnQueue.length > 0 && this.spawnQueue[0].spawnDelay <= this.spawnTimer) {
            toSpawn.push(this.spawnQueue.shift());
        }

        if (this.spawnQueue.length === 0) {
            this.allSpawned = true;
        }

        return toSpawn;
    }

    isWaveComplete() {
        return this.waveActive && this.allSpawned;
    }

    allWavesComplete() {
        return this.currentWave >= this.totalWaves && this.allSpawned;
    }
}
