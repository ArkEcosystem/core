import "jest-extended";

import { TransactionTypeError } from "@arkecosystem/crypto/src/errors";
import { Keys } from "@arkecosystem/crypto/src/identities";
import { ITransaction } from "@arkecosystem/crypto/src/interfaces";
import { configManager } from "@arkecosystem/crypto/src/managers";
import { BuilderFactory } from "@arkecosystem/crypto/src/transactions";

export const createRandomTx = type => {
    let transaction: ITransaction;

    switch (type) {
        case 0: {
            // transfer
            transaction = BuilderFactory.transfer()
                .recipientId("AJWRd23HNEhPLkK1ymMnwnDBX2a7QBZqff")
                .amount("10000000000000")
                .vendorField(Math.random().toString(36))
                .sign(Math.random().toString(36))
                .secondSign(Math.random().toString(36))
                .build();
            break;
        }

        case 1: {
            // second signature
            transaction = BuilderFactory.secondSignature()
                .signatureAsset(Math.random().toString(36))
                .sign(Math.random().toString(36))
                .build();
            break;
        }

        case 2: {
            // delegate registration
            transaction = BuilderFactory.delegateRegistration()
                .usernameAsset("dummydelegate")
                .sign(Math.random().toString(36))
                .build();
            break;
        }

        case 3: {
            // vote registration
            transaction = BuilderFactory.vote()
                .votesAsset(["+036928c98ee53a1f52ed01dd87db10ffe1980eb47cd7c0a7d688321f47b5d7d760"])
                .sign(Math.random().toString(36))
                .build();
            break;
        }

        case 4: {
            const aip11 = configManager.getMilestone().aip11;
            configManager.getMilestone().aip11 = true;

            const passphrases = [Math.random().toString(36), Math.random().toString(36), Math.random().toString(36)];

            const participants = passphrases.map(passphrase => {
                return Keys.fromPassphrase(passphrase);
            });

            const min = Math.min(1, participants.length);
            const max = Math.max(1, participants.length);

            const multiSigRegistration = BuilderFactory.multiSignature().min(
                Math.floor(Math.random() * (max - min)) + min,
            );

            for (const participant of participants) {
                multiSigRegistration.participant(participant.publicKey);
            }

            multiSigRegistration.senderPublicKey(participants[0].publicKey);

            for (const passphrase of passphrases) {
                multiSigRegistration.multiSign(passphrase, passphrases.indexOf(passphrase));
            }

            transaction = multiSigRegistration.sign(passphrases[0]).build();

            configManager.getMilestone().aip11 = aip11;
            break;
        }
        default: {
            throw new TransactionTypeError(type);
        }
    }

    return transaction;
};
