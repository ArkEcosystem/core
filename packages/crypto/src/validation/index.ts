export { transactionValidator } from "./validators/transaction";

import { Validator } from "./validator";

export const Joi = Validator.joi;

// TODO: deduplicate the joi mess
import { schemas } from "./extensions";
export const joi = Joi.extend(Object.values(schemas));
