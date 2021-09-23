"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ajv_1 = __importDefault(require("ajv"));
const ajv_keywords_1 = __importDefault(require("ajv-keywords"));
const schemas_1 = require("../transactions/types/schemas");
const formats_1 = require("./formats");
const keywords_1 = require("./keywords");
const schemas_2 = require("./schemas");
class Validator {
    constructor(options) {
        this.transactionSchemas = new Map();
        this.ajv = this.instantiateAjv(options);
    }
    static make(options = {}) {
        return new Validator(options);
    }
    getInstance() {
        return this.ajv;
    }
    validate(schemaKeyRef, data) {
        return this.validateSchema(this.ajv, schemaKeyRef, data);
    }
    validateException(schemaKeyRef, data) {
        const ajv = this.instantiateAjv({ allErrors: true, verbose: true });
        for (const schema of this.transactionSchemas.values()) {
            this.extendTransactionSchema(ajv, schema);
        }
        return this.validateSchema(ajv, schemaKeyRef, data);
    }
    addFormat(name, format) {
        this.ajv.addFormat(name, format);
    }
    addKeyword(keyword, definition) {
        this.ajv.addKeyword(keyword, definition);
    }
    addSchema(schema, key) {
        this.ajv.addSchema(schema, key);
    }
    removeKeyword(keyword) {
        this.ajv.removeKeyword(keyword);
    }
    removeSchema(schemaKeyRef) {
        this.ajv.removeSchema(schemaKeyRef);
    }
    extendTransaction(schema, remove) {
        this.extendTransactionSchema(this.ajv, schema, remove);
    }
    validateSchema(ajv, schemaKeyRef, data) {
        try {
            ajv.validate(schemaKeyRef, data);
            const error = ajv.errors ? ajv.errorsText() : undefined;
            return { value: data, error, errors: ajv.errors };
        }
        catch (error) {
            return { value: undefined, error: error.stack, errors: [] };
        }
    }
    instantiateAjv(options) {
        const ajv = new ajv_1.default({
            ...{
                $data: true,
                schemas: schemas_2.schemas,
                removeAdditional: true,
                extendRefs: true,
            },
            ...options,
        });
        ajv_keywords_1.default(ajv);
        for (const addKeyword of keywords_1.keywords) {
            addKeyword(ajv);
        }
        for (const addFormat of formats_1.formats) {
            addFormat(ajv);
        }
        return ajv;
    }
    extendTransactionSchema(ajv, schema, remove) {
        if (remove) {
            this.transactionSchemas.delete(schema.$id);
            ajv.removeSchema(schema.$id);
            ajv.removeSchema(`${schema.$id}Signed`);
            ajv.removeSchema(`${schema.$id}Strict`);
        }
        else {
            this.transactionSchemas.set(schema.$id, schema);
            ajv.addSchema(schema);
            ajv.addSchema(schemas_1.signedSchema(schema));
            ajv.addSchema(schemas_1.strictSchema(schema));
        }
        this.updateTransactionArray(ajv);
    }
    updateTransactionArray(ajv) {
        ajv.removeSchema("block");
        ajv.removeSchema("transactions");
        ajv.addSchema({
            $id: "transactions",
            type: "array",
            additionalItems: false,
            items: { anyOf: [...this.transactionSchemas.keys()].map(schema => ({ $ref: `${schema}Signed` })) },
        });
        ajv.addSchema(schemas_2.schemas.block);
    }
}
exports.Validator = Validator;
exports.validator = Validator.make();
//# sourceMappingURL=index.js.map