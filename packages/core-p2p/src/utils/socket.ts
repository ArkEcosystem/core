import delay from "delay";
import { SocketErrors } from "../enums";

export const socketEmit = async (socket: any, event: string, data: any, headers: any, timeout?: number) => {
    const req = {
        data: data || {},
        headers,
    };

    // if socket is not connected, we give it 1 second
    for (let i = 0; i < 10 && socket.getState() !== socket.OPEN; i++) {
        await delay(100);
    }
    if (socket.getState() !== socket.OPEN) {
        const error = new Error(`Peer ${this.ip} socket is not connected. State: ${socket.getState()}`);
        error.name = SocketErrors.SocketNotOpen;
        throw error;
    }

    const socketEmitPromise = new Promise((resolve, reject) => {
        socket.emit(event, req, (err, val) => (err ? reject(err) : resolve(val)));
    });
    const timeoutPromiseFn = (resolve, reject) => {
        const id = setTimeout(() => {
            clearTimeout(id);
            const timeoutError = new Error(`Socket emit "${event}" : timed out (${timeout}ms)`);
            timeoutError.name = SocketErrors.Timeout;
            reject(timeoutError);
        }, timeout);
    };
    const allPromises = timeout ? [socketEmitPromise, new Promise(timeoutPromiseFn)] : [socketEmitPromise];

    return Promise.race(allPromises);
};
