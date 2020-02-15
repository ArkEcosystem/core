// copied from https://github.com/SocketCluster/sc-formatter
// with change

const base64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const validJSONStartRegex = /^[ \n\r\t]*[{\[]/;

const arrayBufferToBase64 = arraybuffer => {
    const bytes = new Uint8Array(arraybuffer);
    const len = bytes.length;
    let base64 = "";

    for (let i = 0; i < len; i += 3) {
        base64 += base64Chars[bytes[i] >> 2]; // tslint:disable-line
        base64 += base64Chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)]; // tslint:disable-line
        base64 += base64Chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)]; // tslint:disable-line
        base64 += base64Chars[bytes[i + 2] & 63]; // tslint:disable-line
    }

    if (len % 3 === 2) {
        base64 = base64.substring(0, base64.length - 1) + "=";
    } else if (len % 3 === 1) {
        base64 = base64.substring(0, base64.length - 2) + "==";
    }

    return base64;
};

const binaryToBase64Replacer = (key, value) => {
    if (value instanceof ArrayBuffer) {
        return {
            base64: true,
            data: arrayBufferToBase64(value),
        };
    } else if (value instanceof Buffer) {
        return {
            base64: true,
            data: value.toString("base64"),
        };
    } else if (value && value.type === "Buffer" && Array.isArray(value.data)) {
        // Some versions of Node.js convert Buffers to Objects before they are passed to
        // the replacer function - Because of this, we need to rehydrate Buffers
        // before we can convert them to base64 strings.
        let rehydratedBuffer;
        if (Buffer.from) {
            rehydratedBuffer = Buffer.from(value.data);
        } else {
            rehydratedBuffer = new Buffer(value.data);
        }
        return {
            base64: true,
            data: rehydratedBuffer.toString("base64"),
        };
    }

    return value;
};

const base64ToBinaryReplacer = (key, value) =>
    value && typeof value === "object" && value.base64 === true && typeof value.data === "string"
        ? Buffer.from(value.data, "base64")
        : value;

// Decode the data which was transmitted over the wire to a JavaScript Object in a format which SC understands.
// See encode function below for more details.
export const decode = input => {
    if (!input) {
        return undefined;
    }
    // Leave ping or pong message as is
    if (input === "#1" || input === "#2") {
        return input;
    }
    const message = input.toString();

    // Performance optimization to detect invalid JSON packet sooner.
    if (!validJSONStartRegex.test(message)) {
        return message;
    }

    try {
        return JSON.parse(message, base64ToBinaryReplacer);
    } catch (err) {} // tslint:disable-line

    return message;
};

export const encode = object => {
    // Leave ping or pong message as is
    if (object === "#1" || object === "#2") {
        return object;
    }
    return JSON.stringify(object, binaryToBase64Replacer);
};

export const codec = { encode, decode };
