import { JoiWrapper } from "@arkecosystem/crypto";

/**
 * @type {Object}
 */
export const store = {
    payload: {
        block: JoiWrapper.instance()
            .block()
            .options({ stripUnknown: true }),
    },
};
