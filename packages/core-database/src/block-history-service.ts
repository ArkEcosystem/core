import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

import { BlockRepository } from "./repositories";

@Container.injectable()
export class BlockHistoryService implements Contracts.Shared.BlockHistoryService {
    @Container.inject(Container.Identifiers.DatabaseBlockRepository)
    private readonly blockRepository!: BlockRepository;

    @Container.inject(Container.Identifiers.DatabaseBlockFilter)
    private readonly blockFilter!: Contracts.Database.BlockFilter;

    @Container.inject(Container.Identifiers.DatabaseBlockModelConverter)
    private readonly blockModelConverter!: Contracts.Database.BlockModelConverter;

    public async findOneByCriteria(
        criteria: Contracts.Shared.OrBlockCriteria,
    ): Promise<Interfaces.IBlockData | undefined> {
        const data = await this.findManyByCriteria(criteria);
        return data[0];
    }

    public async findManyByCriteria(criteria: Contracts.Shared.OrBlockCriteria): Promise<Interfaces.IBlockData[]> {
        const expression = await this.blockFilter.getExpression(criteria);
        const models = await this.blockRepository.findManyByExpression(expression);
        const data = this.blockModelConverter.getBlockData(models);
        return data;
    }

    public async listByCriteria(
        criteria: Contracts.Shared.OrBlockCriteria,
        order: Contracts.Search.ListOrder,
        page: Contracts.Search.ListPage,
        options?: Contracts.Search.ListOptions,
    ): Promise<Contracts.Search.ListResult<Interfaces.IBlockData>> {
        const expression = await this.blockFilter.getExpression(criteria);
        const modelListResult = await this.blockRepository.listByExpression(expression, order, page, options);
        const dataListResult = {
            ...modelListResult,
            rows: this.blockModelConverter.getBlockData(modelListResult.rows),
        };
        return dataListResult;
    }
}
