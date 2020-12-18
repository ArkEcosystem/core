import { NesMessage } from "./interfaces";

const mapTypeIntToString = {
    0: "hello",
    1: "ping",
    2: "update",
    3: "request",
    9: "undefined",
};
const mapTypeStringToInt = {
    "hello": 0,
    "ping": 1,
    "update": 2,
    "request": 3,
    "undefined": 9,
};

const HEADER_BYTE_LENGTH = 14;

const OFFSETS = {
    VERSION: 0,
    TYPE: 1,
    ID: 2,
    STATUS_CODE: 6,
    PATH_LENGTH: 8,
    SOCKET_LENGTH: 9,
    HEARTBEAT_INTERVAL: 10,
    HEARTBEAT_TIMEOUT: 12,
};

const MAX_PATH_LENGTH = 100;
const MAX_SOCKET_LENGTH = 100;

// Nes message format :
// <version><type><id><statusCode><pathLength><socketLength><heartbeat.interval><heartbeat.timeout><path><socket><payload>
// version              uint8
// type                 uint8
// id                   uint32
// statusCode           uint16
// pathLength           uint8
// path                 string
// socketLength         uint8
// socket               string
// heartbeat.interval   uint16
// heartbeat.timeout    uint16
// payload              Buffer
export const parseNesMessage = (buf: Buffer): NesMessage => {
    const messageLength = buf.byteLength;
    if (messageLength < HEADER_BYTE_LENGTH) {
        throw new Error("Nes message is below minimum length");
    }

    const version = buf.readUInt8(OFFSETS.VERSION).toString();

    const type = mapTypeIntToString[buf.readUInt8(OFFSETS.TYPE)];
    if (!type) {
        throw new Error("Type is invalid");
    }

    const id = buf.readUInt32BE(OFFSETS.ID);

    const statusCode = buf.readUInt16BE(OFFSETS.STATUS_CODE);

    const pathLength = buf.readUInt8(OFFSETS.PATH_LENGTH);
    if (pathLength > MAX_PATH_LENGTH || buf.byteLength < HEADER_BYTE_LENGTH + pathLength) {
        throw new Error("Invalid path length");
    }
    const path = buf.slice(HEADER_BYTE_LENGTH, HEADER_BYTE_LENGTH + pathLength).toString();

    const socketLength = buf.readUInt8(OFFSETS.SOCKET_LENGTH);
    if (socketLength > MAX_SOCKET_LENGTH || buf.byteLength < HEADER_BYTE_LENGTH + pathLength + socketLength) {
        throw new Error("Invalid socket length");
    }
    const socket = buf.slice(HEADER_BYTE_LENGTH + pathLength, HEADER_BYTE_LENGTH + pathLength + socketLength).toString();

    const heartbeat = {
        interval: buf.readUInt16BE(OFFSETS.HEARTBEAT_INTERVAL),
        timeout: buf.readUInt16BE(OFFSETS.HEARTBEAT_TIMEOUT),
    };

    const payload = buf.slice(HEADER_BYTE_LENGTH + pathLength + socketLength);

    return {
        version,
        type,
        id,
        statusCode,
        path,
        payload,
        socket,
        heartbeat
    };
};

export const stringifyNesMessage = (messageObj: NesMessage): Buffer => {
    const pathBuf = Buffer.from(messageObj.path || "");
    const socketBuf = Buffer.from(messageObj.socket || "");
    const payloadBuf = Buffer.from(messageObj.payload || "");

    const bufHeader = Buffer.alloc(HEADER_BYTE_LENGTH);

    bufHeader.writeUInt8(Number.parseInt(messageObj.version || "0"), OFFSETS.VERSION);
    bufHeader.writeUInt8(mapTypeStringToInt[messageObj.type ?? "undefined"] ?? mapTypeStringToInt["undefined"], OFFSETS.TYPE);
    bufHeader.writeUInt32BE(messageObj.id || 1, OFFSETS.ID);
    bufHeader.writeUInt16BE(messageObj.statusCode || 200, OFFSETS.STATUS_CODE);
    bufHeader.writeUInt8(pathBuf.byteLength, OFFSETS.PATH_LENGTH);
    bufHeader.writeUInt8(socketBuf.byteLength, OFFSETS.SOCKET_LENGTH);
    bufHeader.writeUInt16BE(messageObj.heartbeat?.interval || 0, OFFSETS.HEARTBEAT_INTERVAL);
    bufHeader.writeUInt16BE(messageObj.heartbeat?.timeout || 0, OFFSETS.HEARTBEAT_TIMEOUT);

    return Buffer.concat([bufHeader, pathBuf, socketBuf, payloadBuf]);
};

export const protocol = {
    gracefulErrorStatusCode: 499,   // custom status code to be used when we want to send back an explicit error (otherwise
                                    // no error is sent back and the socket is disconnected)
};