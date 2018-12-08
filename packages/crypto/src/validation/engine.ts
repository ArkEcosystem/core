import Joi from "joi";
import extensions from "./extensions";

export class Engine {
  public joi: any;

  constructor() {
    this.joi = Joi.extend(extensions);
  }

  public validate(attributes, rules, options?) {
    try {
      return this.joi.validate(
        attributes,
        rules,
        Object.assign(
          {
            convert: true
          },
          options
        )
      );
    } catch (error) {
      return { value: null, error: error.stack };
    }
  }
}

export default new Engine();
