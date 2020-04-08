import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

import { Block } from "../models/block";
import { BlockRepository } from "../repositories";

@Container.injectable()
export class BlockService implements Contracts.Database.BlockService {
    @Container.inject(Container.Identifiers.BlockRepository)
    private readonly blockRepository!: BlockRepository;

    @Container.inject(Container.Identifiers.DatabaseBlockFilter)
    private readonly blockFilter!: Contracts.Database.BlockFilter;

    public async search(
        criteria: Contracts.Database.OrBlockCriteria,
        order?: string,
        page?: Contracts.Database.SearchPage,
    ): Promise<Contracts.Database.SearchResult<Interfaces.IBlockData>> {
        const searchOrder = order ? Contracts.Database.SearchOrder.parse<Block>(order) : undefined;
        return this.blockRepository.search(await this.blockFilter.getExpression(criteria), searchOrder, page);
    }
}
