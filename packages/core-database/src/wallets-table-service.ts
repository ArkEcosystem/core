import { Contracts, Container } from "@arkecosystem/core-kernel";
import { Connection } from "typeorm";

@Container.injectable()
export class WalletsTableService implements Contracts.Database.WalletsTableService {
    @Container.inject(Container.Identifiers.DatabaseConnection)
    private readonly connection!: Connection;

    public async flush(): Promise<void> {
        const queryRunner = this.connection.createQueryRunner();

        try {
            await queryRunner.startTransaction("SERIALIZABLE");

            try {
                await queryRunner.query(`TRUNCATE TABLE wallets`);
                await queryRunner.commitTransaction();
            } catch (error) {
                await queryRunner.rollbackTransaction();
                throw error;
            }
        } finally {
            await queryRunner.release();
        }
    }

    public async sync(wallets: readonly Contracts.State.Wallet[]): Promise<void> {
        // 30000 parameters per query / 5 params per wallet (address, publicKey, balance, nonce, attributes)
        const batchSize = 6000;

        const queryRunner = this.connection.createQueryRunner();

        try {
            await queryRunner.startTransaction("SERIALIZABLE");

            try {
                for (let i = 0; i < wallets.length; i += batchSize) {
                    const batchWallets = wallets.slice(i, i + batchSize);

                    const params = batchWallets
                        .map((w) => [w.getAddress(), w.getPublicKey(), w.getBalance().toFixed(), w.getNonce().toFixed(), w.getAttributes()])
                        .flat();

                    const values = batchWallets
                        .map((_, y) => `($${y * 5 + 1}, $${y * 5 + 2}, $${y * 5 + 3}, $${y * 5 + 4}, $${y * 5 + 5})`)
                        .join(", ");

                    const query = `
                        INSERT INTO wallets(address, public_key, balance, nonce, attributes) VALUES
                            ${values}
                        ON CONFLICT (address) DO UPDATE SET
                            public_key = EXCLUDED.public_key,
                            balance = EXCLUDED.balance,
                            nonce = EXCLUDED.nonce,
                            attributes = EXCLUDED.attributes
                    `;

                    await queryRunner.query(query, params);
                }

                await queryRunner.commitTransaction();
            } catch (error) {
                await queryRunner.rollbackTransaction();
                throw error;
            }
        } finally {
            await queryRunner.release();
        }
    }
}
