import { Engine } from "../engine";

export const username = attributes => {
    const { error, value } = Engine.validate(attributes, Engine.joi.delegateUsername());

    return {
        data: value,
        errors: error ? error.details : null,
        passes: !error,
        fails: error,
    };
};
