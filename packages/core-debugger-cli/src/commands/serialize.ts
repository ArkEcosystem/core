import { models } from "@arkecosystem/crypto";
import { handleOutput } from "../utils";

function serialize(opts) {
    const { Block, Transaction } = models;

    const serialized: any  =
        opts.type === "transaction"
            ? Transaction.serialize(JSON.parse(opts.data))
            : Block[opts.full ? "serializeFull" : "serialize"](JSON.parse(opts.data));

    return handleOutput(opts, serialized.toString("hex"));
}

export { serialize };
