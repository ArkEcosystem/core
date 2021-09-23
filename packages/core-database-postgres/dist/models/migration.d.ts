import { IColumnDescriptor } from "../interfaces";
import { Model } from "./model";
export declare class Migration extends Model {
    protected columnsDescriptor: IColumnDescriptor[];
    getTable(): string;
}
