import { CryptoManager } from "@arkecosystem/crypto";
import { Ajv } from "ajv";

import { IBlockData } from "../interfaces";

const vendorField = (ajv: Ajv, cryptoManager: CryptoManager<IBlockData>) => {
    ajv.addFormat("vendorField", (data) => {
        try {
            return Buffer.from(data, "utf8").length <= cryptoManager.LibraryManager.Utils.maxVendorFieldLength();
        } catch {
            return false;
        }
    });
};

const validPeer = (ajv: Ajv, cryptoManager: CryptoManager<IBlockData>) => {
    ajv.addFormat("peer", (ip: string) => {
        try {
            return cryptoManager.LibraryManager.Utils.isValidPeer({ ip }, false);
        } catch {
            return false;
        }
    });
};

export const formats = [vendorField, validPeer];
