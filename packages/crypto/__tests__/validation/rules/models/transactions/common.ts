import "jest-extended";

import { Bignum } from "../../../../../src";

const passedRemovingField = (validator, transaction, field) => {
    const transactionCopy = JSON.parse(JSON.stringify(transaction));
    delete transactionCopy[field];
    return validator(transactionCopy).passes;
};

export const idTests = (validator, baseTransaction) => {
    const passed = id => validator(Object.assign({}, baseTransaction, { id })).passes;

    it("should validate an alphanum string", () => {
        expect(passed("abc123")).toBeTrue();
    });

    it("shouldn't validate a number", () => {
        expect(passed(123456)).toBeFalse();
    });

    it("shouldn't validate a non-alphanum string", () => {
        expect(passed("abc_123")).toBeFalse();
    });

    it("shouldn't validate if field is missing", () => {
        expect(passedRemovingField(validator, baseTransaction, "id")).toBeFalse();
    });
};

export const blockidTests = (validator, baseTransaction) => {
    const passed = blockid => validator(Object.assign({}, baseTransaction, { blockid })).passes;

    it("should validate a numerical string", () => {
        expect(passed("145698")).toBeTrue();
    });

    it("should validate a number", () => {
        expect(passed(148765)).toBeTrue();
    });

    it("should validate if field is missing", () => {
        expect(passedRemovingField(validator, baseTransaction, "blockid")).toBeTrue();
    });

    it("shouldn't validate a non-numerical string", () => {
        expect(passed("74456a")).toBeFalse();
    });
};

export const timestampTests = (validator, baseTransaction) => {
    const passed = timestamp => validator(Object.assign({}, baseTransaction, { timestamp })).passes;

    it("should validate a positive integer", () => {
        expect(passed(9456)).toBeTrue();
    });

    it("shouldn't validate a string", () => {
        expect(passed("9456a")).toBeFalse();
    });

    it("shouldn't validate a negative integer", () => {
        expect(passed(-22)).toBeFalse();
    });

    it("shouldn't validate a decimal", () => {
        expect(passed(45.99)).toBeFalse();
    });

    it("shouldn't validate if field is missing", () => {
        expect(passedRemovingField(validator, baseTransaction, "timestamp")).toBeFalse();
    });
};

export const amountZeroTests = (validator, baseTransaction) => {
    // tests for amount with only zero as authorized value
    const passed = amount => validator(Object.assign({}, baseTransaction, { amount })).passes;

    it("should validate a zero Bignum", () => {
        expect(passed(new Bignum(0))).toBeTrue();
    });

    it("should validate a zero", () => {
        expect(passed(0)).toBeTrue();
    });

    it("shouldn't validate any Bignum different from zero", () => {
        // integer, decimal, negative...
        expect(passed(new Bignum(1))).toBeFalse();
        expect(passed(new Bignum(0.1))).toBeFalse();
        expect(passed(new Bignum(-5))).toBeFalse();
    });

    it("shouldn't validate any number different from zero", () => {
        // integer, decimal, negative...
        expect(passed(1)).toBeFalse();
        expect(passed(0.3)).toBeFalse();
        expect(passed(-5)).toBeFalse();
        expect(passed("1")).toBeFalse();
    });

    it("shouldn't validate a string", () => {
        expect(passed("11a")).toBeFalse();
    });

    it("shouldn't validate if field is missing", () => {
        expect(passedRemovingField(validator, baseTransaction, "amount")).toBeFalse();
    });
};

export const amountPositiveTests = (validator, baseTransaction) => {
    // tests for amount with only zero as authorized value
    const passed = amount => validator(Object.assign({}, baseTransaction, { amount })).passes;

    it("should validate any positive Bignum", () => {
        expect(passed(new Bignum(0))).toBeTrue();
        expect(passed(new Bignum(7))).toBeTrue();
        expect(passed(new Bignum(1555647))).toBeTrue();
    });

    it("should validate any positive integer", () => {
        expect(passed(0)).toBeTrue();
        expect(passed(7)).toBeTrue();
        expect(passed(1555647)).toBeTrue();
    });

    it("shouldn't validate a negative or decimal Bignum", () => {
        expect(passed(new Bignum(0.1))).toBeFalse();
        expect(passed(new Bignum(-5))).toBeFalse();
    });

    it("shouldn't validate a negative or decimal number", () => {
        expect(passed(0.3)).toBeFalse();
        expect(passed(-5)).toBeFalse();
    });

    it("shouldn't validate a string", () => {
        expect(passed("11a")).toBeFalse();
    });

    it("shouldn't validate if field is missing", () => {
        expect(passedRemovingField(validator, baseTransaction, "amount")).toBeFalse();
    });
};

export const feeTests = (validator, baseTransaction) => {
    const passed = fee => validator(Object.assign({}, baseTransaction, { fee })).passes;

    it("should validate a Bignum integer", () => {
        expect(passed(new Bignum(10))).toBeTrue();
    });

    it("should validate an integer", () => {
        expect(passed(10)).toBeTrue();
    });

    it("shouldn't validate a Bignum zero", () => {
        expect(passed(new Bignum(0))).toBeFalse();
    });

    it("shouldn't validate a zero", () => {
        expect(passed(0)).toBeFalse();
    });

    it("shouldn't validate a negative Bignum", () => {
        expect(passed(new Bignum(-10))).toBeFalse();
    });

    it("shouldn't validate a negative integer", () => {
        expect(passed(-10)).toBeFalse();
    });

    it("shouldn't validate a decimal Bignum", () => {
        expect(passed(new Bignum(5.5))).toBeFalse();
    });

    it("shouldn't validate a decimal number", () => {
        expect(passed(5.5)).toBeFalse();
    });

    it("shouldn't validate if field is missing", () => {
        expect(passedRemovingField(validator, baseTransaction, "fee")).toBeFalse();
    });
};

export const senderIdTests = (validator, baseTransaction) => {
    const passed = senderId => validator(Object.assign({}, baseTransaction, { senderId })).passes;

    it("should validate a 34 characters alphanum string", () => {
        expect(passed("checkThisAwesome34charsAlphaNumStr")).toBeTrue();
    });

    it("should validate if field is missing", () => {
        expect(passedRemovingField(validator, baseTransaction, "senderId")).toBeTrue();
    });

    it("shouldn't validate an alphanum string different than 34 characters", () => {
        expect(passed("thisAintNo34CharString")).toBeFalse();
    });

    it("shouldn't validate a non-alphanum 34 character string", () => {
        expect(passed("thisIsA34charString_ButNotAlphaNum")).toBeFalse();
    });
};

export const recipientIdRequiredTests = (validator, baseTransaction) => {
    const passed = recipientId => validator(Object.assign({}, baseTransaction, { recipientId })).passes;

    it("should validate a 34 characters alphanum string", () => {
        expect(passed("checkThisAwesome34charsAlphaNumStr")).toBeTrue();
    });

    it("shouldn't validate if field is missing", () => {
        expect(passedRemovingField(validator, baseTransaction, "recipientId")).toBeFalse();
    });

    it("shouldn't validate an alphanum string different than 34 characters", () => {
        expect(passed("thisAintNo34CharString")).toBeFalse();
    });

    it("shouldn't validate a non-alphanum 34 character string", () => {
        expect(passed("thisIsA34charString_ButNotAlphaNum")).toBeFalse();
    });
};

export const senderPublicKeyTests = (validator, baseTransaction) => {
    const passed = senderPublicKey => validator(Object.assign({}, baseTransaction, { senderPublicKey })).passes;

    it("should validate a 66 characters hex string", () => {
        expect(passed("F00CB4255FE6E0000000000000000000F00CB4255FE6E000000000000000000000")).toBeTrue();
    });

    it("shouldn't validate if field is missing", () => {
        expect(passedRemovingField(validator, baseTransaction, "senderPublicKey")).toBeFalse();
    });

    it("shouldn't validate an hex string different than 66 characters", () => {
        expect(passed("F00CB4255FE6E000000000000000000F00CB4255FE6E000000000000000000000")).toBeFalse();
    });

    it("shouldn't validate a non-hex 66 character string", () => {
        expect(passed("F00CB4255FE6E0000000000000000000F00CB4255FE6E00000000000000000000g")).toBeFalse();
    });
};

export const signatureTests = (validator, baseTransaction) => {
    const passed = signature => validator(Object.assign({}, baseTransaction, { signature })).passes;

    it("should validate an alphanum string", () => {
        expect(passed("th1s1s4nAlphaNumStr")).toBeTrue();
    });

    it("shouldn't validate a number", () => {
        expect(passed(123)).toBeFalse();
    });

    it("shouldn't validate a non-alphanum string", () => {
        expect(passed("th1s1s_N0t_4nAlphaNumStr")).toBeFalse();
    });

    it("shouldn't validate if field is missing", () => {
        expect(passedRemovingField(validator, baseTransaction, "signature")).toBeFalse();
    });
};

export const signaturesTests = (validator, baseTransaction) => {
    const passed = signatures => validator(Object.assign({}, baseTransaction, { signatures })).passes;

    it("should validate an array", () => {
        expect(passed([])).toBeTrue();
    });

    it("should validate if field is missing", () => {
        expect(passedRemovingField(validator, baseTransaction, "signatures")).toBeTrue();
    });

    it("shouldn't validate a string", () => {
        expect(passed("yo")).toBeFalse();
    });

    it("shouldn't validate an object", () => {
        expect(passed({ yo: "yo" })).toBeFalse();
    });
};

export const secondSignatureTests = (validator, baseTransaction) => {
    const passed = secondSignature => validator(Object.assign({}, baseTransaction, { secondSignature })).passes;

    it("should validate an alphanum string", () => {
        expect(passed("th1s1s4nAlphaNumStr")).toBeTrue();
    });

    it("should validate if field is missing", () => {
        expect(passedRemovingField(validator, baseTransaction, "secondSignature")).toBeTrue();
    });

    it("shouldn't validate a number", () => {
        expect(passed(9854632)).toBeFalse();
    });

    it("shouldn't validate a non-alphanum string", () => {
        expect(passed("th1s1s_not_4nAlphaNumStr")).toBeFalse();
    });
};

export const vendorFieldTests = (validator, baseTransaction) => {
    const passed = vendorField => validator(Object.assign({}, baseTransaction, { vendorField })).passes;

    it("should validate an utf8 string less than 64 characters", () => {
        expect(passed("this is a string with special chars ù$%éá!@)-_ and it's ok")).toBeTrue();
    });

    it("should validate if field is missing", () => {
        expect(passedRemovingField(validator, baseTransaction, "vendorField")).toBeTrue();
    });

    it("should not validate an empty string", () => {
        expect(passed("")).toBeFalse();
    });

    it("shouldn't validate a string with more than 64 characters", () => {
        expect(passed("this is an utf8 string with special chars ù$%éá!@)-_ and too long")).toBeFalse();
    });
};

export const confirmationsTests = (validator, baseTransaction) => {
    const passed = confirmations => validator(Object.assign({}, baseTransaction, { confirmations })).passes;

    it("should validate a positive integer", () => {
        expect(passed(8)).toBeTrue();
    });

    it("should validate if field is missing", () => {
        expect(passedRemovingField(validator, baseTransaction, "confirmations")).toBeTrue();
    });

    it("shouldn't validate a string", () => {
        expect(passed("8a")).toBeFalse();
    });

    it("shouldn't validate a negative integer", () => {
        expect(passed(-3)).toBeFalse();
    });

    it("shouldn't validate a decimal", () => {
        expect(passed(8.5)).toBeFalse();
    });
};
