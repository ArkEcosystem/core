import { Utils } from "@arkecosystem/core-kernel";
import { SCClientSocket } from "socketcluster-client";

import { SocketErrors } from "../enums";

// todo: review the implementation
export const socketEmit = async (
    host: string,
    socket: SCClientSocket,
    event: string,
    data: any,
    headers: Record<string, any>,
    timeout?: number,
): Promise<any> => {
    const req = {
        data: data || {},
        headers,
    };

    // if socket is not connected, we give it 2 seconds
    for (let i = 0; i < 20 && socket.getState() !== socket.OPEN; i++) {
        await Utils.sleep(100);
    }

    if (socket.getState() !== socket.OPEN) {
        const error = new Error(`Peer ${host} socket is not connected. State: ${socket.getState()}`);
        error.name = SocketErrors.SocketNotOpen;
        throw error;
    }

    const socketEmitPromise = new Promise((resolve, reject) =>
        socket.emit(event, req, (err, val) => (err ? reject(err) : resolve(val))),
    );

    let timeoutHandle: NodeJS.Timeout | undefined = undefined;
    const timeoutPromiseFn = (_, reject) => {
        timeoutHandle = setTimeout(() => {
            clearTimeout(timeoutHandle!);
            const error = new Error(`Socket emit "${event}" : timed out (${timeout}ms)`);
            error.name = SocketErrors.Timeout;

            reject(error);
        }, timeout || 0);
    };

    const response = await Promise.race(
        timeout ? [socketEmitPromise, new Promise(timeoutPromiseFn)] : [socketEmitPromise],
    );

    if (timeoutHandle !== undefined) {
        clearTimeout(timeoutHandle);
    }

    return response;
};
