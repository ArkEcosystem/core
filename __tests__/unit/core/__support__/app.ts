import { ApplicationFactory, Commands, Container, Services } from "@arkecosystem/core-cli";
import { CryptoSuite } from "@packages/core-crypto/";

export const executeCommand = async (
    command,
    cryptoSuite: CryptoSuite.CryptoSuite = new CryptoSuite.CryptoSuite(
        CryptoSuite.CryptoManager.findNetworkByName("testnet"),
    ),
): Promise<void> => {
    const app = ApplicationFactory.make(
        new Container.Container(),
        {
            name: "@arkecosystem/core",
            version: "3.0.0-next.0",
        },
        cryptoSuite,
    );

    app.rebind(Container.Identifiers.ApplicationPaths).toConstantValue(
        app.get<Services.Environment>(Container.Identifiers.Environment).getPaths("ark", "testnet"),
    );

    const cmd = app.resolve<Commands.Command>(command);

    cmd.register(["--token=ark", "--network=testnet"]);

    await cmd.run();
};
