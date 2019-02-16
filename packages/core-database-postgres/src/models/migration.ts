import { Database } from "@arkecosystem/core-interfaces";
import { Model } from "./model";

export class Migration extends Model {
    /**
     * The table associated with the model.
     * @return {String}
     */
    public getTable() {
        return "migrations";
    }

    /**
     * The read-only structure with query-formatting columns.
     * @return {Object}
     */
    public getColumnSet() {
        return this.createColumnSet([
            {
                name: "name",
            },
        ]);
    }

    public getName(): string {
        return "Migration";
    }

    public getSearchableFields(): Database.SearchableField[] {
        return [];
    }
}
