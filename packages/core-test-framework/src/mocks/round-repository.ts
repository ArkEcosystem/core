import { Models, Repositories } from "@arkecosystem/core-database";

let mockRounds: Partial<Models.Round>[] = [];

export const setRounds = (rounds: Partial<Models.Round>[]) => {
    mockRounds = rounds;
};

class RoundRepositoryMock implements Partial<Repositories.RoundRepository> {
    public async findById(id: string): Promise<Models.Round[]> {
        return mockRounds as Models.Round[];
    }
}

export const instance = new RoundRepositoryMock();
