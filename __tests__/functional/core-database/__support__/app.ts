import { Container, Providers } from "@arkecosystem/core-kernel";
import { Sandbox } from "@arkecosystem/core-test-framework";

export const getCoreDatabasePluginConfiguration = async (): Promise<Providers.PluginConfiguration> => {
    const sandbox: Sandbox = new Sandbox();
    await sandbox.boot(async ({ app }) => {
        await app.bootstrap({
            flags: {
                token: "ark",
                network: "unitnet",
                env: "test",
                processType: "core",
            },
            plugins: {
                include: ["@arkecosystem/core-database"],
            },
        });
    });

    const serviceProviderRepository = sandbox.app.get<Providers.ServiceProviderRepository>(
        Container.Identifiers.ServiceProviderRepository,
    );
    const databaseServiceProvider = serviceProviderRepository.get("@arkecosystem/core-database");
    return databaseServiceProvider.config();
};
