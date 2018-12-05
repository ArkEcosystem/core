import { utils } from "@arkecosystem/crypto";
import Boom from "boom";
import Joi from "joi";
import { database } from "../../../services/database";

export const walletBIP38 = {
  name: "wallets.bip38.info",
  async method(params) {
    const wif = await database.get(
      utils.sha256(Buffer.from(params.userId)).toString("hex"),
    );

    return wif
      ? { wif }
      : Boom.notFound(`User ${params.userId} could not be found.`);
  },
  schema: {
    userId: Joi.string()
      .hex()
      .required(),
  },
};
