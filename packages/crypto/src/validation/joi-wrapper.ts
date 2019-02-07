import * as Joi from "joi";
import { ITransactionSchema } from "../models";
import { schemas } from "./schemas";

class JoiWrapper {
    private joi: any;
    private transactionSchemas = new Set<ITransactionSchema>();

    constructor() {
        const extensions = Object.values(schemas);
        this.joi = Joi.extend(extensions);
    }

    public instance() {
        return this.joi;
    }

    public extendTransaction(schema: ITransactionSchema) {
        this.transactionSchemas.add(schema);

        this.joi = this.joi.extend(schema);
        this.updateTransactionArray();
    }

    private updateTransactionArray() {
        const transactionArray = {
            name: "transactionArray",
            base: this.joi.array().items(this.joi.alternatives().try(this.transactionSchemas)),
        };

        this.joi = this.joi.extend(transactionArray);
    }
}

export const joiWrapper = new JoiWrapper();
