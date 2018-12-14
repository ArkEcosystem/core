import { models } from "@arkecosystem/crypto";
import { handleOutput } from "../utils";

function deserialize(opts) {
    const { Block, Transaction } = models;

    let deserialized;

    if (opts.type === "transaction") {
        deserialized = new Transaction(opts.data);
    } else {
        deserialized = new Block(opts.data);
    }

    return handleOutput(opts, JSON.stringify(deserialized, null, 4));
}

export { deserialize };
