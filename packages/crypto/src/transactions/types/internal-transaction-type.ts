import { TransactionTypeGroup } from "../../enums";

export class InternalTransactionType {
    public static from(type: number, typeGroup?: number): InternalTransactionType {
        if (typeGroup === undefined) {
            typeGroup = TransactionTypeGroup.Core;
        }

        const compositeType = `${typeGroup}-${type}`;
        if (!this.types.has(compositeType)) {
            this.types.set(compositeType, new InternalTransactionType(type, typeGroup));
        }

        return this.types.get(compositeType);
    }

    private static types: Map<string, InternalTransactionType> = new Map();

    private constructor(public readonly type: number, public readonly typeGroup: number) {}

    public toString(): string {
        if (this.typeGroup === TransactionTypeGroup.Core) {
            return `Core/${this.type}`;
        }

        return `${this.typeGroup}/${this.type}`;
    }
}
