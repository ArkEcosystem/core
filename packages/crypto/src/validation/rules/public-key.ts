import { Engine } from "../engine";

export const publicKey = attributes => {
    const { error, value } = Engine.validate(attributes, Engine.joi.arkPublicKey());

    return {
        data: value,
        errors: error ? error.details : null,
        passes: !error,
        fails: error,
    };
};
