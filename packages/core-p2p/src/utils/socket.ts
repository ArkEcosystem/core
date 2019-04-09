import delay from "delay";
import { SCClientSocket } from "socketcluster-client";
import { SocketErrors } from "../enums";

export const socketEmit = async (
    host: string,
    socket: SCClientSocket,
    event: string,
    data: any,
    headers: Record<string, any>,
    timeout?: number,
) => {
    const req = {
        data: data || {},
        headers,
    };

    // if socket is not connected, we give it 2 seconds
    for (let i = 0; i < 20 && socket.getState() !== socket.OPEN; i++) {
        await delay(100);
    }

    if (socket.getState() !== socket.OPEN) {
        const error = new Error(`Peer ${host} socket is not connected. State: ${socket.getState()}`);
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
