import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

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
        return this.blockRepository.findOneByExpression(expression);
    }

    public async findOneByIdOrHeight(idOrHeight: string): Promise<Interfaces.IBlockData | undefined> {
        const lastHeight = this.blockchain.getLastHeight();

        if (parseFloat(idOrHeight) <= lastHeight) {
            const expression = await this.blockFilter.getCriteriaExpression({ height: parseFloat(idOrHeight) });
            return this.blockRepository.findOneByExpression(expression);
        } else {
            const expression = await this.blockFilter.getCriteriaExpression({ id: idOrHeight });
            return this.blockRepository.findOneByExpression(expression);
        }
    }

    public async findManyByCriteria(criteria: Contracts.Database.OrBlockCriteria): Promise<Interfaces.IBlockData[]> {
        const expression = await this.blockFilter.getCriteriaExpression(criteria);
        return this.blockRepository.findManyByExpression(expression);
    }

    public async listByCriteria(
        criteria: Contracts.Database.OrBlockCriteria,
        order: Contracts.Database.ListOrder,
        page: Contracts.Database.ListPage,
    ): Promise<Contracts.Database.ListResult<Interfaces.IBlockData>> {
        const expression = await this.blockFilter.getCriteriaExpression(criteria);
        return this.blockRepository.listByExpression(expression, order, page);
    }

    public async listByGeneratorPublicKey(
        generatorPublicKey: string,
        order: Contracts.Database.ListOrder,
        page: Contracts.Database.ListPage,
    ): Promise<Contracts.Database.ListResult<Interfaces.IBlockData>> {
        const expression = await this.blockFilter.getCriteriaExpression({ generatorPublicKey });
        return this.blockRepository.listByExpression(expression, order, page);
    }
}
