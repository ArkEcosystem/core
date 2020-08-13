import { DelegateSearchService, Identifiers as ApiIdentifiers } from "@arkecosystem/core-api";
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

describe("DelegateSearchService.getDelegateResourceFromWallet", () => {
    it("should return DelegateResource", () => {
        const wallet = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret"));
        wallet.setAttribute("delegate", walletDelegate1);
        const delegateResource = delegateSearchService.getDelegateResourceFromWallet(wallet);

        expect(delegateResource).toEqual({
            username: "test_delegate_username1",
            address: "D7seWn8JLVwX4nHd9hh2Lf7gvZNiRJ7qLk",
            publicKey: "03a02b9d5fdd1307c2ee4652ba54d492d1fd11a7d1bb3f3a44c4a05e79f19de933",
            votes: Utils.BigNumber.make("100"),
            rank: 5,
            isResigned: false,
            blocks: {
                produced: 5,
                last: { id: "123456", height: 100, timestamp: 1459283733 },
            },
            production: { approval: 0 },
            forged: {
                fees: Utils.BigNumber.make("200"),
                rewards: Utils.BigNumber.make("300"),
                total: Utils.BigNumber.make("500"),
            },
        });
    });
});

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

    it("should get delegate by public key", () => {
        const wallet = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret"));
        wallet.setAttribute("delegate", walletDelegate1);
        walletRepository.index(wallet);
        const delegateResource = delegateSearchService.getDelegate(wallet.publicKey);

        expect(delegateResource.address).toBe(wallet.address);
    });

    it("should not get non-delegate wallet by public key", () => {
        const wallet = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret"));
        const delegateResource = delegateSearchService.getDelegate(wallet.publicKey);

        expect(delegateResource).toBe(undefined);
    });

    it("should get delegate by username", () => {
        const wallet = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret"));
        wallet.setAttribute("delegate", walletDelegate1);
        walletRepository.index(wallet);
        const delegateResource = delegateSearchService.getDelegate(walletDelegate1.username);

        expect(delegateResource.address).toBe(wallet.address);
    });

    it("should get delegate with additional filter", () => {
        const wallet = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret"));
        wallet.setAttribute("delegate", walletDelegate1);
        walletRepository.index(wallet);
        const delegateResource = delegateSearchService.getDelegate(walletDelegate1.username, {
            rank: { from: walletDelegate1.rank },
        });

        expect(delegateResource.address).toBe(wallet.address);
    });

    it("should not get delegate with additional filter", () => {
        const wallet = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret"));
        wallet.setAttribute("delegate", walletDelegate1);
        walletRepository.index(wallet);
        const delegateResource = delegateSearchService.getDelegate(walletDelegate1.username, {
            rank: { from: walletDelegate1.rank + 1 },
        });

        expect(delegateResource).toBe(undefined);
    });
});
