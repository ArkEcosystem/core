import { models } from "@arkecosystem/crypto";
import { handleOutput } from "../utils";

function verify(opts) {
    const { Block, Transaction } = models;

    const deserialized =
        opts.type === "transaction" ? new Transaction(opts.data) : new Block(Block.deserialize(opts.data));

    const result: any = deserialized.verify();
    const output = opts.type === "transaction" ? result : result.verified;

    return handleOutput(opts, output);
}

export { verify };
