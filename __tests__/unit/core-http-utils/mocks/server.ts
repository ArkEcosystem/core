jest.mock("@hapi/hapi", () => {
    return {
        Hapi: {
            Server: () => {
                return {
                    start: jest.fn(),
                    ext: jest.fn(),
                };
            },
        },
    };
});
