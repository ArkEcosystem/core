import { AjvWrapper } from ".";

export class Validator {
    public static validate(data, schema, options?) {
        try {
            return AjvWrapper.instance().validate(data, schema);
        } catch (error) {
            return { value: null, error: error.stack };
        }
    }
}
