import { models } from "@arkecosystem/crypto";
import { handleOutput } from "../utils";

function verify(opts) {
  const { Block, Transaction } = models;

  const deserialized = opts.type === "transaction"
    ? new Transaction(opts.data)
    : new Block(Block.deserialize(opts.data));

  const output = opts.type === "transaction"
    ? deserialized.verify()
    : deserialized.verify().verified;

  return handleOutput(opts, output);
}

export { verify };
