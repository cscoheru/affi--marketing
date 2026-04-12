// server/server.js - WebSocket game server entry point

import { WebSocketServer } from 'ws';
import http from 'http';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { GameRoom } from './game-room.js';
import { GameEngine } from './game-engine.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

const rooms = new Map();
const engines = new Map();
const clients = new Map();

const server = http.createServer((req, res) => {
    const projectRoot = join(__dirname, '..');
    let filePath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
    const fullPath = join(projectRoot, filePath);

    try {
        const content = readFileSync(fullPath);
        const ext = filePath.split('.').pop();
        const mimeTypes = { html: 'text/html', css: 'text/css', js: 'application/javascript', json: 'application/json', png: 'image/png', jpg: 'image/jpeg' };
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
        res.end(content);
    } catch (err) {
        res.writeHead(404);
        res.end('Not found');
    }
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });
    ws.on('message', (raw) => {
        let msg;
        try { msg = JSON.parse(raw); } catch { return; }
        handleMessage(ws, msg);
    });
    ws.on('close', () => { console.log('Client disconnected'); handleDisconnect(ws); });
});

function handleMessage(ws, msg) {
    switch (msg.type) {
        case 'create_room': {
            const room = new GameRoom(GameRoom.generateId(), msg.mapData, msg.difficulty);
            rooms.set(room.id, room);
            room.addPlayer(ws, 'defender');
            clients.set(ws, { roomId: room.id, role: 'defender' });
            room.sendTo('defender', { type: 'room_created', roomId: room.id });
            console.log(`Room ${room.id} created`);
            break;
        }
        case 'join_room': {
            const room = rooms.get(msg.roomId);
            if (!room) { ws.send(JSON.stringify({ type: 'error', message: '房间不存在' })); return; }
            if (room.hasAttacker()) { ws.send(JSON.stringify({ type: 'error', message: '房间已满' })); return; }
            room.addPlayer(ws, 'attacker');
            clients.set(ws, { roomId: room.id, role: 'attacker' });
            room.sendTo('attacker', { type: 'room_joined', roomId: room.id, role: 'attacker', mapData: room.mapData });
            room.sendTo('defender', { type: 'opponent_joined', role: 'attacker' });
            console.log(`Attacker joined room ${room.id}`);
            break;
        }
        case 'ready': {
            const { roomId, role } = clients.get(ws) || {};
            const room = rooms.get(roomId);
            if (!room) return;
            room.setReady(role);
            room.sendTo(room.getOpponentRole(role), { type: 'opponent_ready', role });
            if (room.canStart()) {
                const engine = new GameEngine(room);
                engines.set(roomId, engine);
                engine.start();
                console.log(`Room ${roomId} game started`);
            }
            break;
        }
        case 'place_tower':
        case 'send_enemy':
        case 'sell_tower':
        case 'upgrade_tower': {
            const { roomId } = clients.get(ws) || {};
            const engine = engines.get(roomId);
            if (engine) engine.handleAction(ws, msg);
            break;
        }
        case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
    }
}

function handleDisconnect(ws) {
    const clientInfo = clients.get(ws);
    if (!clientInfo) return;
    const { roomId, role } = clientInfo;
    const room = rooms.get(roomId);
    if (!room) return;

    room.sendTo(room.getOpponentRole(role), { type: 'opponent_disconnected', role });
    room.removePlayer(ws);
    clients.delete(ws);

    if (room.state === 'playing') {
        const engine = engines.get(roomId);
        if (engine) engine._endGame(room.getOpponentRole(role));
    }

    if (!room.hasDefender() && !room.hasAttacker()) {
        const engine = engines.get(roomId);
        if (engine) engine.stop();
        engines.delete(roomId);
        rooms.delete(roomId);
        room.destroy();
        console.log(`Room ${roomId} destroyed`);
    }
}

const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
        if (!ws.isAlive) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
    });
}, 30000);

wss.on('close', () => clearInterval(heartbeat));

server.listen(PORT, () => {
    console.log(`Tower Defense PvP Server running on port ${PORT}`);
});
