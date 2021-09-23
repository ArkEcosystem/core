import { IColumnDescriptor } from "../interfaces";
import { Model } from "./model";
export declare class Round extends Model {
    protected columnsDescriptor: IColumnDescriptor[];
    getTable(): string;
}
