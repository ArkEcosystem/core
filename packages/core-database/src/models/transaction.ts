import { Contracts } from "@arkecosystem/core-kernel";
import { Utils } from "@arkecosystem/crypto";
import { Column, Entity, Index } from "typeorm";

import { transformBigInt, transformVendorField } from "../utils/transform";

// TODO: Fix model to have undefined type on nullable fields
@Entity({
    name: "transactions",
})
@Index(["type"])
@Index(["blockId"])
@Index(["senderPublicKey"])
@Index(["recipientId"])
@Index(["timestamp"])
export class Transaction implements Contracts.Database.TransactionModel {
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
        type: "integer",
        nullable: false,
    })
    public blockHeight!: number;

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
    public nonce!: Utils.BigNumber;

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
    public amount!: Utils.BigNumber;

    @Column({
        type: "bigint",
        transformer: transformBigInt,
        nullable: false,
    })
    public fee!: Utils.BigNumber;

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
