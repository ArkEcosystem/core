import "jest-extended";

import { DelegateFactory } from "@packages/core-forger/src/delegate-factory";
import { ServiceProvider } from "@packages/core-forger/src/service-provider";
import { Application, Container, Providers } from "@packages/core-kernel";
import { Pm2ProcessActionsService } from "@packages/core-kernel/src/services/process-actions/drivers/pm2";
import { AnySchema } from "joi";

describe("ServiceProvider", () => {
    let app: Application;
    let serviceProvider: ServiceProvider;

    const triggerService = { bind: jest.fn() };

    const bip39DelegateMock = { address: "D6Z26L69gdk8qYmTv5uzk3uGepigtHY4ax" } as any;
    const bip38DelegateMock = { address: "D6Z26L69gbk8qYmTv5uzk3uGepigtHY4ax" } as any;

    beforeEach(() => {
        app = new Application(new Container.Container());

        app.bind(Container.Identifiers.LogService).toConstantValue({});
        app.bind(Container.Identifiers.EventDispatcherService).toConstantValue({ listen: jest.fn() });
        app.bind(Container.Identifiers.BlockchainService).toConstantValue({});
        app.bind(Container.Identifiers.WalletRepository).toConstantValue({});
        app.bind(Container.Identifiers.TransactionHandlerProvider).toConstantValue({});
        app.bind(Container.Identifiers.TriggerService).toConstantValue(triggerService);
        app.bind(Container.Identifiers.PluginConfiguration).to(Providers.PluginConfiguration).inSingletonScope();
        app.bind(Container.Identifiers.ProcessActionsService).to(Pm2ProcessActionsService).inSingletonScope();

        app.config("delegates", { secrets: [], bip38: "dummy bip 38" });
        app.config("app", { flags: { bip38: "dummy bip 38", password: "dummy pwd" } });

        serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);

        const pluginConfiguration = app.resolve<Providers.PluginConfiguration>(Providers.PluginConfiguration);
        pluginConfiguration.from("core-forger", {
            // @ts-ignore
            hosts: [],
            tracker: true,
        });
        serviceProvider.setConfig(pluginConfiguration);

        jest.spyOn(DelegateFactory, "fromBIP39").mockReturnValue(bip39DelegateMock);
        jest.spyOn(DelegateFactory, "fromBIP38").mockReturnValue(bip38DelegateMock);
    });

    describe("register", () => {
        it("should bind ForgerService, ForgeNewBlockAction, IsForgingAllowedAction", async () => {
            expect(app.isBound(Container.Identifiers.ForgerService)).toBeFalse();

            await serviceProvider.register();

            expect(app.isBound(Container.Identifiers.ForgerService)).toBeTrue();
            expect(triggerService.bind).toBeCalledTimes(2);
            expect(triggerService.bind).toBeCalledWith("forgeNewBlock", expect.anything());
            expect(triggerService.bind).toBeCalledWith("isForgingAllowed", expect.anything());
        });
    });

    describe("boot", () => {
        it("should call boot on forger service", async () => {
            app.config("delegates", { secrets: ["this is a super secret passphrase"], bip38: "dummy bip 38" });

            const forgerService = { boot: jest.fn(), register: jest.fn() };
            app.bind(Container.Identifiers.ForgerService).toConstantValue(forgerService);

            await serviceProvider.boot();

            expect(forgerService.register).toBeCalledTimes(1);
            expect(forgerService.boot).toBeCalledTimes(1);
        });

        it("should create delegates from delegates.secret and flags.bip38 / flags.password", async () => {
            const secrets = ["this is a super secret passphrase", "this is a super secret passphrase2"];
            app.config("delegates", { secrets, bip38: "dummy bip 38" });

            const flagsConfig = { bip38: "dummy bip38", password: "dummy password" };
            app.config("app.flags", flagsConfig);

            const forgerService = { boot: jest.fn(), register: jest.fn() };
            app.bind(Container.Identifiers.ForgerService).toConstantValue(forgerService);

            const anotherBip39DelegateMock = { address: "D6Z26L69gdk8qYmTv5uzk3uGepigtHY4fe" } as any;
            jest.spyOn(DelegateFactory, "fromBIP39").mockReturnValueOnce(anotherBip39DelegateMock);

            await serviceProvider.boot();

            expect(forgerService.register).toBeCalledTimes(1);
            expect(forgerService.boot).toBeCalledTimes(1);
            expect(forgerService.boot).toBeCalledWith([anotherBip39DelegateMock, bip39DelegateMock, bip38DelegateMock]);
        });

        it("should call boot on forger service with empty array when no delegates are configured", async () => {
            app.config("delegates", { secrets: [], bip38: undefined });
            app.config("app", { flags: { bip38: undefined, password: undefined } });

            const forgerService = { boot: jest.fn(), register: jest.fn() };
            app.bind(Container.Identifiers.ForgerService).toConstantValue(forgerService);

            await serviceProvider.boot();

            expect(forgerService.register).toBeCalledTimes(1);
            expect(forgerService.boot).toBeCalledTimes(1);
            expect(forgerService.boot).toBeCalledWith([]);
        });
    });

    describe("dispose", () => {
        it("should call dispose on forger service", async () => {
            const forgerService = { dispose: jest.fn() };
            app.bind(Container.Identifiers.ForgerService).toConstantValue(forgerService);

            await serviceProvider.dispose();

            expect(forgerService.dispose).toBeCalledTimes(1);
        });
    });

    describe("bootWhen", () => {
        it("should return false when there is not bip38 or secrets defined", async () => {
            app.config("delegates", { secrets: [], bip38: undefined });

            const bootWhenResult = await serviceProvider.bootWhen();

            expect(bootWhenResult).toBeFalse();
        });

        it("should return true when bip38 or secrets defined", async () => {
            app.config("delegates", { secrets: [], bip38: "yeah bip 38 defined" });

            const bootWhenResultBip38 = await serviceProvider.bootWhen();

            expect(bootWhenResultBip38).toBeTrue();

            app.config("delegates", { secrets: ["shhhh"], bip38: undefined });

            const bootWhenResultSecrets = await serviceProvider.bootWhen();

            expect(bootWhenResultSecrets).toBeTrue();
        });
    });

    describe("configSchema", () => {
        beforeEach(() => {
            serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);

            for (const key of Object.keys(process.env)) {
                if (key === "CORE_P2P_PORT") {
                    delete process.env[key];
                }
            }
        });

        it("should validate schema using defaults", async () => {
            jest.resetModules();
            const result = (serviceProvider.configSchema() as AnySchema).validate(
                (await import("@packages/core-forger/src/defaults")).defaults,
            );

            expect(result.error).toBeUndefined();

            expect(result.value.hosts).toBeArray();
            expect(result.value.hosts.length).toBeGreaterThanOrEqual(1);
            result.value.hosts.forEach((item) => {
                expect(item.hostname).toBeString();
                expect(item.port).toBeNumber();
            });

            expect(result.value.tracker).toBeBoolean();

            expect(result.value.bip38).toBeUndefined();
            expect(result.value.password).toBeUndefined();
        });

        it("should allow configuration extension", async () => {
            jest.resetModules();
            const defaults = (await import("@packages/core-forger/src/defaults")).defaults;

            // @ts-ignore
            defaults.customField = "dummy";

            const result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

            expect(result.error).toBeUndefined();
            expect(result.value.customField).toEqual("dummy");
        });

        describe("process.env.CORE_P2P_PORT", () => {
            it("should parse process.env.CORE_API_PORT", async () => {
                process.env.CORE_P2P_PORT = "5000";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-forger/src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.hosts[0].port).toEqual(5000);
            });

            it("should throw if process.env.CORE_API_PORT is not number", async () => {
                process.env.CORE_P2P_PORT = "false";

                jest.resetModules();
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("@packages/core-forger/src/defaults")).defaults,
                );

                expect(result.error).toBeDefined();
                expect(result.error!.message).toEqual('"hosts[0].port" must be a number');
            });
        });

        describe("schema restrictions", () => {
            let defaults;

            beforeEach(async () => {
                jest.resetModules();
                defaults = (await import("@packages/core-forger/src/defaults")).defaults;
            });

            it("hosts is required && must be array", async () => {
                defaults.hosts = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"hosts" must be an array');

                delete defaults.hosts;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"hosts" is required');
            });

            it("hosts.hostname is required && is ipv4 or ipv6 string", async () => {
                defaults.hosts = [{ hostname: false }];
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"hosts[0].hostname" must be a string');

                defaults.hosts = [{ hostname: "not an IP" }];
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual(
                    '"hosts[0].hostname" must be a valid ip address of one of the following versions [ipv4, ipv6] with a optional CIDR',
                );

                defaults.hosts = [{}];
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"hosts[0].hostname" is required');
            });

            it("hosts.port is required && is integer && is >= 0 and <= 65535", async () => {
                defaults.hosts = [{ hostname: "127.0.0.1", port: false }];
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"hosts[0].port" must be a number');

                defaults.hosts = [{ hostname: "127.0.0.1", port: 1.12 }];
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"hosts[0].port" must be an integer');

                defaults.hosts = [{ hostname: "127.0.0.1", port: 0 }];
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"hosts[0].port" must be greater than or equal to 1');

                defaults.hosts = [{ hostname: "127.0.0.1", port: 655356 }];
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"hosts[0].port" must be less than or equal to 65535');

                defaults.hosts = [{ hostname: "127.0.0.1" }];
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"hosts[0].port" is required');
            });

            it("tracker is required && is boolean", async () => {
                defaults.tracker = 123;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"tracker" must be a boolean');

                delete defaults.tracker;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"tracker" is required');
            });

            it("bip38 is optional && is string", async () => {
                defaults.bip38 = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"bip38" must be a string');

                delete defaults.bip38;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error).toBeUndefined();
            });

            it("password is optional && is string", async () => {
                defaults.password = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"password" must be a string');

                delete defaults.password;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error).toBeUndefined();
            });
        });
    });
});
