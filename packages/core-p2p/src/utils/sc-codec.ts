import msgpack from "msgpack-lite";

const options = {
    codec: msgpack.createCodec({
        uint8array: true,
        preset: false,
    }),
};

const compressPublishPacket = object => {
    if (object.event !== "#publish" || !object.data) {
        return;
    }

    const pubArray = [object.data.channel, object.data.data];

    if (object.cid) {
        pubArray.push(object.cid);
    }

    object.p = pubArray;

    delete object.event;
    delete object.data;
    delete object.cid;
};

const decompressPublishPacket = object => {
    if (!object.p) {
        return;
    }

    object.event = "#publish";
    object.data = {
        channel: object.p[0],
        data: object.p[1],
    };
    if (object.p[2]) {
        object.cid = object.p[2];
    }
    delete object.p;
};

const compressEmitPacket = object => {
    if (!object.event) {
        return;
    }

    object.e = [object.event, object.data];
    if (object.cid) {
        object.e.push(object.cid);
    }
    delete object.event;
    delete object.data;
    delete object.cid;
};

const decompressEmitPacket = object => {
    if (!object.e) {
        return;
    }

    object.event = object.e[0];
    object.data = object.e[1];
    if (object.e[2]) {
        object.cid = object.e[2];
    }
    delete object.e;
};

const compressResponsePacket = object => {
    if (!object.rid) {
        return;
    }

    object.r = [object.rid, object.error, object.data];

    delete object.rid;
    delete object.error;
    delete object.data;
};

const decompressResponsePacket = object => {
    if (!object.r) {
        return;
    }

    object.rid = object.r[0];
    object.error = object.r[1];
    object.data = object.r[2];
    delete object.r;
};

const clonePacket = object => {
    const clone = {};
    for (const i in object) {
        if (object.hasOwnProperty(i)) {
            clone[i] = object[i];
        }
    }
    return clone;
};

const compressSinglePacket = object => {
    object = clonePacket(object);
    compressPublishPacket(object);
    compressEmitPacket(object);
    compressResponsePacket(object);
    return object;
};

const decompressSinglePacket = object => {
    decompressEmitPacket(object);
    decompressPublishPacket(object);
    decompressResponsePacket(object);
};

export const encode = object => {
    if (object) {
        if (Array.isArray(object)) {
            for (let i = 0; i < object.length; i++) {
                object[i] = compressSinglePacket(object[i]);
            }
        } else if (object.event || object.rid) {
            object = compressSinglePacket(object);
        }
    }
    return msgpack.encode(object, options);
};

export const decode = str => {
    str = new Uint8Array(str);
    const object = msgpack.decode(str, options);
    if (Array.isArray(object)) {
        for (const packet of object) {
            decompressSinglePacket(packet);
        }
    } else {
        decompressSinglePacket(object);
    }
    return object;
};

export const codec = { encode, decode };
