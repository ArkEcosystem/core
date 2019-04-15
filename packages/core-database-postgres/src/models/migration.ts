import { ColumnDescriptor } from "../interfaces";
import { Model } from "./model";

export class Migration extends Model {
    protected columnsDescriptor: ColumnDescriptor[] = [
        {
            name: "name",
        },
    ];

    public getTable(): string {
        return "migrations";
    }
}
