import { Engine } from "../engine";

export const address = attributes => {
    const { error, value } = Engine.validate(attributes, Engine.joi.arkAddress());

    return {
        data: value,
        errors: error ? error.details : null,
        passes: !error,
        fails: error,
    };
};
