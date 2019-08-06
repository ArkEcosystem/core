import { TransactionTypeGroup } from "../../enums";

export class InternalTransactionType {
    public static from(type: number, typeGroup?: number): InternalTransactionType {
        if (typeGroup === undefined) {
            typeGroup = TransactionTypeGroup.Core;
        }

        const compositeType: string = `${typeGroup}-${type}`;
        if (!this.types.has(compositeType)) {
            this.types.set(compositeType, new InternalTransactionType(type, typeGroup));
        }

        return this.types.get(compositeType);
    }

    private static types: Map<string, InternalTransactionType> = new Map();

    private compositeType: string;
    private constructor(public readonly type: number, public readonly typeGroup: number) {
        this.compositeType = `${typeGroup}-${type}`;
    }

    public toString(): string {
        return this.compositeType;
    }
}
