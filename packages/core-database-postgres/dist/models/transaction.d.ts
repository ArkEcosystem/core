import { IColumnDescriptor } from "../interfaces";
import { Model } from "./model";
export declare class Transaction extends Model {
    protected columnsDescriptor: IColumnDescriptor[];
    getTable(): string;
}
