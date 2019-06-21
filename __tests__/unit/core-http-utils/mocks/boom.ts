jest.mock("@hapi/boom", () => {
    return {
        Boom: {
            badData: jest.fn(),
        },
    };
});
