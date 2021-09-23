"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.businessSchema = {
    name: {
        $ref: "genericName",
    },
    website: {
        $ref: "uri",
    },
    vat: {
        type: "string",
        minLength: 8,
        maxLength: 15,
        $ref: "alphanumeric",
    },
    repository: {
        $ref: "uri",
    },
};
//# sourceMappingURL=business-schema.js.map