import Ajv from "ajv";
import ajvKeywords from "ajv-keywords";

import { ISchemaValidationResult } from "../interfaces";
import { signedSchema, strictSchema, TransactionSchema } from "../transactions/types/schemas";
import { formats } from "./formats";
import { keywords } from "./keywords";
import { schemas } from "./schemas";

export class Validator {
    public static make(options: Record<string, any> = {}): Validator {
        return new Validator(options);
    }

    private ajv: Ajv.Ajv;
    private readonly transactionSchemas: Set<string> = new Set<string>();

    private constructor(options: Record<string, any>) {
        const ajv = new Ajv({
            ...{
                $data: true,
                schemas,
                removeAdditional: true,
                extendRefs: true,
            },
            ...options,
        });
        ajvKeywords(ajv);

        for (const addKeyword of keywords) {
            addKeyword(ajv);
        }

        for (const addFormat of formats) {
            addFormat(ajv);
        }

        this.ajv = ajv;
    }

    public getInstance(): Ajv.Ajv {
        return this.ajv;
    }

    public validate<T = any>(schemaKeyRef: string | boolean | object, data: T): ISchemaValidationResult<T> {
        try {
            this.ajv.validate(schemaKeyRef, data);

            const error = this.ajv.errors ? this.ajv.errorsText() : undefined;

            return { value: data, error, errors: this.ajv.errors };
        } catch (error) {
            return { value: undefined, error: error.stack, errors: [] };
        }
    }

    public addFormat(name: string, format: Ajv.FormatDefinition): void {
        this.ajv.addFormat(name, format);
    }

    public addKeyword(keyword: string, definition: Ajv.KeywordDefinition): void {
        this.ajv.addKeyword(keyword, definition);
    }

    public addSchema(schema: object | object[], key?: string): void {
        this.ajv.addSchema(schema, key);
    }

    public removeKeyword(keyword: string): void {
        this.ajv.removeKeyword(keyword);
    }

    public removeSchema(schemaKeyRef: string | boolean | object | RegExp): void {
        this.ajv.removeSchema(schemaKeyRef);
    }

    public extendTransaction(schema: TransactionSchema, remove?: boolean) {
        if (remove) {
            this.transactionSchemas.delete(schema.$id);

            this.ajv.removeSchema(schema.$id);
            this.ajv.removeSchema(`${schema.$id}Signed`);
            this.ajv.removeSchema(`${schema.$id}Strict`);
        } else {
            this.transactionSchemas.add(schema.$id);

            this.ajv.addSchema(schema);
            this.ajv.addSchema(signedSchema(schema));
            this.ajv.addSchema(strictSchema(schema));
        }

        this.updateTransactionArray();
    }

    private updateTransactionArray() {
        this.ajv.removeSchema("block");
        this.ajv.removeSchema("transactions");
        this.ajv.addSchema({
            $id: "transactions",
            type: "array",
            additionalItems: false,
            items: { oneOf: [...this.transactionSchemas].map(schema => ({ $ref: `${schema}Signed` })) },
        });
        this.ajv.addSchema(schemas.block);
    }
}

export const validator = Validator.make();
