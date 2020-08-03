import { Container, Contracts, Providers, Utils as AppUtils } from "@arkecosystem/core-kernel";

import { BlockCriteria } from "./block-resource";

const {
    getCriteriasExpression,
    getObjectCriteriaExpression,
    getEqualExpression,
    getNumericExpression,
} = AppUtils.Search;

@Container.injectable()
export class DbBlockService {
    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-api")
    protected readonly apiConfiguration!: Providers.PluginConfiguration;

    @Container.inject(Container.Identifiers.DatabaseBlockRepository)
    private readonly blockRepository!: Contracts.Database.BlockRepository;

    public getBlock(...criterias: BlockCriteria[]): Promise<Contracts.Database.BlockModel | undefined> {
        return this.blockRepository.getBlock(this.getCriteriasExpression(criterias));
    }

    public getBlocks(
        ordering: Contracts.Search.Ordering,
        ...criterias: BlockCriteria[]
    ): Promise<Contracts.Database.BlockModel[]> {
        return this.blockRepository.getBlocks(ordering, this.getCriteriasExpression(criterias));
    }

    public getBlocksStream(
        ordering: Contracts.Search.Ordering,
        ...criterias: BlockCriteria[]
    ): AsyncIterable<Contracts.Database.BlockModel> {
        return this.blockRepository.getBlocksStream(ordering, this.getCriteriasExpression(criterias));
    }

    public getBlocksPage(
        pagination: Contracts.Search.Pagination,
        ordering: Contracts.Search.Ordering,
        ...criterias: BlockCriteria[]
    ): Promise<Contracts.Database.BlocksPage> {
        const estimateTotalCount = this.apiConfiguration.getOptional<boolean>("options.estimateTotalCount", true);
        const options = { estimateTotalCount };

        return this.blockRepository.getBlocksPage(
            options,
            pagination,
            ordering,
            this.getCriteriasExpression(criterias),
        );
    }

    private getCriteriasExpression(criterias: BlockCriteria[]): Contracts.Database.BlockExpression {
        return getCriteriasExpression(criterias, (criteria) => {
            return getObjectCriteriaExpression(criteria, (criteriaItem, property) => {
                switch (property) {
                    case "id":
                    case "version":
                    case "previousBlock":
                    case "payloadHash":
                    case "generatorPublicKey":
                    case "blockSignature":
                        return getEqualExpression(property, criteriaItem[property]);
                    case "timestamp":
                    case "height":
                    case "numberOfTransactions":
                    case "totalAmount":
                    case "totalFee":
                    case "reward":
                    case "payloadLength":
                        return getNumericExpression(property, criteriaItem[property]);
                }
            });
        });
    }
}
