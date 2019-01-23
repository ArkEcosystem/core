import "jest-extended";

import { vote } from "../../../../../src/validation/rules/models/transactions/vote";

import { client } from "../../../../../src/client";
import { TransactionTypes } from "../../../../../src/constants";
import {
    amountZeroTests,
    blockidTests,
    confirmationsTests,
    feeTests,
    idTests,
    recipientIdRequiredTests,
    senderIdTests,
    senderPublicKeyTests,
    signaturesTests,
    signatureTests,
    timestampTests,
} from "./common";

// the base delegate registration we will use all along
const validVote = client
    .getBuilder()
    .vote()
    .votesAsset(["+02bcfa0951a92e7876db1fb71996a853b57f996972ed059a950d910f7d541706c9"])
    .fee(50000000)
    .sign("dummy passphrase")
    .getStruct();

const validationPassed = changedField => vote(Object.assign({}, validVote, changedField)).passes;

const validationPassedRemovingOneField = removedField => {
    const validVoteCopy = JSON.parse(JSON.stringify(validVote));
    delete validVoteCopy[removedField];
    return vote(validVoteCopy).passes;
};

describe("validate - id", () => {
    idTests(vote, validVote);
});

describe("validate - blockid", () => {
    blockidTests(vote, validVote);
});

describe("validate - type", () => {
    const typeValidationPassed = type => validationPassed({ type });
    it("should validate a delegate registration type", () => {
        expect(typeValidationPassed(TransactionTypes.Vote)).toBeTrue();
    });

    it("should validate if field is missing", () => {
        expect(validationPassedRemovingOneField("type")).toBeTrue();
    });

    it("shouldn't validate any other type", () => {
        for (let type = 0; type < 10; type++) {
            if (type === TransactionTypes.Vote) {
                continue;
            }
            expect(typeValidationPassed(type)).toBeFalse();
        }
    });
});

describe("validate - timestamp", () => {
    timestampTests(vote, validVote);
});

describe("validate - amount", () => {
    amountZeroTests(vote, validVote);
});

describe("validate - fee", () => {
    feeTests(vote, validVote);
});

describe("validate - senderId", () => {
    senderIdTests(vote, validVote);
});

describe("validate - recipientId", () => {
    recipientIdRequiredTests(vote, validVote);
});

describe("validate - senderPublicKey", () => {
    senderPublicKeyTests(vote, validVote);
});

describe("validate - signature", () => {
    signatureTests(vote, validVote);
});

describe("validate - signatures", () => {
    signaturesTests(vote, validVote);
});

describe("validate - asset > votes", () => {
    const votesValidationPassed = votes => {
        const asset = JSON.parse(JSON.stringify(validVote.asset));
        asset.votes = votes;
        return validationPassed({ asset });
    };
    it("should validate an array with 67 character string [+publicKey]", () => {
        expect(
            votesValidationPassed(["+02bcfa0951a92e7876db1fb71996a853b57f996972ed059a950d910f7d541706c9"]),
        ).toBeTrue();
    });

    it("shouldn't validate an array with a string not 67 characters long", () => {
        expect(
            votesValidationPassed(["+002bcfa0951a92e7876db1fb71996a853b57f996972ed059a950d910f7d541706c9"]),
        ).toBeFalse();
        expect(
            votesValidationPassed(["+2bcfa0951a92e7876db1fb71996a853b57f996972ed059a950d910f7d541706c9"]),
        ).toBeFalse();
    });

    it("shouldn't validate an array of length !== 1", () => {
        expect(
            votesValidationPassed([
                "+02bcfa0951a92e7876db1fb71996a853b57f996972ed059a950d910f7d541706c9",
                "+03bcfa0951a92e7876db1fb71996a853b57f996972ed059a950d910f7d541706c9",
            ]),
        ).toBeFalse();
        expect(votesValidationPassed([])).toBeFalse();
    });

    it("shouldn't validate a string", () => {
        expect(
            votesValidationPassed("+02bcfa0951a92e7876db1fb71996a853b57f996972ed059a950d910f7d541706c9"),
        ).toBeFalse();
    });

    it("shouldn't validate if field is missing", () => {
        const asset = JSON.parse(JSON.stringify(validVote.asset));
        delete asset.votes;
        expect(validationPassed({ asset })).toBeFalse();
    });
});

describe("validate - asset", () => {
    const assetValidationPassed = asset => validationPassed({ asset });
    it("shouldn't validate a string", () => {
        expect(assetValidationPassed("asset")).toBeFalse();
    });

    it("shouldn't validate if asset is missing", () => {
        expect(validationPassedRemovingOneField("asset")).toBeFalse();
    });
});

describe("validate - confirmations", () => {
    confirmationsTests(vote, validVote);
});
