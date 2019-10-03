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
    private readonly transactionSchemas: Map<string, TransactionSchema> = new Map<string, TransactionSchema>();

    private constructor(options: Record<string, any>) {
        this.ajv = this.instantiateAjv(options);
    }

    public getInstance(): Ajv.Ajv {
        return this.ajv;
    }

    public validate<T = any>(schemaKeyRef: string | boolean | object, data: T): ISchemaValidationResult<T> {
        return this.validateSchema(this.ajv, schemaKeyRef, data);
    }

    public validateException<T = any>(schemaKeyRef: string | boolean | object, data: T): ISchemaValidationResult<T> {
        const ajv = this.instantiateAjv({ allErrors: true });

        for (const schema of this.transactionSchemas.values()) {
            this.extendTransactionSchema(ajv, schema);
        }

        return this.validateSchema(ajv, schemaKeyRef, data);
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
        this.extendTransactionSchema(this.ajv, schema, remove);
    }

    private validateSchema<T = any>(
        ajv: Ajv.Ajv,
        schemaKeyRef: string | boolean | object,
        data: T,
    ): ISchemaValidationResult<T> {
        try {
            ajv.validate(schemaKeyRef, data);

            const error = ajv.errors ? ajv.errorsText() : undefined;

            return { value: data, error, errors: ajv.errors };
        } catch (error) {
            return { value: undefined, error: error.stack, errors: [] };
        }
    }

    private instantiateAjv(options: Record<string, any>) {
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

        return ajv;
    }

    private extendTransactionSchema(ajv: Ajv.Ajv, schema: TransactionSchema, remove?: boolean) {
        if (remove) {
            this.transactionSchemas.delete(schema.$id);

            ajv.removeSchema(schema.$id);
            ajv.removeSchema(`${schema.$id}Signed`);
            ajv.removeSchema(`${schema.$id}Strict`);
        } else {
            this.transactionSchemas.set(schema.$id, schema);

            ajv.addSchema(schema);
            ajv.addSchema(signedSchema(schema));
            ajv.addSchema(strictSchema(schema));
        }

        this.updateTransactionArray(ajv);
    }

    private updateTransactionArray(ajv: Ajv.Ajv) {
        ajv.removeSchema("block");
        ajv.removeSchema("transactions");
        ajv.addSchema({
            $id: "transactions",
            type: "array",
            additionalItems: false,
            items: { anyOf: [...this.transactionSchemas.keys()].map(schema => ({ $ref: `${schema}Signed` })) },
        });
        ajv.addSchema(schemas.block);
    }
}

export const validator = Validator.make();
