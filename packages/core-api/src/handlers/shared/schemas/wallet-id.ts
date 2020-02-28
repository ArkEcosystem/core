import Joi from "@hapi/joi";

import { address } from "./address";
import { publicKey } from "./public-key";
import { username } from "./username";

export const walletId = Joi.alternatives().try(username, address, publicKey);
