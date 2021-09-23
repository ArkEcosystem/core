"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sql_1 = __importDefault(require("sql"));
class Model {
    constructor(pgp) {
        this.pgp = pgp;
    }
    getColumnSet() {
        if (!this.columnSet) {
            this.columnSet = this.createColumnSet(this.columnsDescriptor.map(col => {
                const colDef = {
                    name: col.name,
                };
                for (const prop of ["prop", "init", "def"]) {
                    if (col.hasOwnProperty(prop)) {
                        colDef[prop] = col[prop];
                    }
                }
                return colDef;
            }));
        }
        return this.columnSet;
    }
    getSearchableFields() {
        return this.columnsDescriptor.map(col => ({
            fieldName: col.prop || col.name,
            supportedOperators: col.supportedOperators,
        }));
    }
    getName() {
        return this.constructor.name;
    }
    query() {
        const { columns } = this.getColumnSet();
        return sql_1.default.define({
            name: this.getTable(),
            schema: "public",
            // @ts-ignore
            columns: columns.map(column => ({
                name: column.name,
                prop: column.prop || column.name,
            })),
        });
    }
    createColumnSet(columns) {
        return new this.pgp.helpers.ColumnSet(columns, {
            table: {
                table: this.getTable(),
                schema: "public",
            },
        });
    }
}
exports.Model = Model;
//# sourceMappingURL=model.js.map