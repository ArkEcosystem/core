import Joi from "joi";
import { extensions } from "./extensions";

export class Validator {
    public static joi: any;

    public static init(): void {
        this.joi = Joi.extend(extensions);
    }

    public static validate(attributes, rules, options?) {
        try {
            return this.joi.validate(
                attributes,
                rules,
                Object.assign(
                    {
                        convert: true,
                    },
                    options,
                ),
            );
        } catch (error) {
            return { value: null, error: error.stack };
        }
    }
}

Validator.init();
