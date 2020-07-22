import { Identities, Managers, Utils } from "@arkecosystem/crypto";
import delay from "delay";
import { TransactionFactory } from "../../helpers/transaction-factory";
import { secrets } from "../../utils/config/testnet/delegates.json";
import * as support from "./__support__";

beforeAll(async () => {
    await support.setUp();
    Managers.configManager.setFromPreset("testnet");
});
afterAll(support.tearDown);

describe("applyToRecipient - Multipayment scenario", () => {
    /*
     * Scenario :
     * - init bob and alice wallet
     * - send an initial tx from bob to index his wallet in tx pool
     * - send a multipayment from alice including bob in payment recipients
     * - send bob funds received from multipayment to a random address
     * - this last transaction from bob fails if pool wallet is not updated correctly by multipayment tx
     */
    const bobPassphrase = "bob pass phrase1";
    const bobAddress = Identities.Address.fromPassphrase(bobPassphrase, 23);
    const bobInitialFund = 50 * 1e8; // 50 ARK

    const alicePassphrase = "alice pass phrase1";
    const aliceAddress = Identities.Address.fromPassphrase(alicePassphrase, 23);
    const aliceInitialFund = 2500 * 1e8; // 2500 ARK

    const randomAddress = Identities.Address.fromPassphrase("ran dom addr1", 23);

    it("should correctly update recipients pool wallet balance after a multipayment", async () => {
        const initialTxToBob = TransactionFactory.transfer(bobAddress, bobInitialFund)
            .withPassphrase(secrets[1])
            .createOne();
        const initialTxToAlice = TransactionFactory.transfer(aliceAddress, aliceInitialFund)
            .withPassphrase(secrets[2])
            .createOne();
        await expect(initialTxToBob).toBeAccepted();
        await support.forge([initialTxToBob, initialTxToAlice]);
        await delay(1000);

        const initialTxFromBob = TransactionFactory.transfer(bobAddress, 1)
            .withPassphrase(bobPassphrase)
            .createOne();
        await expect(initialTxFromBob).toBeAccepted();
        await support.forge([initialTxFromBob]);
        await delay(1000);

        const multipaymentToBobAndAlice = TransactionFactory.multiPayment([
            {
                recipientId: bobAddress,
                amount: (2000 * 1e8).toFixed(), // 2000 ARK
            },
            {
                recipientId: aliceAddress,
                amount: (10 * 1e8).toFixed(), // 10 ARK
            },
        ])
            .withPassphrase(alicePassphrase)
            .createOne();
        await support.forge([multipaymentToBobAndAlice]);
        await delay(1000);
        await expect(multipaymentToBobAndAlice.id).toBeForged();

        const bobTransfer = TransactionFactory.transfer(randomAddress, 2000 * 1e8)
            .withPassphrase(bobPassphrase)
            .createOne();
        await expect(bobTransfer).toBeAccepted();
        await support.forge([bobTransfer]);
        await delay(1000);
    });
});

describe("applyToRecipient - transfer and multipayment classic scenarios", () => {
    it("should not accept a transfer in the pool with more amount than sender balance", async () => {
        // just send funds to a new wallet, and try to send more than the funds from this new wallet
        const bobPassphrase = "bob pass phrase2";
        const bobAddress = Identities.Address.fromPassphrase(bobPassphrase, 23);
        const bobInitialFund = 100 * 1e8; // 100 ARK

        const randomAddress = Identities.Address.fromPassphrase(secrets[1], 23);
        const initialTxToBob = TransactionFactory.transfer(bobAddress, bobInitialFund)
            .withPassphrase(secrets[1])
            .createOne();

        await support.forge([initialTxToBob]);
        await delay(1000);

        // the fees for this are making the transfer worth more than bob balance
        const bobTransferMoreThanBalance = TransactionFactory.transfer(randomAddress, bobInitialFund)
            .withPassphrase(bobPassphrase)
            .createOne();
        await expect(bobTransferMoreThanBalance).not.toBeAccepted();

        // now a transaction with fees + amount === balance should pass
        const fee = 1e7;
        const bobTransferValid = TransactionFactory.transfer(randomAddress, bobInitialFund - fee)
            .withPassphrase(bobPassphrase)
            .withFee(fee)
            .createOne();
        await expect(bobTransferValid).toBeAccepted();
        await delay(1000);
    });

    it("should not accept a transfer in the pool with more amount than sender balance", async () => {
        // just send funds to a new wallet with multipayment, and try to send more than the funds from this new wallet
        const bobPassphrase = "bob pass phrase3";
        const bobAddress = Identities.Address.fromPassphrase(bobPassphrase, 23);
        const bobInitialFund = 100 * 1e8; // 100 ARK

        const randomAddress = Identities.Address.fromPassphrase("a b c", 23);

        const initialTxToBob = TransactionFactory.multiPayment([
            {
                recipientId: bobAddress,
                amount: bobInitialFund.toFixed(),
            },
            {
                recipientId: randomAddress,
                amount: bobInitialFund.toFixed(),
            },
        ])
            .withPassphrase(secrets[1])
            .createOne();

        await support.forge([initialTxToBob]);
        await delay(1000);

        // the fees for this are making the transfer worth more than bob balance
        const bobTransferMoreThanBalance = TransactionFactory.transfer(randomAddress, bobInitialFund)
            .withPassphrase(bobPassphrase)
            .createOne();
        await expect(bobTransferMoreThanBalance).not.toBeAccepted();

        // now a transaction with fees + amount === balance should pass
        const fee = 1e7;
        const bobTransferValid = TransactionFactory.transfer(randomAddress, bobInitialFund - fee)
            .withPassphrase(bobPassphrase)
            .withFee(fee)
            .createOne();
        await expect(bobTransferValid).toBeAccepted();
        await delay(1000);
    });
});

describe("Pool transactions when database applyBlock fails (forged block contains invalid tx)", () => {
    // just send funds to a new wallet, and try to send more than the funds from this new wallet
    const bobPassphrase = "bob pass phrase4";
    const bobAddress = Identities.Address.fromPassphrase(bobPassphrase, 23);
    const bobInitialFund = 100 * 1e8; // 100 ARK

    const randomAddress = Identities.Address.fromPassphrase(secrets[1], 23);

    it("should keep transactions in the pool if applying txs from block to the pool did not fail", async () => {
        const initialTxToBob = TransactionFactory.transfer(bobAddress, bobInitialFund)
            .withPassphrase(secrets[1])
            .createOne();

        await support.forge([initialTxToBob]);
        await delay(1000);

        // a valid tx to accept in the pool
        const bobTransfer = TransactionFactory.transfer(randomAddress, 100)
            .withPassphrase(bobPassphrase)
            .createOne();
        await expect(bobTransfer).toBeAccepted();
        await expect(bobTransfer).toBeUnconfirmed();

        // this one is invalid and will make acceptChainedBlock tx fail and AcceptBlockHandler fail to accept the block
        const bobTransfer2 = TransactionFactory.transfer(randomAddress, 33)
            .withPassphrase(bobPassphrase)
            .withNonce(Utils.BigNumber.ONE) // makes it okay when applied to the pool (bob has nonce 1)
            // but invalid when applied to db (bob has nonce 0)
            .createOne();
        await support.forge([bobTransfer2]);
        await delay(1000);

        await expect(bobTransfer).toBeUnconfirmed();
    });
});

describe("Pool transactions when acceptChainedBlock apply tx fails", () => {
    // When we fail to apply the transactions in a valid forged block to the pool
    // The transaction(s) that failed to apply should trigger reset existing transactions from sender in pool
    // (these existing transactions are probably outdated then)
    const bobPassphrase = "bob pass phrase5";
    const bobAddress = Identities.Address.fromPassphrase(bobPassphrase, 23);
    const bobInitialFund = 100 * 1e8; // 100 ARK

    const alicePassphrase = "alice pass phrase5";
    const aliceAddress = Identities.Address.fromPassphrase(alicePassphrase, 23);
    const aliceInitialFund = 100 * 1e8; // 100 ARK

    const randomAddress = Identities.Address.fromPassphrase(secrets[1], 23);

    it("should remove transactions from sender in the pool after acceptChainedBlock fails to apply transaction from sender from a block to the pool", async () => {
        const initialTxToBob = TransactionFactory.transfer(bobAddress, bobInitialFund)
            .withPassphrase(secrets[1])
            .createOne();
        const initialTxToAlice = TransactionFactory.transfer(aliceAddress, aliceInitialFund)
            .withPassphrase(secrets[2])
            .createOne();
        await support.forge([initialTxToBob, initialTxToAlice]);
        await delay(1000);

        // valid txs from Bob to accept in the pool - will be invalidated by forged block
        const bobTransfers = TransactionFactory.transfer(randomAddress, 100)
            .withPassphrase(bobPassphrase)
            .create(5);
        for (const bobTransfer of bobTransfers) {
            await expect(bobTransfer).toBeAccepted();
            await expect(bobTransfer).toBeUnconfirmed();
        }

        // a valid tx from Alice to accept in the pool - this one will still be valid after forged block
        const aliceTransfer = TransactionFactory.transfer(randomAddress, 200)
            .withPassphrase(alicePassphrase)
            .createOne();
        await expect(aliceTransfer).toBeAccepted();
        await expect(aliceTransfer).toBeUnconfirmed();

        // this one will make acceptChainedBlock fail to accept the tx from the block
        const bobInvalidatingTx = TransactionFactory.transfer(randomAddress, 200)
            .withPassphrase(bobPassphrase)
            .withNonce(Utils.BigNumber.ZERO)
            .createOne();
        await support.forge([bobInvalidatingTx]);
        await delay(1000);

        // forged tx from Bob invalidated pending ones from pool
        for (const bobTransfer of bobTransfers) {
            await expect(bobTransfer).not.toBeUnconfirmed();
        }
        await expect(aliceTransfer).toBeUnconfirmed(); // alice tx was not invalidated by forged txs, so still in pool
    });
});
