import { BigNumber } from "@arkecosystem/utils";
import { Column, Entity, Index } from "typeorm";

import { transformBigInt, transformVendorField } from "./utils";

@Entity({
    name: "transactions",
})
@Index(["type"])
@Index(["blockId"])
@Index(["senderPublicKey"])
@Index(["recipientId"])
@Index(["timestamp"])
export class Transaction {
    @Column({
        primary: true,
        type: "varchar",
        length: 64,
    })
    public id!: string;

    @Column({
        type: "smallint",
        nullable: false,
    })
    public version!: number;

    @Column({
        type: "varchar",
        length: 64,
        nullable: false,
    })
    public blockId!: string;

    @Column({
        type: "smallint",
        nullable: false,
    })
    public sequence!: number;

    @Column({
        type: "integer",
        nullable: false,
    })
    public timestamp!: number;

    @Column({
        type: "bigint",
        transformer: transformBigInt,
        default: undefined,
    })
    public nonce!: BigNumber;

    @Column({
        type: "varchar",
        length: 66,
        nullable: false,
    })
    public senderPublicKey!: string;

    @Column({
        default: undefined,
    })
    public recipientId!: string;

    @Column({
        type: "smallint",
        nullable: false,
    })
    public type!: number;

    @Column({
        type: "integer",
        nullable: false,
        default: 1,
    })
    public typeGroup!: number;

    @Column({
        type: "bytea",
        default: undefined,
        transformer: transformVendorField,
    })
    public vendorField: string | undefined;

    @Column({
        type: "bigint",
        transformer: transformBigInt,
        nullable: false,
    })
    public amount!: BigInt;

    @Column({
        type: "bigint",
        transformer: transformBigInt,
        nullable: false,
    })
    public fee!: BigInt;

    @Column({
        type: "bytea",
        nullable: false,
    })
    public serialized!: Buffer;

    @Column({
        type: "jsonb",
    })
    public asset!: Record<string, any>;
}
