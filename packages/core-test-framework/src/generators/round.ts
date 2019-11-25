import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Identities, Utils } from "@arkecosystem/crypto";

export const generateRound = (app: Contracts.Kernel.Application, publicKeys: string[], round: number) =>
    publicKeys.map((publicKey: string, i: number) => {
        const wallet = app.get<Contracts.State.WalletFactory>(Container.Identifiers.WalletFactory)(
            Identities.Address.fromPublicKey(publicKey),
        );
        wallet.publicKey = publicKey;

        wallet.setAttribute("delegate", {
            username: `genesis_${i + 1}`,
            voteBalance: Utils.BigNumber.make("300000000000000"),
            forgedFees: Utils.BigNumber.ZERO,
            forgedRewards: Utils.BigNumber.ZERO,
            producedBlocks: 0,
            round,
            rank: undefined,
        });

        return wallet;
    });
