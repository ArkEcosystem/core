"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const model_1 = require("./model");
class Migration extends model_1.Model {
    constructor() {
        super(...arguments);
        this.columnsDescriptor = [
            {
                name: "name",
            },
        ];
    }
    getTable() {
        return "migrations";
    }
}
exports.Migration = Migration;
//# sourceMappingURL=migration.js.map