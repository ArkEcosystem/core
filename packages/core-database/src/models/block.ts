import { Contracts } from "@arkecosystem/core-kernel";
import { Utils } from "@arkecosystem/crypto";
import { Column, Entity, Index } from "typeorm";

import { transformBigInt } from "../utils/transform";

@Entity({
    name: "blocks",
})
@Index(["generatorPublicKey"])
export class Block implements Contracts.Database.BlockModel {
    @Column({
        primary: true,
        type: "varchar",
        length: 64,
    })
    public id!: string;

    @Column({
        type: "smallint",
    })
    public version!: number;

    @Column({
        type: "integer",
        nullable: false,
        unique: true,
    })
    public timestamp!: number;

    @Column({
        type: "varchar",
        unique: true,
        length: 64,
        default: undefined,
    })
    public previousBlock!: string;

    @Column({
        type: "integer",
        nullable: false,
        unique: true,
    })
    public height!: number;

    @Column({
        type: "integer",
        nullable: false,
    })
    public numberOfTransactions!: number;

    @Column({
        type: "bigint",
        nullable: false,
        transformer: transformBigInt,
    })
    public totalAmount!: Utils.BigNumber;

    @Column({
        type: "bigint",
        nullable: false,
        transformer: transformBigInt,
    })
    public totalFee!: Utils.BigNumber;

    @Column({
        type: "bigint",
        nullable: false,
        transformer: transformBigInt,
    })
    public reward!: Utils.BigNumber;

    @Column({
        type: "integer",
        nullable: false,
    })
    public payloadLength!: number;

    @Column({
        type: "varchar",
        length: 64,
        nullable: false,
    })
    public payloadHash!: string;

    @Column({
        type: "varchar",
        length: 66,
        nullable: false,
    })
    public generatorPublicKey!: string;

    @Column({
        type: "varchar",
        length: 256,
        nullable: false,
    })
    public blockSignature!: string;
}
