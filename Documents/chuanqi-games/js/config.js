// js/config.js - All game constants and configurations

export const GRID_COLS = 40;
export const GRID_ROWS = 30;
export const CELL_SIZE = 20;
export const CANVAS_WIDTH = GRID_COLS * CELL_SIZE;  // 800
export const CANVAS_HEIGHT = GRID_ROWS * CELL_SIZE; // 600

// Cell types
export const CELL = {
    GRASS: 0,
    PATH: 1,
    OBSTACLE: 2,
    START: 3,
    END: 4
};

// Difficulty configurations
export const DIFFICULTY = {
    easy: {
        label: '简单', color: '#4ecca3',
        gold: 500, lives: 30, waves: 15,
        hpMultiplier: 0.7, speedMultiplier: 0.8, goldMultiplier: 1.5
    },
    normal: {
        label: '普通', color: '#f0a500',
        gold: 300, lives: 20, waves: 20,
        hpMultiplier: 1.0, speedMultiplier: 1.0, goldMultiplier: 1.0
    },
    hard: {
        label: '困难', color: '#e94560',
        gold: 200, lives: 15, waves: 25,
        hpMultiplier: 1.5, speedMultiplier: 1.2, goldMultiplier: 0.7
    },
    hell: {
        label: '地狱', color: '#ff0055',
        gold: 100, lives: 10, waves: 30,
        hpMultiplier: 2.5, speedMultiplier: 1.5, goldMultiplier: 0.5
    }
};

// Enemy definitions
export const ENEMY_TYPES = {
    infantry: {
        name: '步兵', hp: 100, speed: 1.0, armor: 0,
        livesCost: 1, goldReward: 10,
        color: '#e74c3c', size: 8, flying: false
    },
    heavy: {
        name: '重装兵', hp: 300, speed: 0.6, armor: 0,
        livesCost: 2, goldReward: 25,
        color: '#8e44ad', size: 12, flying: false
    },
    armored: {
        name: '装甲兵', hp: 200, speed: 0.8, armor: 0.5,
        livesCost: 2, goldReward: 20,
        color: '#7f8c8d', size: 10, flying: false
    },
    scout: {
        name: '侦察兵', hp: 50, speed: 2.0, armor: 0,
        livesCost: 1, goldReward: 15,
        color: '#f39c12', size: 6, flying: false
    },
    flyer: {
        name: '飞行兵', hp: 120, speed: 1.2, armor: 0,
        livesCost: 1, goldReward: 20,
        color: '#3498db', size: 9, flying: true
    },
    boss: {
        name: 'Boss', hp: 1000, speed: 0.4, armor: 10,
        livesCost: 5, goldReward: 100,
        color: '#c0392b', size: 16, flying: false
    }
};

// Tower / Weapon definitions
export const TOWER_TYPES = {
    machinegun: {
        name: '机枪塔', price: 50, damage: 10, range: 120,
        fireRate: 100,
        color: '#95a5a6', canHitAir: true,
        description: '攻速极快', category: 'tower',
        projectileColor: '#f1c40f', projectileSpeed: 8
    },
    missile: {
        name: '导弹塔', price: 150, damage: 50, range: 180,
        fireRate: 1500,
        color: '#e67e22', canHitAir: false,
        description: '范围溅射', category: 'tower',
        splashRadius: 50,
        projectileColor: '#e74c3c', projectileSpeed: 4
    },
    laser: {
        name: '激光塔', price: 200, damage: 30, range: 200,
        fireRate: 800,
        color: '#2ecc71', canHitAir: true,
        description: '即时命中，可对空', category: 'tower',
        instant: true, beamColor: '#2ecc71'
    },
    emp: {
        name: '电磁塔', price: 250, damage: 15, range: 150,
        fireRate: 2000,
        color: '#9b59b6', canHitAir: false,
        description: '范围减速', category: 'tower',
        slowFactor: 0.5, slowDuration: 2000,
        projectileColor: '#9b59b6', projectileSpeed: 6
    },
    freeze: {
        name: '冰冻塔', price: 100, damage: 5, range: 100,
        fireRate: 1200,
        color: '#1abc9c', canHitAir: false,
        description: '冻结2秒', category: 'tower',
        freezeDuration: 2000,
        projectileColor: '#00d2ff', projectileSpeed: 5
    },
    sniper: {
        name: '狙击塔', price: 300, damage: 100, range: 250,
        fireRate: 3000,
        color: '#34495e', canHitAir: true,
        description: '单体爆发', category: 'tower',
        projectileColor: '#ecf0f1', projectileSpeed: 15
    },
    spike: {
        name: '地刺', price: 75, damage: 40, range: 0,
        fireRate: 0,
        color: '#bdc3c7', canHitAir: false,
        description: '无视护甲，仅路径', category: 'trap',
        ignoresArmor: true, triggerDamage: 40, uses: 3
    },
    goldBoost: {
        name: '金币增幅器', price: 200, damage: 0, range: 150,
        fireRate: 0,
        color: '#f1c40f', canHitAir: false,
        description: '范围内击杀3x金币', category: 'gadget',
        goldMultiplier: 3
    }
};

// Wave generation config
export const WAVE_CONFIG = {
    prepTime: 15,
    spawnInterval: 1000,
    bossEveryNWaves: 5,
    enemyScalePerWave: 1.05
};

// Game states
export const GAME_STATE = {
    MENU: 'menu',
    PREPARING: 'preparing',
    WAVE_ACTIVE: 'wave_active',
    PAUSED: 'paused',
    VICTORY: 'victory',
    DEFEAT: 'defeat'
};

// Colors for rendering
export const COLORS = {
    grass: '#2a5d45',
    grassAlt: '#2d6349',
    path: '#8b7355',
    pathBorder: '#6b5535',
    obstacle: '#555',
    obstacleTop: '#777',
    start: '#4ecca3',
    end: '#e94560',
    grid: 'rgba(255,255,255,0.05)',
    rangePreview: 'rgba(78, 204, 163, 0.2)',
    rangeBorder: 'rgba(78, 204, 163, 0.5)',
    placementValid: 'rgba(78, 204, 163, 0.3)',
    placementInvalid: 'rgba(233, 69, 96, 0.3)',
    hpBar: '#2ecc71',
    hpBarBg: '#333',
    hpBarLost: '#e74c3c'
};

// PvP settings
export const PVP_CONFIG = {
    SEND_COSTS: {
        infantry: 10, heavy: 30, armored: 25, scout: 15, flyer: 20, boss: 100
    },
    SEND_COOLDOWNS: {
        infantry: 500, heavy: 1000, armored: 1000, scout: 300, flyer: 800, boss: 3000
    },
    PVP_DIFFICULTY: {
        easy:   { defenderGold: 500, attackerGold: 200, regenRate: 4, breachBonus: 25 },
        normal: { defenderGold: 300, attackerGold: 300, regenRate: 5, breachBonus: 30 },
        hard:   { defenderGold: 200, attackerGold: 400, regenRate: 6, breachBonus: 35 },
        hell:   { defenderGold: 100, attackerGold: 500, regenRate: 8, breachBonus: 40 }
    },
    SERVER_URL: `ws://${window.location.host}`,
    GRACE_PERIOD: 30
};
