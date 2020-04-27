import { Contracts } from "@arkecosystem/core-kernel";
import { Utils } from "@arkecosystem/crypto";
import { Connection, getCustomRepository } from "typeorm";

import { clearCoreDatabase, getCoreDatabaseConnection } from "../__support__";
import { RoundRepository } from "../../../../packages/core-database/src/repositories/round-repository";

class DelegateWalletMock {
    public readonly publicKey: string;

    private readonly round: number;
    private readonly voteBalance: Utils.BigNumber;

    public constructor(publicKey: string, round: number, voteBalance: Utils.BigNumber) {
        this.publicKey = publicKey;
        this.round = round;
        this.voteBalance = voteBalance;
    }

    public getAttribute(key: string) {
        switch (key) {
            case "delegate.round":
                return this.round;
            case "delegate.voteBalance":
                return this.voteBalance;
            default:
                throw new Error(`Unknown attribute ${key}`);
        }
    }
}

let connection: Connection | undefined;

beforeAll(async () => {
    connection = await getCoreDatabaseConnection();
});

beforeEach(async () => {
    await clearCoreDatabase(connection);
});

describe("RoundRepository.findById", () => {
    it("should return delegate vote balances by round", async () => {
        const roundRepository = getCustomRepository(RoundRepository);
        await roundRepository.save(([
            new DelegateWalletMock("delegate1 public key", 1, Utils.BigNumber.make("100")),
            new DelegateWalletMock("delegate2 public key", 1, Utils.BigNumber.make("200")),
        ] as unknown) as Contracts.State.Wallet[]);

        const round1Delegates = await roundRepository.findById("1");

        expect(round1Delegates.length).toBe(2);
        expect(round1Delegates).toMatchObject([
            {
                round: Utils.BigNumber.make("1"),
                publicKey: "delegate1 public key",
                balance: Utils.BigNumber.make("100"),
            },
            {
                round: Utils.BigNumber.make("1"),
                publicKey: "delegate2 public key",
                balance: Utils.BigNumber.make("200"),
            },
        ]);
    });
});
