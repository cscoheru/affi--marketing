// js/main.js - Game entry point

import { GAME_STATE, DIFFICULTY, TOWER_TYPES } from './config.js';
import { Game } from './game.js';
import { Renderer } from './renderer.js';
import { Grid } from './systems/grid.js';
import { WaveSystem } from './systems/wave.js';
import { Economy } from './systems/economy.js';
import { InputHandler } from './input.js';
import { MapLoader } from './map/map-loader.js';
import { MapEditor } from './map/map-editor.js';
import { createTower } from './entities/tower.js';
import { NetworkClient } from './network.js';
import { PVP_CONFIG, ENEMY_TYPES } from './config.js';
import { SoundManager } from './audio.js';

class App {
    constructor() {
        this.game = null;
        this.renderer = null;
        this.grid = null;
        this.waveSystem = null;
        this.economy = null;
        this.input = null;
        this.mapLoader = new MapLoader();
        this.mapEditor = null;
        this.sound = new SoundManager();

        this.difficulty = null;
        this.selectedMapData = null;
        this.animFrameId = null;
        this.lastTime = 0;

        this._setupUI();
        this._showScreen('menu-screen');
    }

    _setupUI() {
        // Initialize audio on first user interaction (browser requirement)
        if (!this.sound.ctx) {
            const initAudio = () => {
                this.sound.init();
                document.removeEventListener('click', initAudio);
                document.removeEventListener('keydown', initAudio);
            };
            document.addEventListener('click', initAudio);
            document.addEventListener('keydown', initAudio);
        }

        document.getElementById('btn-start').addEventListener('click', () => {
            this._showScreen('difficulty-screen');
        });
        document.getElementById('btn-editor').addEventListener('click', () => {
            this._initEditor();
            this._showScreen('editor-screen');
        });

        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const diff = btn.dataset.diff;
                this.difficulty = diff;
                document.getElementById('diff-description').textContent =
                    `金币: ${DIFFICULTY[diff].gold} | 生命: ${DIFFICULTY[diff].lives} | 波次: ${DIFFICULTY[diff].waves}`;
                this._showMapSelect();
            });
        });
        document.getElementById('btn-back-menu').addEventListener('click', () => {
            this._showScreen('menu-screen');
        });

        document.getElementById('btn-back-diff').addEventListener('click', () => {
            this._showScreen('difficulty-screen');
        });

        document.getElementById('btn-start-wave').addEventListener('click', () => {
            this._startWave();
        });
        document.getElementById('btn-pause').addEventListener('click', () => {
            if (this.game) this.game.togglePause();
        });
        document.getElementById('btn-speed').addEventListener('click', () => {
            if (this.game) {
                const speed = this.game.cycleSpeed();
                document.getElementById('btn-speed').textContent = `加速 x${speed}`;
            }
        });
        document.getElementById('btn-back-menu-game').addEventListener('click', () => {
            if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
            this.game = null;
            this._showScreen('menu-screen');
        });

        document.getElementById('btn-retry').addEventListener('click', () => {
            document.getElementById('result-overlay').classList.remove('active');
            this._startGame(this.selectedMapData);
        });
        document.getElementById('btn-back-menu-result').addEventListener('click', () => {
            document.getElementById('result-overlay').classList.remove('active');
            if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
            this.game = null;
            this._showScreen('menu-screen');
        });

        document.getElementById('btn-back-menu-editor').addEventListener('click', () => {
            this._showScreen('menu-screen');
        });

        // Tower info panel buttons
        document.getElementById('btn-upgrade').addEventListener('click', () => {
            this._upgradeTower();
        });
        document.getElementById('btn-sell').addEventListener('click', () => {
            this._sellTower();
        });
        document.getElementById('btn-close-info').addEventListener('click', () => {
            this._hideTowerInfo();
        });

        // PvP buttons
        document.getElementById('btn-pvp').addEventListener('click', () => {
            this._initPvP();
            this._showScreen('pvp-lobby-screen');
        });
        document.getElementById('btn-create-room').addEventListener('click', () => this._createPvPRoom());
        document.getElementById('btn-join-room').addEventListener('click', () => this._joinPvPRoom());
        document.getElementById('btn-leave-lobby').addEventListener('click', () => {
            this._leavePvPLobby();
            this._showScreen('pvp-lobby-screen');
        });
        document.getElementById('btn-back-menu-pvp').addEventListener('click', () => {
            if (this.network) this.network.disconnect();
            this._showScreen('menu-screen');
        });
        document.getElementById('btn-pvp-back-menu').addEventListener('click', () => {
            if (this.pvpAnimFrame) cancelAnimationFrame(this.pvpAnimFrame);
            if (this.network) this.network.disconnect();
            this._showScreen('menu-screen');
        });
        document.getElementById('btn-pvp-ready').addEventListener('click', () => {
            if (this.network) this.network.send({ type: 'ready' });
        });
    }

    _showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');
    }

    _showMapSelect() {
        const mapList = document.getElementById('map-list');
        mapList.innerHTML = '';

        const maps = this.mapLoader.listMaps();
        if (maps.length === 0) {
            mapList.innerHTML = '<p style="color:#aaa;">暂无地图，请先在地图编辑器中创建</p>';
        } else {
            maps.forEach(name => {
                const item = document.createElement('div');
                item.className = 'map-item';
                const data = this.mapLoader.loadMap(name);
                item.innerHTML = `
                    <div class="map-name">${name}</div>
                    <div class="map-info">${data ? data.pathLength + ' 格路径' : ''}</div>
                `;
                item.addEventListener('click', () => {
                    this.selectedMapData = this.mapLoader.loadMap(name);
                    this._startGame(this.selectedMapData);
                });
                mapList.appendChild(item);
            });
        }

        this._showScreen('map-screen');
    }

    _startGame(mapData) {
        if (!mapData) { alert('地图数据无效'); return; }

        this._showScreen('game-screen');

        const canvas = document.getElementById('game-canvas');
        this.game = new Game(canvas);
        this.grid = new Grid(mapData.grid);
        this.waveSystem = new WaveSystem(this.difficulty, mapData.path, this.grid);
        this.economy = new Economy(DIFFICULTY[this.difficulty]);
        this.renderer = new Renderer(canvas.getContext('2d'), this.grid);
        this.input = new InputHandler(canvas);

        this.game.init(this.grid, this.waveSystem, this.economy, this.renderer, this.input, this.sound);

        this.game.totalWaves = this.waveSystem.totalWaves;
        this.game.start();

        this._setupShopUI();
        this._updateHUD();

        this.lastTime = performance.now();
        this._gameLoop(this.lastTime);
    }

    _setupShopUI() {
        const shopContainer = document.getElementById('shop-items');
        shopContainer.innerHTML = '';

        for (const [key, tower] of Object.entries(TOWER_TYPES)) {
            const item = document.createElement('div');
            item.className = 'shop-item';
            item.dataset.towerType = key;
            item.innerHTML = `
                <div class="shop-icon" style="background:${tower.color};">${this._getTowerEmoji(key)}</div>
                <div class="shop-info">
                    <div class="shop-name">${tower.name}</div>
                    <div class="shop-desc">${tower.description}</div>
                </div>
                <div class="shop-price">${tower.price}</div>
            `;
            item.addEventListener('click', () => {
                if (this.economy.gold < tower.price) return;
                document.querySelectorAll('.shop-item').forEach(i => i.classList.remove('selected'));
                if (this.game.selectedTower === key) {
                    this.game.selectedTower = null;
                } else {
                    this.game.selectedTower = key;
                    item.classList.add('selected');
                }
                this.game.selectedPlacedTower = null;
            });
            shopContainer.appendChild(item);
        }
    }

    _getTowerEmoji(type) {
        const emojis = {
            machinegun: '🔫', missile: '🚀', laser: '⚡', emp: '🧲',
            freeze: '❄️', sniper: '🎯', spike: '📌', goldBoost: '💰'
        };
        return emojis[type] || '🗼';
    }

    _startWave() {
        if (!this.game) return;
        if (this.game.state === GAME_STATE.PREPARING) {
            this.game.state = GAME_STATE.WAVE_ACTIVE;
            this.waveSystem.startNextWave();
            this.game.currentWave = this.waveSystem.currentWave;
            this.sound.waveStart();
        }
    }

    _gameLoop(timestamp) {
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
        this.lastTime = timestamp;

        if (this.game) {
            if (this.input.mouse.clicked) {
                this._handleCanvasClick();
            }

            this.game.update(dt);
            this.game.render();
            this._updateHUD();
            this._updateShopAffordability();

            if (this.game.state === GAME_STATE.VICTORY || this.game.state === GAME_STATE.DEFEAT) {
                this._showResult();
            }

            this.input.clearFrame();
        }

        this.animFrameId = requestAnimationFrame((t) => this._gameLoop(t));
    }

    _handleCanvasClick() {
        const { gridX, gridY } = this.input.mouse;
        const { grid, economy, selectedTower } = this.game;

        if (selectedTower) {
            this._hideTowerInfo();
            const towerDef = TOWER_TYPES[selectedTower];
            if (economy.gold >= towerDef.price && grid.canPlace(gridX, gridY, towerDef)) {
                economy.spendGold(towerDef.price);
                const tower = createTower(selectedTower, gridX, gridY);
                this.game.towers.push(tower);
                grid.setOccupied(gridX, gridY, tower);
                this.sound.placeTower();
            }
            return;
        }

        const placed = grid.getEntityAt(gridX, gridY);
        if (placed) {
            this.game.selectedPlacedTower = placed;
            this._showTowerInfo(placed);
        } else {
            this.game.selectedPlacedTower = null;
            this._hideTowerInfo();
        }
    }

    _updateHUD() {
        if (!this.game || !this.economy) return;
        document.getElementById('hud-wave').textContent = `波次: ${this.game.currentWave}/${this.game.totalWaves}`;
        document.getElementById('hud-gold').textContent = `金币: ${this.economy.gold}`;
        document.getElementById('hud-lives').textContent = `生命: ${this.economy.lives}`;
        document.getElementById('hud-difficulty').textContent = DIFFICULTY[this.difficulty]?.label || '';
    }

    _updateShopAffordability() {
        if (!this.economy) return;
        document.querySelectorAll('.shop-item').forEach(item => {
            const type = item.dataset.towerType;
            const price = TOWER_TYPES[type].price;
            item.classList.toggle('disabled', this.economy.gold < price);
        });
    }

    _showResult() {
        const isVictory = this.game.state === GAME_STATE.VICTORY;
        if (isVictory) this.sound.victory(); else this.sound.defeat();
        const title = document.getElementById('result-title');
        title.textContent = isVictory ? '胜利！' : '游戏结束';
        title.className = isVictory ? 'victory' : 'defeat';

        document.getElementById('result-stats').innerHTML = `
            <div>存活波次: <span>${this.game.currentWave}/${this.game.totalWaves}</span></div>
            <div>击杀总数: <span>${this.game.totalKills}</span></div>
            <div>剩余生命: <span>${this.economy.lives}</span></div>
            <div>剩余金币: <span>${this.economy.gold}</span></div>
        `;

        document.getElementById('result-overlay').classList.add('active');
    }

    _showTowerInfo(tower) {
        const panel = document.getElementById('tower-info');
        const gameArea = document.getElementById('game-area');
        const rect = gameArea.getBoundingClientRect();
        const containerRect = document.getElementById('game-container').getBoundingClientRect();

        // Position panel near the tower, offset to the right
        let left = rect.left - containerRect.left + tower.centerX + 20;
        let top = rect.top - containerRect.top + tower.centerY - 40;

        // Keep panel within game-container bounds
        if (left + 180 > containerRect.width) {
            left = rect.left - containerRect.left + tower.centerX - 190;
        }
        if (top < 0) top = 10;
        if (top + 120 > containerRect.height) top = containerRect.height - 130;

        panel.style.left = left + 'px';
        panel.style.top = top + 'px';
        panel.style.display = 'block';

        document.getElementById('tower-info-name').textContent = `${tower.name} Lv.${tower.level}`;

        const upgradeCost = Math.floor(TOWER_TYPES[tower.type].price * 0.75 * tower.level);
        const sellValue = Math.floor(tower.price * 0.5 * tower.level);
        document.getElementById('tower-info-stats').innerHTML =
            `伤害: ${Math.round(tower.damage * 10) / 10}<br>` +
            `范围: ${Math.round(tower.range * 10) / 10}<br>` +
            `升级费用: ${upgradeCost} 金币<br>` +
            `出售价值: ${sellValue} 金币`;
    }

    _hideTowerInfo() {
        document.getElementById('tower-info').style.display = 'none';
        if (this.game) this.game.selectedPlacedTower = null;
    }

    _upgradeTower() {
        const tower = this.game?.selectedPlacedTower;
        if (!tower) return;

        const cost = Math.floor(TOWER_TYPES[tower.type].price * 0.75 * tower.level);
        if (!this.economy.spendGold(cost)) return;

        tower.damage *= 1.25;
        tower.range *= 1.1;
        tower.level++;
        this.sound.upgradeTower();

        this._showTowerInfo(tower);
    }

    _sellTower() {
        const tower = this.game?.selectedPlacedTower;
        if (!tower) return;

        const sellValue = Math.floor(tower.price * 0.5 * tower.level);
        this.economy.addGold(sellValue);

        // Remove tower from game and grid
        const idx = this.game.towers.indexOf(tower);
        if (idx !== -1) this.game.towers.splice(idx, 1);
        this.grid.removeOccupant(tower.gridX, tower.gridY);

        this.sound.sellTower();
        this._hideTowerInfo();
    }

    _initEditor() {
        if (this.mapEditor) this.mapEditor.destroy();
        const canvas = document.getElementById('editor-canvas');
        this.mapEditor = new MapEditor(canvas, this.mapLoader);
    }

    // PvP methods
    _initPvP() {
        if (!this.network) this.network = new NetworkClient();
        this._populatePvPMapSelect();

        // Remove old listeners by re-setting up (use fresh handlers)
        this.network.on('room_created', (msg) => {
            this.pvpRole = 'defender';
            document.getElementById('room-id-display').style.display = 'block';
            document.getElementById('room-id-text').textContent = msg.roomId;
            document.getElementById('lobby-waiting').style.display = 'block';
            document.getElementById('lobby-waiting-text').textContent = '等待对手加入...';
        });

        this.network.on('room_joined', (msg) => {
            this.pvpRole = msg.role;
            this.pvpMapData = msg.mapData;
            document.getElementById('lobby-waiting').style.display = 'block';
            document.getElementById('lobby-waiting-text').textContent = '已加入房间，等待开始...';
            document.getElementById('join-status').textContent = '已加入！';
        });

        this.network.on('opponent_joined', () => {
            document.getElementById('lobby-waiting-text').textContent = '对手已加入！点击"准备"开始';
        });

        this.network.on('opponent_ready', () => {
            document.getElementById('lobby-waiting-text').textContent = '对手已准备！';
        });

        this.network.on('game_start', () => {
            this._startPvPGame();
        });

        this.network.on('error', (msg) => {
            alert(msg.message);
            const statusEl = document.getElementById('join-status');
            if (statusEl) statusEl.textContent = msg.message;
        });
    }

    _populatePvPMapSelect() {
        const select = document.getElementById('pvp-map-select');
        if (!select) return;
        select.innerHTML = '';
        const maps = this.mapLoader.listMaps();
        if (maps.length === 0) {
            select.innerHTML = '<option>暂无地图</option>';
            return;
        }
        maps.forEach(name => {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            select.appendChild(opt);
        });
    }

    async _createPvPRoom() {
        const mapName = document.getElementById('pvp-map-select').value;
        const difficulty = document.getElementById('pvp-diff-select').value;
        const data = this.mapLoader.loadMap(mapName);
        if (!data) { alert('地图数据无效'); return; }

        try {
            await this.network.connect(PVP_CONFIG.SERVER_URL);
            this.network.send({ type: 'create_room', mapData: data, difficulty });
            this.pvpRole = 'defender';
            this.pvpMapData = data;
        } catch (err) {
            alert('无法连接服务器');
        }
    }

    async _joinPvPRoom() {
        const roomId = document.getElementById('join-room-input').value.trim().toUpperCase();
        if (!roomId) return;

        try {
            await this.network.connect(PVP_CONFIG.SERVER_URL);
            this.network.send({ type: 'join_room', roomId });
            this.pvpRole = 'attacker';
            document.getElementById('join-status').textContent = '正在连接...';
        } catch (err) {
            document.getElementById('join-status').textContent = '无法连接服务器';
        }
    }

    _startPvPGame() {
        this._showScreen('pvp-game-screen');

        const canvas = document.getElementById('pvp-canvas');
        const grid = new Grid(this.pvpMapData.grid);
        const renderer = new Renderer(canvas.getContext('2d'), grid);
        const input = new InputHandler(canvas);

        this.pvpEnemies = [];
        this.pvpTowers = [];
        this.pvpProjectiles = [];
        this.pvpParticles = [];

        document.getElementById('pvp-hud-role').textContent = this.pvpRole === 'defender' ? '防守方' : '进攻方';

        // Setup defender shop
        if (this.pvpRole === 'defender') {
            canvas.style.cursor = 'crosshair';
            this._setupPvPShop();
        } else {
            canvas.style.cursor = 'default';
            this._setupPvPAttackerPanel();
        }

        // Listen for server state
        this.network.on('state', (msg) => this._onPvPState(msg));
        this.network.on('game_over', (msg) => this._onPvPGameOver(msg));
        this.network.on('disconnected', () => alert('与服务器断开连接'));

        // Render loop
        this._pvpRender(canvas, renderer, input, grid);
    }

    _setupPvPShop() {
        const panel = document.getElementById('pvp-side-panel');
        panel.innerHTML = '<h3>武器商店</h3><div id="pvp-shop-items"></div>';
        const container = document.getElementById('pvp-shop-items');
        for (const [key, tower] of Object.entries(TOWER_TYPES)) {
            const item = document.createElement('div');
            item.className = 'shop-item';
            item.dataset.towerType = key;
            const emojis = { machinegun: '🔫', missile: '🚀', laser: '⚡', emp: '🧲', freeze: '❄️', sniper: '🎯', spike: '📌', goldBoost: '💰' };
            item.innerHTML = `<div class="shop-icon" style="background:${tower.color};">${emojis[key] || '🗼'}</div><div class="shop-info"><div class="shop-name">${tower.name}</div><div class="shop-desc">${tower.description}</div></div><div class="shop-price">${tower.price}</div>`;
            item.addEventListener('click', () => {
                document.querySelectorAll('#pvp-shop-items .shop-item').forEach(i => i.classList.remove('selected'));
                if (this.pvpSelectedTower === key) { this.pvpSelectedTower = null; } else { this.pvpSelectedTower = key; item.classList.add('selected'); }
            });
            container.appendChild(item);
        }
    }

    _setupPvPAttackerPanel() {
        const panel = document.getElementById('pvp-side-panel');
        panel.innerHTML = '<div class="send-panel"><h3>派兵面板</h3><div id="send-items"></div><div class="regen-info">资源恢复: +<span id="regen-rate">5</span>/秒</div></div>';
        const container = document.getElementById('send-items');
        const emojis = { infantry: '👊', heavy: '🛡️', armored: '🦺', scout: '🏃', flyer: '🦅', boss: '👹' };
        for (const [type, cost] of Object.entries(PVP_CONFIG.SEND_COSTS)) {
            const def = ENEMY_TYPES[type];
            const item = document.createElement('div');
            item.className = 'send-item';
            item.dataset.enemyType = type;
            item.innerHTML = `<div class="send-icon" style="background:${def.color};">${emojis[type]}</div><div class="send-info"><div class="send-name">${def.name}</div><div class="send-desc">HP:${def.hp} 速度:${def.speed}</div></div><div class="send-cost">${cost}</div>`;
            item.addEventListener('click', () => {
                this.network.send({ type: 'send_enemy', enemyType: type });
                item.classList.add('on-cooldown');
                setTimeout(() => item.classList.remove('on-cooldown'), PVP_CONFIG.SEND_COOLDOWNS[type]);
            });
            container.appendChild(item);
        }
    }

    _onPvPState(msg) {
        this.pvpEnemies = msg.enemies;
        this.pvpTowers = msg.towers;
        this.pvpProjectiles = msg.projectiles;
        this.pvpParticles = msg.particles;
        document.getElementById('pvp-hud-lives').textContent = `生命: ${msg.lives}`;
        document.getElementById('pvp-hud-defender-gold').textContent = `防守金币: ${msg.defenderGold}`;
        document.getElementById('pvp-hud-attacker-gold').textContent = `进攻资源: ${msg.attackerGold}`;

        // Update shop affordability
        document.querySelectorAll('#pvp-shop-items .shop-item').forEach(item => {
            const type = item.dataset.towerType;
            if (type && TOWER_TYPES[type]) item.classList.toggle('disabled', msg.defenderGold < TOWER_TYPES[type].price);
        });
        document.querySelectorAll('.send-item').forEach(item => {
            const type = item.dataset.enemyType;
            if (type && PVP_CONFIG.SEND_COSTS[type]) item.classList.toggle('disabled', msg.attackerGold < PVP_CONFIG.SEND_COSTS[type]);
        });
    }

    _onPvPGameOver(msg) {
        if (this.pvpAnimFrame) cancelAnimationFrame(this.pvpAnimFrame);
        const isWinner = msg.winner === this.pvpRole;
        document.getElementById('result-title').textContent = isWinner ? '胜利！' : '失败！';
        document.getElementById('result-title').className = isWinner ? 'victory' : 'defeat';
        document.getElementById('result-stats').innerHTML = `<div>角色: <span>${this.pvpRole === 'defender' ? '防守方' : '进攻方'}</span></div><div>剩余生命: <span>${msg.stats.livesLeft}</span></div><div>防守金币: <span>${msg.stats.defenderGold}</span></div><div>进攻资源: <span>${msg.stats.attackerGold}</span></div>`;
        document.getElementById('result-overlay').classList.add('active');
    }

    _pvpRender(canvas, renderer, input, grid) {
        this.pvpSelectedTower = null;
        const ctx = canvas.getContext('2d');

        const loop = (timestamp) => {
            ctx.clearRect(0, 0, 800, 600);
            renderer._drawGrid();
            renderer._drawTowers(this.pvpTowers);
            renderer._drawEnemies(this.pvpEnemies);
            renderer._drawProjectiles(this.pvpProjectiles);
            renderer._drawParticles(this.pvpParticles);

            // Placement preview for defender
            if (this.pvpRole === 'defender' && this.pvpSelectedTower) {
                const towerDef = TOWER_TYPES[this.pvpSelectedTower];
                const gx = input.mouse.gridX, gy = input.mouse.gridY;
                // Temporarily set up occupants for canPlace check
                grid.occupants = {};
                for (const t of this.pvpTowers) grid.occupants[`${t.gridX},${t.gridY}`] = t;
                const canPlace = grid.canPlace(gx, gy, towerDef);
                ctx.fillStyle = canPlace ? 'rgba(78,204,163,0.3)' : 'rgba(233,69,96,0.3)';
                ctx.fillRect(gx * 20, gy * 20, 20, 20);
                if (towerDef.range > 0) {
                    ctx.beginPath();
                    ctx.arc(gx * 20 + 10, gy * 20 + 10, towerDef.range, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(78,204,163,0.2)';
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(78,204,163,0.5)';
                    ctx.lineWidth = 1;
                    ctx.setLineDash([4, 4]);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
            }

            // Handle defender click
            if (this.pvpRole === 'defender' && input.mouse.clicked && this.pvpSelectedTower) {
                const towerDef = TOWER_TYPES[this.pvpSelectedTower];
                // Get current gold from HUD text
                const goldText = document.getElementById('pvp-hud-defender-gold').textContent;
                const gold = parseInt(goldText.replace(/\D/g, '')) || 0;
                if (gold >= towerDef.price) {
                    this.network.send({ type: 'place_tower', towerType: this.pvpSelectedTower, x: input.mouse.gridX, y: input.mouse.gridY });
                }
            }

            input.clearFrame();
            this.pvpAnimFrame = requestAnimationFrame(loop);
        };
        this.pvpAnimFrame = requestAnimationFrame(loop);
    }

    _leavePvPLobby() {
        this.network.disconnect();
        this.network = null;
        this.pvpRole = null;
        this.pvpMapData = null;
        document.getElementById('room-id-display').style.display = 'none';
        document.getElementById('lobby-waiting').style.display = 'none';
        document.getElementById('join-status').textContent = '';
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
