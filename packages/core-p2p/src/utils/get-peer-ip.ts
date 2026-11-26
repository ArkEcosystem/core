import { Socket } from "../hapi-nes/socket";

export const getPeerIp = (socket: Socket) => {
    return socket.info.remoteAddress;
};
