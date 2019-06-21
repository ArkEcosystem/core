jest.mock("@arkecosystem/crypto", () => {
    return {
        Validation: {
            validator: {
                validate: jest.fn(),
                getInstance: jest.fn(),
            },
        },
        // getInstance: jest.fn()
    };
});
