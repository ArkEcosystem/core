import { IColumnDescriptor } from "../interfaces";
import { Model } from "./model";
export declare class Block extends Model {
    protected columnsDescriptor: IColumnDescriptor[];
    getTable(): string;
}
