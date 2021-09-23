"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const search_parameter_converter_1 = require("./utils/search-parameter-converter");
class BlocksBusinessRepository {
    constructor(databaseServiceProvider) {
        this.databaseServiceProvider = databaseServiceProvider;
    }
    async search(params = {}) {
        return this.databaseServiceProvider().connection.blocksRepository.search(this.parseSearchParams(params));
    }
    async findAllByGenerator(generatorPublicKey, paginate) {
        return this.search({ generatorPublicKey, ...paginate });
    }
    async findByHeight(height) {
        return this.databaseServiceProvider().connection.blocksRepository.findByHeight(height);
    }
    async findById(id) {
        return this.databaseServiceProvider().connection.blocksRepository.findById(id);
    }
    async findByIdOrHeight(idOrHeight) {
        try {
            const block = await this.findByHeight(idOrHeight);
            return block || this.findById(idOrHeight);
        }
        catch (error) {
            return this.findById(idOrHeight);
        }
    }
    async getBlockRewards() {
        return this.databaseServiceProvider().connection.blocksRepository.getBlockRewards();
    }
    async getLastForgedBlocks() {
        return this.databaseServiceProvider().connection.blocksRepository.getLastForgedBlocks();
    }
    async getDelegatesForgedBlocks() {
        return this.databaseServiceProvider().connection.blocksRepository.getDelegatesForgedBlocks();
    }
    parseSearchParams(params) {
        const blocksRepository = this.databaseServiceProvider().connection.blocksRepository;
        const searchParameters = new search_parameter_converter_1.SearchParameterConverter(blocksRepository.getModel()).convert(params);
        if (!searchParameters.orderBy.length) {
            searchParameters.orderBy.push({
                field: "height",
                direction: "desc",
            });
        }
        return searchParameters;
    }
}
exports.BlocksBusinessRepository = BlocksBusinessRepository;
//# sourceMappingURL=blocks-business-repository.js.map