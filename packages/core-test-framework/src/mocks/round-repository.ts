import { Round } from "@arkecosystem/core-database/src/models";
import { RoundRepository } from "@arkecosystem/core-database/src/repositories";

let mockRounds: Partial<Round>[] = [];

export const setRounds = (rounds: Partial<Round>[]) => {
    mockRounds = rounds;
};

class RoundRepositoryMock implements Partial<RoundRepository> {
    public async findById(id: string): Promise<Round[]> {
        return mockRounds as Round[];
    }
}

export const instance = new RoundRepositoryMock();
