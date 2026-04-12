// js/network.js - Client-side WebSocket connection manager

export class NetworkClient {
    constructor() {
        this.ws = null;
        this.handlers = {};
        this.connected = false;
        this.heartbeatInterval = null;
    }

    connect(url) {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(url);
            this.ws.onopen = () => {
                this.connected = true;
                this._startHeartbeat();
                resolve();
            };
            this.ws.onclose = () => {
                this.connected = false;
                this._stopHeartbeat();
                this._emit('disconnected');
            };
            this.ws.onerror = (err) => reject(err);
            this.ws.onmessage = (event) => {
                let msg;
                try { msg = JSON.parse(event.data); } catch { return; }
                this._emit(msg.type, msg);
            };
        });
    }

    send(msg) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(msg));
        }
    }

    on(type, handler) {
        if (!this.handlers[type]) this.handlers[type] = [];
        this.handlers[type].push(handler);
    }

    off(type, handler) {
        if (!this.handlers[type]) return;
        this.handlers[type] = this.handlers[type].filter(h => h !== handler);
    }

    _emit(type, data) {
        (this.handlers[type] || []).forEach(h => h(data));
        (this.handlers['*'] || []).forEach(h => h(type, data));
    }

    _startHeartbeat() {
        this.heartbeatInterval = setInterval(() => this.send({ type: 'ping' }), 15000);
    }

    _stopHeartbeat() {
        if (this.heartbeatInterval) { clearInterval(this.heartbeatInterval); this.heartbeatInterval = null; }
    }

    disconnect() {
        this._stopHeartbeat();
        if (this.ws) { this.ws.close(); this.ws = null; }
        this.connected = false;
    }
}
