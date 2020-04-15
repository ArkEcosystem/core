import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

import { Block } from "./models/block";
import { BlockRepository } from "./repositories";

@Container.injectable()
export class BlockHistoryService implements Contracts.Shared.BlockHistoryService {
    @Container.inject(Container.Identifiers.DatabaseBlockRepository)
    private readonly blockRepository!: BlockRepository;

    @Container.inject(Container.Identifiers.DatabaseBlockFilter)
    private readonly blockFilter!: Contracts.Database.BlockFilter;

    public async findOneByCriteria(
        ...criteria: Contracts.Shared.OrBlockCriteria[]
    ): Promise<Interfaces.IBlockData | undefined> {
        const expression = await this.blockFilter.getCriteriaExpression(...criteria);
        const model = await this.blockRepository.findOneByExpression(expression);
        return model ? this.convertModel(model) : undefined;
    }

    public async findManyByCriteria(...criteria: Contracts.Shared.OrBlockCriteria[]): Promise<Interfaces.IBlockData[]> {
        const expression = await this.blockFilter.getCriteriaExpression(...criteria);
        const models = await this.blockRepository.findManyByExpression(expression);
        return this.convertModels(models);
    }

    public async listByCriteria(
        page: Contracts.Shared.ListingPage,
        order: Contracts.Shared.ListingOrder,
        ...criteria: Contracts.Shared.OrBlockCriteria[]
    ): Promise<Contracts.Shared.ListingResult<Interfaces.IBlockData>> {
        const expression = await this.blockFilter.getCriteriaExpression(...criteria);
        const listResult = await this.blockRepository.listByExpression(expression, order, page);
        return this.convertListResult(listResult);
    }

    private convertModel(model: Block): Interfaces.IBlockData {
        return model; // TODO: check
    }

    private convertModels(models: Block[]): Interfaces.IBlockData[] {
        return models.map((m) => this.convertModel(m));
    }

    private convertListResult(
        listResult: Contracts.Shared.ListingResult<Block>,
    ): Contracts.Shared.ListingResult<Interfaces.IBlockData> {
        return {
            rows: this.convertModels(listResult.rows),
            count: listResult.count,
            countIsEstimate: listResult.countIsEstimate,
        };
    }
}
