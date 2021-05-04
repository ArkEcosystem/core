import { DelegateSearchService, Identifiers as ApiIdentifiers } from "@arkecosystem/core-api/src";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Identities, Utils } from "@arkecosystem/crypto";

import { setUp } from "./__support__/setup";

const delegateAttribute1 = {
    username: "binance_staking",
    voteBalance: Utils.BigNumber.make("352045954555224"),
    forgedFees: Utils.BigNumber.make("13830924525"),
    forgedRewards: Utils.BigNumber.make("5947800000000"),
    producedBlocks: 29739,
    rank: 1,
    lastBlock: {
        version: 0,
        timestamp: 108954760,
        height: 13467897,
        previousBlockHex: "c872ff925814623f40a8d0979299017d084cca9e9a8ad8a9a1ae53f627fa43ee",
        previousBlock: "c872ff925814623f40a8d0979299017d084cca9e9a8ad8a9a1ae53f627fa43ee",
        numberOfTransactions: 0,
        totalAmount: Utils.BigNumber.make("0"),
        totalFee: Utils.BigNumber.make("0"),
        reward: Utils.BigNumber.make("200000000"),
        payloadLength: 0,
        payloadHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        generatorPublicKey: "028fe98e42e159f2450a52371dfb23ae69a39fc5fee6545690b7f51bfcee933357",
        blockSignature:
            "3044022058fcaaa7b3245521fb2c08d3a0bd45abf3143bbe22defe747564bc3815b59cca02203874227b83740cf2f51965b7e18573a02d8aa6de1180052062aba3c99d2c4260",
        idHex: "2ffb6ca0defd7ee0b258b55335b54198c4b18c138ff820138366267427d9ebe1",
        id: "2ffb6ca0defd7ee0b258b55335b54198c4b18c138ff820138366267427d9ebe1",
    },
    round: 264077,
};

const delegateAttribute2 = {
    username: "cryptology",
    voteBalance: Utils.BigNumber.make("139798954680533"),
    forgedFees: Utils.BigNumber.make("318309139428"),
    forgedRewards: Utils.BigNumber.make("31996200000000"),
    producedBlocks: 159981,
    rank: 31,
    lastBlock: {
        version: 0,
        timestamp: 109032536,
        height: 13477618,
        previousBlockHex: "5fe125fef5e028ba6b2070e804b9fedf7fba6e53fb88a7523c206d36e30b4cc0",
        previousBlock: "5fe125fef5e028ba6b2070e804b9fedf7fba6e53fb88a7523c206d36e30b4cc0",
        numberOfTransactions: 0,
        totalAmount: Utils.BigNumber.make("0"),
        totalFee: Utils.BigNumber.make("0"),
        reward: Utils.BigNumber.make("200000000"),
        payloadLength: 0,
        payloadHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        generatorPublicKey: "03364c62f7c5a7948dcaacdc72bac595e8f6e79944e722d05c8346d68aa1331b4a",
        blockSignature:
            "3045022100a50b38b37dcc4dd40bc5b78e7c68a7ec67cd4acd5156f8fa091d74c45565d3ac02206fdfc52c28475f39c501dcb8f789b6ace9f6ac7edc97b37bf94deb36033c906e",
        idHex: "a19a270017a3a1beda906710a6c300ec0e63e8e57cf74d38dd9c216a78dd9b2b",
        id: "a19a270017a3a1beda906710a6c300ec0e63e8e57cf74d38dd9c216a78dd9b2b",
    },
    round: 264269,
};

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

describe("DelegateSearchService.getDelegate", () => {
    it("should get delegate by address", () => {
        const wallet1 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret1"));
        wallet1.setAttribute("delegate", delegateAttribute1);
        walletRepository.index(wallet1);
        const delegateResource1 = delegateSearchService.getDelegate(wallet1.getAddress())!;

        expect(delegateResource1.address).toBe(wallet1.getAddress());
    });

    it("should not get non-delegate wallet by address", () => {
        const wallet1 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret1"));
        const delegateResource1 = delegateSearchService.getDelegate(wallet1.getAddress());

        expect(delegateResource1).toBe(undefined);
    });
});

describe("DelegateSearchService.getDelegatesPage", () => {
    it("should get all delegates when criteria is empty", () => {
        const wallet1 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret1"));
        wallet1.setAttribute("delegate", delegateAttribute1);
        walletRepository.index(wallet1);

        const wallet2 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret2"));
        wallet2.setAttribute("delegate", delegateAttribute2);
        walletRepository.index(wallet2);

        const delegatesPage = delegateSearchService.getDelegatesPage({ offset: 0, limit: 100 }, [
            { property: "username", direction: "asc" },
        ]);

        expect(delegatesPage.totalCount).toEqual(2);
        expect(delegatesPage.results[0].username).toBe("binance_staking");
        expect(delegatesPage.results[1].username).toBe("cryptology");
    });

    it("should get delegates that match criteria", () => {
        const wallet1 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret1"));
        wallet1.setAttribute("delegate", delegateAttribute1);
        walletRepository.index(wallet1);

        const wallet2 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("secret2"));
        wallet2.setAttribute("delegate", delegateAttribute2);
        walletRepository.index(wallet2);

        const delegatesPage = delegateSearchService.getDelegatesPage(
            { offset: 0, limit: 100 },
            [{ property: "username", direction: "asc" }],
            { username: "binance_staking" },
        );

        expect(delegatesPage.totalCount).toEqual(1);
        expect(delegatesPage.results[0].username).toBe("binance_staking");
    });
});
