import { Utils } from "@arkecosystem/crypto";
import { Column, Entity } from "typeorm";

import { transformBigInt } from "../utils/transform";

@Entity({
    name: "rounds",
})
export class Round {
    @Column({
        primary: true,
        type: "varchar",
        length: 66,
        nullable: false,
    })
    public publicKey!: string;

    @Column({
        primary: true,
        type: "bigint",
        transformer: transformBigInt,
        nullable: false,
    })
    public round!: Utils.BigNumber;

    @Column({
        type: "bigint",
        transformer: transformBigInt,
        nullable: false,
    })
    public balance!: Utils.BigNumber;
}
