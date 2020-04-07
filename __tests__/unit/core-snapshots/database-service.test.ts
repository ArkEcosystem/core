import "jest-extended";

import { Connection } from "typeorm";
import { Container } from "@packages/core-kernel";
import { Sandbox } from "@packages/core-test-framework";
import { SnapshotDatabaseService } from "@packages/core-snapshots/src/database-service";
import { Identifiers } from "@packages/core-snapshots/src/ioc";
import { Repositories, Models } from "@packages/core-database";

let sandbox: Sandbox;
let database: SnapshotDatabaseService;

let logger = {
    info: jest.fn(),
    error: jest.fn(),
};

let connection: Partial<Connection> = {
    isConnected: true
};

let blockRepository: Partial<Repositories.AbstractEntityRepository<Models.Block>> = {
    count: jest.fn(),
    clear: jest.fn(),
    delete : jest.fn(),
};

let transactionRepository: Partial<Repositories.AbstractEntityRepository<Models.Transaction>> = {
    count: jest.fn(),
    clear: jest.fn(),
    delete : jest.fn(),
};

let roundRepository: Partial<Repositories.AbstractEntityRepository<Models.Round>> = {
    count: jest.fn(),
    clear: jest.fn(),
    delete : jest.fn(),
};

beforeEach(() => {
    sandbox = new Sandbox;

    sandbox.app.bind(Container.Identifiers.LogService).toConstantValue(logger);

    sandbox.app.bind(Container.Identifiers.DatabaseConnection).toConstantValue(connection);

    sandbox.app.bind(Identifiers.SnapshotBlockRepository).toConstantValue(blockRepository);
    sandbox.app.bind(Identifiers.SnapshotTransactionRepository).toConstantValue(transactionRepository);
    sandbox.app.bind(Identifiers.SnapshotRoundRepository).toConstantValue(roundRepository);


    database = sandbox.app.resolve<SnapshotDatabaseService>(SnapshotDatabaseService);
});

afterEach(() => {
   jest.resetAllMocks();
});

describe("DatabaseService", () => {

    describe("truncate", () => {
        it("should call delete and clear method on transaction, block and round", async () => {
            await expect(database.truncate()).toResolve();

            expect(blockRepository.delete).toHaveBeenCalled();
            expect(transactionRepository.clear).toHaveBeenCalled();
            expect(roundRepository.clear).toHaveBeenCalled();
        });
    });
});
