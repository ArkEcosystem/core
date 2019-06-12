import { IColumnDescriptor } from "../interfaces";
import { Model } from "./model";

export class Migration extends Model {
    protected columnsDescriptor: IColumnDescriptor[] = [
        {
            name: "name",
        },
    ];

    public getTable(): string {
        return "migrations";
    }
}
