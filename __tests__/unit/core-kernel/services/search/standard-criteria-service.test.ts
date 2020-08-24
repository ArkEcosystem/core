import { Container } from "@arkecosystem/core-kernel";
import { StandardCriteriaService } from "@arkecosystem/core-kernel/src/services/search/standard-criteria-service";

const container = new Container.Container();

describe("StandardCriteriaService.testStandardCriterias", () => {
    it("should filter out deeply nested range criteria", () => {
        const value = {
            attributes: { rank: 5 },
        };

        const criteria = {
            attributes: {
                rank: [
                    { from: 1, to: 2 },
                    { from: 10, to: 12 },
                ],
            },
        };

        const standardCriteriaService = container.resolve(StandardCriteriaService);
        const result = standardCriteriaService.testStandardCriterias(value, criteria);

        expect(result).toBe(false);
    });
});
