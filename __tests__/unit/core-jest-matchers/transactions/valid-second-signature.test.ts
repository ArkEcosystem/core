import "../../../../packages/core-jest-matchers/src/transactions/valid-second-signature";

const wallets = [
    {
        address: "AWTRWfm2qdEwxbXnLXxQnviMywFGSHdgkn",
        passphrase: "poet virtual attend winter mushroom near manual dish exact palm siren motion",
        publicKey: "0322bb7969362a15c78b70be2adcfd270a2ad9f2cd0faed14a5d809c7fd5773e48",
    },
    {
        address: "AaWAUV5hgDdUnpWHkD1a65AFQBayGgTaFF",
        passphrase: "obtain flower vital stone song express combine issue used excite despair trash",
        publicKey: "02300c5296527a2ff8586b6d2af383db4e487e6c9a45b6b55dd795393ef460568c",
    },
];

const transaction = {
    serialized:
        "ff01170088795c030322bb7969362a15c78b70be2adcfd270a2ad9f2cd0faed14a5d809c7fd5773e4880969800000000001254657374205472616e73616374696f6e203102000000000000000000000017a10c9543273d90fb4200897a47f51164ae3c92653045022100ef114e808311bd49edc18c7fe83357bb3fdf67d69c32153ed683150aa1b3143802207635a5594c5b394409af49b8289a5c47f4ae5785f5c62ea95a207c66fe30dd943045022100fff70add8db1d54d1c504c354417c2ba5a03401e93cd9ec3f75605a64888d04502203c70c1a86c3c416af913a4d657b461d73f2297061801982463d7bd47f5a91cfe",
    verified: true,
    id: "ca29499181a5b8145caacb21c638b63de60a9e7cc3a4d4bef367e653c4242f61",
    sequence: undefined,
    version: 1,
    timestamp: 56392072,
    senderPublicKey: "0322bb7969362a15c78b70be2adcfd270a2ad9f2cd0faed14a5d809c7fd5773e48",
    recipientId: "AWTRWfm2qdEwxbXnLXxQnviMywFGSHdgkn",
    type: 0,
    vendorField: "Test Transaction 1",
    vendorFieldHex: "54657374205472616e73616374696f6e2031",
    amount: 2,
    fee: 10000000,
    blockId: undefined,
    signature:
        "3045022100ef114e808311bd49edc18c7fe83357bb3fdf67d69c32153ed683150aa1b3143802207635a5594c5b394409af49b8289a5c47f4ae5785f5c62ea95a207c66fe30dd94",
    signatures: undefined,
    secondSignature:
        "3045022100fff70add8db1d54d1c504c354417c2ba5a03401e93cd9ec3f75605a64888d04502203c70c1a86c3c416af913a4d657b461d73f2297061801982463d7bd47f5a91cfe",
    signSignature:
        "3045022100fff70add8db1d54d1c504c354417c2ba5a03401e93cd9ec3f75605a64888d04502203c70c1a86c3c416af913a4d657b461d73f2297061801982463d7bd47f5a91cfe",
    asset: undefined,
    expiration: 0,
    data: {
        version: 1,
        network: 23,
        type: 0,
        timestamp: 56392072,
        senderPublicKey: "0322bb7969362a15c78b70be2adcfd270a2ad9f2cd0faed14a5d809c7fd5773e48",
        fee: 10000000,
        vendorFieldHex: "54657374205472616e73616374696f6e2031",
        amount: 2,
        expiration: 0,
        recipientId: "AWTRWfm2qdEwxbXnLXxQnviMywFGSHdgkn",
        signature:
            "3045022100ef114e808311bd49edc18c7fe83357bb3fdf67d69c32153ed683150aa1b3143802207635a5594c5b394409af49b8289a5c47f4ae5785f5c62ea95a207c66fe30dd94",
        secondSignature:
            "3045022100fff70add8db1d54d1c504c354417c2ba5a03401e93cd9ec3f75605a64888d04502203c70c1a86c3c416af913a4d657b461d73f2297061801982463d7bd47f5a91cfe",
        signSignature:
            "3045022100fff70add8db1d54d1c504c354417c2ba5a03401e93cd9ec3f75605a64888d04502203c70c1a86c3c416af913a4d657b461d73f2297061801982463d7bd47f5a91cfe",
        vendorField: "Test Transaction 1",
        id: "ca29499181a5b8145caacb21c638b63de60a9e7cc3a4d4bef367e653c4242f61",
    },
};

describe(".toHaveValidSecondSignature", () => {
    test("passes when given a valid transaction", () => {
        expect(transaction).toHaveValidSecondSignature({
            publicKey: wallets[1].publicKey,
        });
    });

    test("fails when given an invalid transaction", () => {
        transaction.secondSignature = "invalid";
        transaction.signSignature = "invalid";
        expect(expect(transaction).toHaveValidSecondSignature).toThrowError(
            "Expected value to have a valid second signature",
        );
    });

    test("fails when it does not match", () => {
        transaction.secondSignature = "invalid";
        transaction.signSignature = "invalid";
        expect(transaction).not.toHaveValidSecondSignature({
            publicKey: wallets[1].publicKey,
        });
    });
});
