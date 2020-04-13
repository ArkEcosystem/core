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

    @Container.inject(Container.Identifiers.BlockchainService)
    private readonly blockchain!: Contracts.Blockchain.Blockchain;

    public async findOneByCriteria(
        criteria: Contracts.Database.OrBlockCriteria,
    ): Promise<Interfaces.IBlockData | undefined> {
        const expression = await this.blockFilter.getCriteriaExpression(criteria);
        const model = await this.blockRepository.findOneByExpression(expression);
        return model ? this.convertModel(model) : undefined;
    }

    public async findOneByIdOrHeight(idOrHeight: string): Promise<Interfaces.IBlockData | undefined> {
        const lastHeight = this.blockchain.getLastHeight();

        if (parseFloat(idOrHeight) <= lastHeight) {
            const expression = await this.blockFilter.getCriteriaExpression({ height: parseFloat(idOrHeight) });
            const model = await this.blockRepository.findOneByExpression(expression);
            return model ? this.convertModel(model) : undefined;
        } else {
            const expression = await this.blockFilter.getCriteriaExpression({ id: idOrHeight });
            const model = await this.blockRepository.findOneByExpression(expression);
            return model ? this.convertModel(model) : undefined;
        }
    }

    public async findManyByCriteria(criteria: Contracts.Database.OrBlockCriteria): Promise<Interfaces.IBlockData[]> {
        const expression = await this.blockFilter.getCriteriaExpression(criteria);
        const models = await this.blockRepository.findManyByExpression(expression);
        return this.convertModels(models);
    }

    public async listByCriteria(
        criteria: Contracts.Database.OrBlockCriteria,
        order: Contracts.Database.ListOrder,
        page: Contracts.Database.ListPage,
    ): Promise<Contracts.Database.ListResult<Interfaces.IBlockData>> {
        const expression = await this.blockFilter.getCriteriaExpression(criteria);
        const listResult = await this.blockRepository.listByExpression(expression, order, page);
        return this.convertListResult(listResult);
    }

    public async listByGeneratorPublicKey(
        generatorPublicKey: string,
        order: Contracts.Database.ListOrder,
        page: Contracts.Database.ListPage,
    ): Promise<Contracts.Database.ListResult<Interfaces.IBlockData>> {
        const expression = await this.blockFilter.getCriteriaExpression({ generatorPublicKey });
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
        listResult: Contracts.Database.ListResult<Block>,
    ): Contracts.Database.ListResult<Interfaces.IBlockData> {
        return {
            rows: this.convertModels(listResult.rows),
            count: listResult.count,
            countIsEstimate: listResult.countIsEstimate,
        };
    }
}
