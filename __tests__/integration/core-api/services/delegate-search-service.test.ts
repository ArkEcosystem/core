import { Identifiers as ApiIdentifiers } from "@arkecosystem/core-api/src/identifiers";
import { DelegateSearchService } from "@arkecosystem/core-api/src/services/delegate-search-service";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Identities, Utils } from "@arkecosystem/crypto";

import { setUp } from "./__support__/setup";

let walletRepository: Contracts.State.WalletRepository;
let delegateSearchService: DelegateSearchService;

beforeEach(async () => {
    const app = await setUp();

    walletRepository = app.getTagged<Contracts.State.WalletRepository>(
        Container.Identifiers.WalletRepository,
        "state",
        "blockchain",
    );

    delegateSearchService = app.get<DelegateSearchService>(ApiIdentifiers.DelegateSearchService);
});

const walletDelegate1 = {
    username: "test_delegate_username1",
    voteBalance: Utils.BigNumber.make("100"),
    rank: 5,
    producedBlocks: 5,
    lastBlock: {
        id: "123456",
        height: 100,
        timestamp: 1459283733,
    },
    forgedFees: Utils.BigNumber.make("200"),
    forgedRewards: Utils.BigNumber.make("300"),
};

describe("DelegateSearchService.getDelegate", () => {
    it("should get delegate by address", () => {
        const wallet = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret"));
        wallet.setAttribute("delegate", walletDelegate1);
        walletRepository.index(wallet);
        const delegateResource = delegateSearchService.getDelegate(wallet.address);

        expect(delegateResource.address).toBe(wallet.address);
    });

    it("should not get non-delegate wallet by address", () => {
        const wallet = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret"));
        const delegateResource = delegateSearchService.getDelegate(wallet.address);

        expect(delegateResource).toBe(undefined);
    });
});
