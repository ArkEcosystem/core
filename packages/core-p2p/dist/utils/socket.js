"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const delay_1 = __importDefault(require("delay"));
const enums_1 = require("../enums");
exports.socketEmit = async (host, socket, event, data, headers, timeout) => {
    const req = {
        data: data || {},
        headers,
    };
    // if socket is not connected, we give it 2 seconds
    for (let i = 0; i < 20 && socket.getState() !== socket.OPEN; i++) {
        await delay_1.default(100);
    }
    if (socket.getState() !== socket.OPEN) {
        const error = new Error(`Peer ${host} socket is not connected. State: ${socket.getState()}`);
        error.name = enums_1.SocketErrors.SocketNotOpen;
        throw error;
    }
    const socketEmitPromise = new Promise((resolve, reject) => socket.emit(event, req, (err, val) => (err ? reject(err) : resolve(val))));
    let timeoutHandle;
    const timeoutPromiseFn = (_, reject) => {
        timeoutHandle = setTimeout(() => {
            clearTimeout(timeoutHandle);
            const error = new Error(`Socket emit "${event}" : timed out (${timeout}ms)`);
            error.name = enums_1.SocketErrors.Timeout;
            reject(error);
        }, timeout);
    };
    const response = await Promise.race(timeout ? [socketEmitPromise, new Promise(timeoutPromiseFn)] : [socketEmitPromise]);
    clearTimeout(timeoutHandle);
    return response;
};
//# sourceMappingURL=socket.js.map