import { BigNumber } from "@arkecosystem/utils";
import { secp256k1 } from "bcrypto";
import { Hash160, Hash256, RIPEMD160, SHA1, SHA256 } from "bcrypto";
import { fromPrivateKey, fromSeed } from "bip32";
import { mnemonicToSeedSync } from "bip39";
import aes from "browserify-aes";
import { base58 } from "bstring";
import xor from "buffer-xor/inplace";
import crypto from "crypto";
import dayjs from "dayjs";
import wif from "wif";

import { Libraries } from "../interfaces/libraries";

export const libraryDefaults: Libraries = {
    scryptSync: crypto.scryptSync,
    dayjs,
    aes,
    xor,
    base58,
    wif,
    secp256k1,
    Hash160,
    Hash256,
    RIPEMD160,
    SHA1,
    SHA256,
    bip32: {
        fromPrivateKey,
        fromSeed,
    },
    bip39: {
        mnemonicToSeedSync,
    },
    BigNumber,
};
