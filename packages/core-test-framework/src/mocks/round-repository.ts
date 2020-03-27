import { RoundRepository } from "@arkecosystem/core-database/src/repositories";
import { Round } from "@arkecosystem/core-database/src/models";

let mockRounds: Partial<Round>[] = [];

export const setRounds = (rounds: Partial<Round>[]) => {
    mockRounds = rounds;
};

class RoundRepositoryMock implements Partial<RoundRepository> {
    async findById(id: string): Promise<Round[]> {
        return mockRounds as Round[];
    }
}

export const instance = new RoundRepositoryMock();
