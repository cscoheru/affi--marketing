// server/game-room.js - Manages a PvP game room with two players

const ROOM_ID_LENGTH = 6;

export class GameRoom {
    static usedIds = new Set();

    static generateId() {
        let id;
        do {
            id = Math.random().toString(36).substring(2, 2 + ROOM_ID_LENGTH).toUpperCase();
        } while (GameRoom.usedIds.has(id));
        GameRoom.usedIds.add(id);
        return id;
    }

    constructor(id, mapData, difficulty) {
        this.id = id;
        this.mapData = mapData;
        this.difficulty = difficulty;
        this.defender = null;
        this.attacker = null;
        this.defenderReady = false;
        this.attackerReady = false;
        this.state = 'waiting';
        this.createdAt = Date.now();
    }

    hasDefender() { return this.defender !== null; }
    hasAttacker() { return this.attacker !== null; }
    isFull() { return this.defender !== null && this.attacker !== null; }

    addPlayer(ws, role) {
        if (role === 'defender') {
            this.defender = ws;
            this.defender.roomRole = 'defender';
        } else {
            this.attacker = ws;
            this.attacker.roomRole = 'attacker';
        }
    }

    setReady(role) {
        if (role === 'defender') this.defenderReady = true;
        else this.attackerReady = true;
    }

    canStart() {
        return this.isFull() && this.defenderReady && this.attackerReady;
    }

    broadcast(message) {
        const data = JSON.stringify(message);
        if (this.defender && this.defender.readyState === 1) this.defender.send(data);
        if (this.attacker && this.attacker.readyState === 1) this.attacker.send(data);
    }

    sendTo(role, message) {
        const ws = role === 'defender' ? this.defender : this.attacker;
        if (ws && ws.readyState === 1) ws.send(JSON.stringify(message));
    }

    getOpponentRole(role) {
        return role === 'defender' ? 'attacker' : 'defender';
    }

    removePlayer(ws) {
        if (this.defender === ws) this.defender = null;
        if (this.attacker === ws) this.attacker = null;
    }

    destroy() {
        GameRoom.usedIds.delete(this.id);
        this.defender = null;
        this.attacker = null;
    }
}
