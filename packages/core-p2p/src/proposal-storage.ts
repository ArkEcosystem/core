import { Container } from "@arkecosystem/core-kernel";
import BetterSqlite3 from "better-sqlite3";
import { ensureFileSync } from "fs-extra";

@Container.injectable()
export class ProposalStorage {
    private database!: BetterSqlite3.Database;
    private addProposalStmt!: BetterSqlite3.Statement<{ height: number; data: any }>;
    private hasProposalStmt!: BetterSqlite3.Statement<{ height: number }>;

    public boot(): void {
        const filename = `${process.env.CORE_PATH_DATA}/proposal.sqlite`;
        ensureFileSync(filename);

        const table = "proposals";

        this.database = new BetterSqlite3(filename);
        this.database.exec(`
            PRAGMA journal_mode = WAL;

            DROP TABLE IF EXISTS ${table};

            CREATE TABLE IF NOT EXISTS ${table}(
                height             INTEGER      NOT NULL,
                data               JSON         NOT NULL
            );

            CREATE INDEX IF NOT EXISTS ${table}_height ON ${table} (height);
        `);

        this.addProposalStmt = this.database.prepare(`INSERT INTO ${table} (height, data) VALUES (:height, :data)`);

        this.hasProposalStmt = this.database
            .prepare(`SELECT COUNT(*) FROM ${table} WHERE height = :height`)
            .pluck(true);
    }

    public addProposal(proposal: { height: number }): void {
        this.addProposalStmt.run({ height: proposal.height, data: JSON.stringify(proposal) });
    }

    public hasProposal(height: number): boolean {
        return !!this.hasProposalStmt.get({ height });
    }
}
