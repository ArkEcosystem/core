import Ajv from "ajv";
import { ISchemaValidationResult } from "../interfaces";
import { TransactionSchema } from "../transactions/types/schemas";
export declare class Validator {
    static make(options?: Record<string, any>): Validator;
    private ajv;
    private readonly transactionSchemas;
    private constructor();
    getInstance(): Ajv.Ajv;
    validate<T = any>(schemaKeyRef: string | boolean | object, data: T): ISchemaValidationResult<T>;
    validateException<T = any>(schemaKeyRef: string | boolean | object, data: T): ISchemaValidationResult<T>;
    addFormat(name: string, format: Ajv.FormatDefinition): void;
    addKeyword(keyword: string, definition: Ajv.KeywordDefinition): void;
    addSchema(schema: object | object[], key?: string): void;
    removeKeyword(keyword: string): void;
    removeSchema(schemaKeyRef: string | boolean | object | RegExp): void;
    extendTransaction(schema: TransactionSchema, remove?: boolean): void;
    private validateSchema;
    private instantiateAjv;
    private extendTransactionSchema;
    private updateTransactionArray;
}
export declare const validator: Validator;
