"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProperty = (item, prop) => {
    for (const [key, value] of Object.entries(item)) {
        if (key === prop) {
            return value;
        }
        if (value && value.constructor.name === "Object") {
            const result = exports.getProperty(value, prop);
            if (result !== undefined) {
                return result;
            }
        }
    }
    return undefined;
};
//# sourceMappingURL=get-property.js.map