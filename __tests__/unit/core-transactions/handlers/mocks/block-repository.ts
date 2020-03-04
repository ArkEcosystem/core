let mockBlock: any | null;

export const setMockBlock = (block: any | null) => {
    mockBlock = block;
};

export const blockRepository = {
    getDelegatesForgedBlocks: async () => {
        return mockBlock ? [mockBlock] : [];
    },
    getLastForgedBlocks: async () => {
        return mockBlock ? [mockBlock] : [];
    },
};
