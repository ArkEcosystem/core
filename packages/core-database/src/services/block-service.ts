import { Container, Contracts } from "@arkecosystem/core-kernel";

import { Block } from "../models/block";
import { BlockRepository } from "../repositories";

@Container.injectable()
export class BlockService implements Contracts.Database.BlockService {
    @Container.inject(Container.Identifiers.BlockRepository)
    private readonly blockRepository!: BlockRepository;

    @Container.inject(Container.Identifiers.DatabaseBlockFilter)
    private readonly blockFilter!: Contracts.Database.Filter<
        Contracts.Database.Block,
        Contracts.Database.BlockCriteria
    >;

    private readonly orBlockFilter = new Contracts.Database.OrFnFilter<Block, Contracts.Database.BlockCriteria>(c =>
        this.blockFilter.getExpression(c),
    );

    public async search(
        criteria: Contracts.Database.OrBlockCriteria,
        order?: string,
        page?: Contracts.Database.SearchPage,
    ): Promise<Contracts.Database.SearchResult<Block>> {
        const searchOrder = order ? Contracts.Database.SearchOrder.parse<Block>(order) : undefined;
        return this.blockRepository.search(await this.orBlockFilter.getExpression(criteria), searchOrder, page);
    }

    public async searchOne(criteria: Contracts.Database.BlockCriteria): Promise<Block> {
        const searchResults = await this.search(criteria, undefined, { offset: 0, limit: 1 });
        if (searchResults.count === 0) {
            throw new Contracts.Database.NotFoundError();
        }
        if (searchResults.count !== 1) {
            throw new Contracts.Database.ToManyRowsError();
        }
        return searchResults.rows[0];
    }
}
