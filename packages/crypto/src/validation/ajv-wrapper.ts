import Ajv from "ajv";
import ajvKeywords from "ajv-keywords";
import ajvMerge from "ajv-merge-patch";

import { ISchemaValidationResult } from "../models";
import { TransactionSchema } from "../transactions/types/schemas";
import { keywords } from "./keywords";
import { schemas } from "./schemas";

class AjvWrapper {
    private ajv: Ajv.Ajv;
    private transactionSchemas = new Set<string>();

    constructor() {
        const ajv = new Ajv({ $data: true, schemas, removeAdditional: true });
        ajvKeywords(ajv);
        ajvMerge(ajv);

        keywords.forEach(addKeyword => {
            addKeyword(ajv);
        });

        this.ajv = ajv;
    }

    public instance(): Ajv.Ajv {
        return this.ajv;
    }

    public extendTransaction(schema: TransactionSchema) {
        this.transactionSchemas.add(schema.$id);
        this.ajv.addSchema(schema);
        this.updateTransactionArray();
    }

    public validate<T = any>(schemaName: string, data: T): ISchemaValidationResult<T> {
        const valid = this.ajv.validate(schemaName, data);
        const error = this.ajv.errors !== null ? this.ajv.errorsText() : null;
        return { value: data, error };
    }

    private updateTransactionArray() {
        // const transactionSchemas = [...this.transactionSchemas].map(schema => this.joi[schema]());
        // const transactionArray = {
        //     name: "transactionArray",
        //     base: this.joi.array().items(this.joi.alternatives().try(transactionSchemas)),
        // };
        // this.joi = this.joi.extend(transactionArray).extend(schemas.block);
    }
}

export const ajvWrapper = new AjvWrapper();
