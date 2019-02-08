import * as Joi from "joi";
import { ITransactionSchema } from "../models";
import { schemas } from "./schemas";

class JoiWrapper {
    private joi: any;
    private transactionSchemas = new Set<string>();

    constructor() {
        const extensions = Object.values(schemas);
        this.joi = Joi.extend(extensions);
    }

    public instance() {
        return this.joi;
    }

    public extendTransaction(schema: ITransactionSchema) {
        this.transactionSchemas.add(schema.name);

        this.joi = this.joi.extend(schema);
        this.updateTransactionArray();
    }

    private updateTransactionArray() {
        const transactionSchemas = [...this.transactionSchemas].map(schema => this.joi[schema]());

        const transactionArray = {
            name: "transactionArray",
            base: this.joi.array().items(this.joi.alternatives().try(transactionSchemas)),
        };

        this.joi = this.joi.extend(transactionArray).extend(schemas.block);
    }
}

export const joiWrapper = new JoiWrapper();
