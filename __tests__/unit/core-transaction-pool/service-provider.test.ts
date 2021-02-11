import "jest-extended";

import { Application, Container, Contracts, Services } from "@arkecosystem/core-kernel";
import { ServiceProvider } from "@packages/core-transaction-pool/src";
import { fork } from "child_process";
import { AnySchema } from "joi";

jest.mock("child_process");

let app: Application;

beforeEach(() => {
    app = new Application(new Container.Container());
    app.bind(Container.Identifiers.TriggerService).to(Services.Triggers.Triggers).inSingletonScope();
});

describe("ServiceProvider", () => {
    let serviceProvider: ServiceProvider;

    beforeEach(() => {
        serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);
    });

    it("should register, boot and dispose", async () => {
        await expect(serviceProvider.register()).toResolve();

        app.rebind(Container.Identifiers.TransactionPoolStorage).toConstantValue({
            boot: jest.fn(),
            dispose: jest.fn(),
        });

        app.rebind(Container.Identifiers.TransactionPoolService).toConstantValue({
            boot: jest.fn(),
            dispose: jest.fn(),
        });

        await expect(serviceProvider.boot()).toResolve();

        await expect(serviceProvider.dispose()).toResolve();
    });

    it("should be required", async () => {
        await expect(serviceProvider.required()).resolves.toBeTrue();
    });

    it("should provide TransactionPoolWorkerIpcSubprocessFactory", async () => {
        await expect(serviceProvider.register()).toResolve();
        const subprocessFactory = app.get<Contracts.TransactionPool.WorkerIpcSubprocessFactory>(
            Container.Identifiers.TransactionPoolWorkerIpcSubprocessFactory,
        );
        (fork as jest.Mock).mockReturnValueOnce({ on: jest.fn() });
        subprocessFactory();
        expect(fork).toBeCalled();
    });

    describe("configSchema", () => {
        beforeEach(() => {
            serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);

            for (const key of Object.keys(process.env)) {
                if (key.includes("CORE_TRANSACTION_POOL") || key === "CORE_MAX_TRANSACTIONS_IN_POOL") {
                    delete process.env[key];
                }
            }
        });

        it("should validate schema using defaults", async () => {
            jest.resetModules();
            const result = (serviceProvider.configSchema() as AnySchema).validate(
                (await import("@packages/core-transaction-pool/src/defaults")).defaults,
            );

            expect(result.error).toBeUndefined();

            expect(result.value.enabled).toBeTrue();
            expect(result.value.storage).toBeString();
            expect(result.value.maxTransactionsInPool).toBeNumber();
            expect(result.value.maxTransactionsPerSender).toBeNumber();
            expect(result.value.allowedSenders).toEqual([]);
            expect(result.value.maxTransactionsPerRequest).toBeNumber();
            expect(result.value.maxTransactionAge).toBeNumber();
            expect(result.value.maxTransactionBytes).toBeNumber();

            expect(result.value.dynamicFees.enabled).toBeTrue();
            expect(result.value.dynamicFees.minFeePool).toBeNumber();
            expect(result.value.dynamicFees.minFeeBroadcast).toBeNumber();

            expect(result.value.dynamicFees.addonBytes.transfer).toBeNumber();
            expect(result.value.dynamicFees.addonBytes.secondSignature).toBeNumber();
            expect(result.value.dynamicFees.addonBytes.delegateRegistration).toBeNumber();
            expect(result.value.dynamicFees.addonBytes.vote).toBeNumber();
            expect(result.value.dynamicFees.addonBytes.multiSignature).toBeNumber();
            expect(result.value.dynamicFees.addonBytes.ipfs).toBeNumber();
            expect(result.value.dynamicFees.addonBytes.multiPayment).toBeNumber();
            expect(result.value.dynamicFees.addonBytes.delegateResignation).toBeNumber();
            expect(result.value.dynamicFees.addonBytes.htlcLock).toBeNumber();
            expect(result.value.dynamicFees.addonBytes.htlcClaim).toBeNumber();
            expect(result.value.dynamicFees.addonBytes.htlcRefund).toBeNumber();

            expect(result.value.workerPool.workerCount).toBeNumber();
            expect(result.value.workerPool.cryptoPackages.length).toBeGreaterThan(0);
            result.value.workerPool.cryptoPackages.forEach((item) => {
                expect(item.typeGroup).toBeNumber();
                expect(item.packageName).toBeString();
            });
        });

        it("should allow configuration extension", async () => {
            jest.resetModules();
            const defaults = (await import("@packages/core-transaction-pool/src/defaults")).defaults;

            // @ts-ignore
            defaults.customField = "dummy";

            const result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

            expect(result.error).toBeUndefined();
            expect(result.value.customField).toEqual("dummy");
        });

        describe("process.env.CORE_TRANSACTION_POOL_DISABLED", () => {
            it("should return true when process.env.CORE_TRANSACTION_POOL_DISABLED is undefined", async () => {
                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-transaction-pool/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.enabled).toBeTrue();
            });

            it("should return false when process.env.CORE_TRANSACTION_POOL_DISABLED is present", async () => {
                process.env.CORE_TRANSACTION_POOL_DISABLED = "true";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-transaction-pool/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.enabled).toBeFalse();
            });
        });

        describe("process.env.CORE_PATH_DATA", () => {
            it("should return path containing process.env.CORE_PATH_DATA", async () => {
                process.env.CORE_PATH_DATA = "dummy/path";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-transaction-pool/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.storage).toEqual("dummy/path/transaction-pool.sqlite");
            });
        });

        describe("process.env.CORE_MAX_TRANSACTIONS_IN_POOL", () => {
            it("should parse process.env.CORE_MAX_TRANSACTIONS_IN_POOL", async () => {
                process.env.CORE_MAX_TRANSACTIONS_IN_POOL = "4000";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-transaction-pool/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.maxTransactionsInPool).toEqual(4000);
            });

            it("should throw if process.env.CORE_MAX_TRANSACTIONS_IN_POOL is not number", async () => {
                process.env.CORE_MAX_TRANSACTIONS_IN_POOL = "false";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-transaction-pool/src/defaults")).defaults,
                );

                expect(result.error).toBeDefined();
                expect(result.error!.message).toEqual('"maxTransactionsInPool" must be a number');
            });
        });

        describe("process.env.CORE_TRANSACTION_POOL_MAX_PER_SENDER", () => {
            it("should parse process.env.CORE_TRANSACTION_POOL_MAX_PER_SENDER", async () => {
                process.env.CORE_TRANSACTION_POOL_MAX_PER_SENDER = "4000";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-transaction-pool/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.maxTransactionsPerSender).toEqual(4000);
            });

            it("should throw if process.env.CORE_TRANSACTION_POOL_MAX_PER_SENDER is not number", async () => {
                process.env.CORE_TRANSACTION_POOL_MAX_PER_SENDER = "false";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-transaction-pool/src/defaults")).defaults,
                );

                expect(result.error).toBeDefined();
                expect(result.error!.message).toEqual('"maxTransactionsPerSender" must be a number');
            });
        });

        describe("process.env.CORE_TRANSACTION_POOL_MAX_PER_REQUEST", () => {
            it("should parse process.env.CORE_TRANSACTION_POOL_MAX_PER_SENDER", async () => {
                process.env.CORE_TRANSACTION_POOL_MAX_PER_REQUEST = "4000";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-transaction-pool/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.maxTransactionsPerRequest).toEqual(4000);
            });

            it("should throw if process.env.CORE_TRANSACTION_POOL_MAX_PER_REQUEST is not number", async () => {
                process.env.CORE_TRANSACTION_POOL_MAX_PER_REQUEST = "false";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-transaction-pool/src/defaults")).defaults,
                );

                expect(result.error).toBeDefined();
                expect(result.error!.message).toEqual('"maxTransactionsPerRequest" must be a number');
            });
        });

        describe("schema restrictions", () => {
            let defaults;

            beforeEach(async () => {
                jest.resetModules();
                defaults = (await import("@packages/core-transaction-pool/src/defaults")).defaults;
            });

            it("enabled is required", async () => {
                delete defaults.enabled;
                const result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"enabled" is required');
            });

            it("storage is required", async () => {
                delete defaults.storage;
                const result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"storage" is required');
            });

            it("maxTransactionsInPool is required && is integer && >= 1", async () => {
                defaults.maxTransactionsInPool = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"maxTransactionsInPool" must be a number');

                defaults.maxTransactionsInPool = 1.12;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"maxTransactionsInPool" must be an integer');

                defaults.maxTransactionsInPool = 0;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"maxTransactionsInPool" must be greater than or equal to 1');

                delete defaults.maxTransactionsInPool;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"maxTransactionsInPool" is required');
            });

            it("maxTransactionsPerSender is required && is integer && >= 1", async () => {
                defaults.maxTransactionsPerSender = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"maxTransactionsPerSender" must be a number');

                defaults.maxTransactionsPerSender = 1.12;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"maxTransactionsPerSender" must be an integer');

                defaults.maxTransactionsPerSender = 0;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"maxTransactionsPerSender" must be greater than or equal to 1');

                delete defaults.maxTransactionsPerSender;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"maxTransactionsPerSender" is required');
            });

            it("allowedSenders is required && must contain strings", async () => {
                delete defaults.allowedSenders;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"allowedSenders" is required');

                defaults.allowedSenders = [1, 2];
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"allowedSenders[0]" must be a string');
            });

            it("maxTransactionsPerRequest is required && is integer && >= 1", async () => {
                defaults.maxTransactionsPerRequest = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"maxTransactionsPerRequest" must be a number');

                defaults.maxTransactionsPerRequest = 1.12;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"maxTransactionsPerRequest" must be an integer');

                defaults.maxTransactionsPerRequest = 0;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"maxTransactionsPerRequest" must be greater than or equal to 1');

                delete defaults.maxTransactionsPerRequest;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"maxTransactionsPerRequest" is required');
            });

            it("maxTransactionAge is required && is integer && >= 1", async () => {
                defaults.maxTransactionAge = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"maxTransactionAge" must be a number');

                defaults.maxTransactionAge = 1.12;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"maxTransactionAge" must be an integer');

                defaults.maxTransactionAge = 0;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"maxTransactionAge" must be greater than or equal to 1');

                delete defaults.maxTransactionAge;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"maxTransactionAge" is required');
            });

            it("maxTransactionBytes is required && is integer && >= 1", async () => {
                defaults.maxTransactionBytes = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"maxTransactionBytes" must be a number');

                defaults.maxTransactionBytes = 1.12;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"maxTransactionBytes" must be an integer');

                defaults.maxTransactionBytes = 0;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"maxTransactionBytes" must be greater than or equal to 1');

                delete defaults.maxTransactionBytes;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"maxTransactionBytes" is required');
            });

            it("dynamicFees is required", async () => {
                delete defaults.dynamicFees;
                const result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"dynamicFees" is required');
            });

            it("dynamicFees.enabled is required", async () => {
                delete defaults.dynamicFees.enabled;
                const result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"dynamicFees.enabled" is required');
            });

            it("dynamicFees.minFeePool is required when enabled = true && is integer && >= 0", async () => {
                defaults.dynamicFees.minFeePool = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"dynamicFees.minFeePool" must be a number');

                defaults.dynamicFees.minFeePool = 1.12;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"dynamicFees.minFeePool" must be an integer');

                defaults.dynamicFees.minFeePool = -1;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"dynamicFees.minFeePool" must be greater than or equal to 0');

                delete defaults.dynamicFees.minFeePool;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"dynamicFees.minFeePool" is required');

                defaults.dynamicFees.enabled = false;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error).toBeUndefined();
            });

            it("dynamicFees.minFeeBroadcast is required when enabled = true && must be larger or equal 0", async () => {
                defaults.dynamicFees.minFeeBroadcast = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"dynamicFees.minFeeBroadcast" must be a number');

                defaults.dynamicFees.minFeeBroadcast = 1.12;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"dynamicFees.minFeeBroadcast" must be an integer');

                defaults.dynamicFees.minFeeBroadcast = -1;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual(
                    '"dynamicFees.minFeeBroadcast" must be greater than or equal to 0',
                );

                delete defaults.dynamicFees.minFeeBroadcast;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"dynamicFees.minFeeBroadcast" is required');

                defaults.dynamicFees.enabled = false;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error).toBeUndefined();
            });

            it("dynamicFees.addonBytes is required when enabled = true", async () => {
                delete defaults.dynamicFees.addonBytes;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"dynamicFees.addonBytes" is required');

                defaults.dynamicFees.enabled = false;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error).toBeUndefined();
            });

            it("dynamicFees.addonBytes[transaction_name] should be integer && >= 0 when present", async () => {
                defaults.dynamicFees.addonBytes.test = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"dynamicFees.addonBytes.test" must be a number');

                defaults.dynamicFees.addonBytes.test = 1.12;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"dynamicFees.addonBytes.test" must be an integer');

                defaults.dynamicFees.addonBytes.test = -1;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual(
                    '"dynamicFees.addonBytes.test" must be greater than or equal to 0',
                );
            });

            it("workerPool is required", async () => {
                delete defaults.workerPool;
                const result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"workerPool" is required');
            });

            it("workerPool.workerCount is required && is integer && >= 0", async () => {
                defaults.workerPool.workerCount = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"workerPool.workerCount" must be a number');

                defaults.workerPool.workerCount = 1.12;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"workerPool.workerCount" must be an integer');

                defaults.workerPool.workerCount = 0;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"workerPool.workerCount" must be greater than or equal to 1');

                delete defaults.workerPool.workerCount;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"workerPool.workerCount" is required');
            });

            it("workerPool.cryptoPackages is required", async () => {
                delete defaults.workerPool.cryptoPackages;
                const result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"workerPool.cryptoPackages" is required');
            });

            it("workerPool.cryptoPackages[x].typeGroup is required && is integer && >= 2", async () => {
                defaults.workerPool.cryptoPackages[0].typeGroup = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"workerPool.cryptoPackages[0].typeGroup" must be a number');

                defaults.workerPool.cryptoPackages[0].typeGroup = 1.12;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"workerPool.cryptoPackages[0].typeGroup" must be an integer');

                defaults.workerPool.cryptoPackages[0].typeGroup = 0;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual(
                    '"workerPool.cryptoPackages[0].typeGroup" must be greater than or equal to 2',
                );

                delete defaults.workerPool.cryptoPackages[0].typeGroup;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"workerPool.cryptoPackages[0].typeGroup" is required');
            });

            it("workerPool.cryptoPackages[x].packageName is required && must be string", async () => {
                defaults.workerPool.cryptoPackages[0].packageName = 0;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"workerPool.cryptoPackages[0].packageName" must be a string');

                delete defaults.workerPool.cryptoPackages[0].packageName;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"workerPool.cryptoPackages[0].packageName" is required');
            });
        });
    });
});
