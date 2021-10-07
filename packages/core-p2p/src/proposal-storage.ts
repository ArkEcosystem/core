import { Container } from "@arkecosystem/core-kernel";
import BetterSqlite3 from "better-sqlite3";
import { ensureFileSync } from "fs-extra";

@Container.injectable()
export class ProposalStorage {
    private database!: BetterSqlite3.Database;
    private addProposalStmt!: BetterSqlite3.Statement<{ height: number; data: any }>;
    private hasProposalStmt!: BetterSqlite3.Statement<{ height: number }>;
    private getProposalStmt!: BetterSqlite3.Statement<{ height: number }>;
    private removeProposalStmt!: BetterSqlite3.Statement<{ height: number }>;

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

            CREATE UNIQUE INDEX IF NOT EXISTS ${table}_height ON ${table} (height);
        `);

        this.addProposalStmt = this.database.prepare(`INSERT INTO ${table} (height, data) VALUES (:height, :data)`);

        this.hasProposalStmt = this.database
            .prepare(`SELECT COUNT(*) FROM ${table} WHERE height = :height`)
            .pluck(true);

        this.getProposalStmt = this.database.prepare(`SELECT data FROM ${table} WHERE height = :height`);

        this.removeProposalStmt = this.database.prepare(`DELETE FROM ${table} WHERE height = :height`);
    }

    public addProposal(proposal: { height: number }): void {
        this.addProposalStmt.run({ height: proposal.height, data: JSON.stringify(proposal) });
    }

    public hasProposal(height: number): boolean {
        return !!this.hasProposalStmt.get({ height });
    }

    public getProposal(height: number): any {
        const result = this.getProposalStmt.get({ height });

        if (result) {
            return JSON.parse(result.data);
        }

        return undefined;
    }

    public removeProposal(height: number): void {
        this.removeProposalStmt.run({ height });
    }
}
