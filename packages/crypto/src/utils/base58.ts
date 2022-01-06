import { base58 } from "bstring";
import moize from "fast-memoize";

import { HashAlgorithms } from "../crypto";

const encodeCheck = (buff: Buffer): string => {
    const checksum: Buffer = HashAlgorithms.hash256(buff);

    return base58.encode(Buffer.concat([buff, checksum], buff.length + 4));
};

const decodeCheck = (address: string): Buffer => {
    const buff: Buffer = base58.decode(address);
    const payload: Buffer = buff.slice(0, -4);
    const checksum: Buffer = HashAlgorithms.hash256(payload);

    if (checksum.readUInt32LE(0) !== buff.slice(-4).readUInt32LE(0)) {
        throw new Error("Invalid checksum");
    }

    return payload;
};

export const Base58 = {
    encodeCheck: moize(encodeCheck),
    decodeCheck: moize(decodeCheck),
};
