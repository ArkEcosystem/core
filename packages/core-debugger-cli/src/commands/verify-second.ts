import { crypto, models } from "@arkecosystem/crypto";
import { handleOutput } from "../utils";

function verifySecondSignature(opts) {
    const { Transaction } = models;

    const transaction = new Transaction(opts.data);
    const publicKey = opts.publicKey;

    const output = crypto.verifySecondSignature(transaction, publicKey);
    return handleOutput(opts, output);
}

export { verifySecondSignature };
