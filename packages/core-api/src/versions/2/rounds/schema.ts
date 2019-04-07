import * as Joi from "joi";
import { blockId } from "../shared/schemas/block-id";
import { pagination } from "../shared/schemas/pagination";

export const delegates: object = {
    params: {
        id: Joi.number()
            .integer()
            .min(1),
    },
};
