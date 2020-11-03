import { Socket } from "../hapi-nes/socket";

export const getPeerIp = (socket: Socket) => {
    return socket.info["x-forwarded-for"]?.split(",")[0]?.trim() ?? socket.info.remoteAddress;
};
