import { RoundRepository } from "@arkecosystem/core-database/src/repositories";
import { Round } from "@arkecosystem/core-database/src/models";

let mockRounds: Partial<Round>[];

export const setRounds = (rounds: Partial<Round>[]) => {
    mockRounds = rounds
};

export const roundRepository: Partial<RoundRepository> = {
    findById: async (id: any): Promise<Round[]> => {
        return mockRounds as Round[];
    }
};
