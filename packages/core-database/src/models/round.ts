import { BigNumber } from "@arkecosystem/utils";
import { Column, Entity } from "typeorm";

import { transformBigInt } from "./utils";

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
    public round!: BigNumber;

    @Column({
        type: "bigint",
        transformer: transformBigInt,
        nullable: false,
    })
    public balance!: BigNumber;
}
