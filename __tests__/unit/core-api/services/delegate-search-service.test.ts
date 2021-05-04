import { DelegateSearchService } from "@packages/core-api/src/services/delegate-search-service";
import { Container, Services, Utils as AppUtils } from "@packages/core-kernel";
import { Wallets } from "@packages/core-state";

import { Delegates } from "./__fixtures__";

const walletRepository = {
    findByAddress: jest.fn(),
    allByUsername: jest.fn(),
};

const standardCriteriaService = {
    testStandardCriterias: jest.fn(),
};

const container = new Container.Container();
container.bind(Container.Identifiers.WalletRepository).toConstantValue(walletRepository);
container.bind(Container.Identifiers.StandardCriteriaService).toConstantValue(standardCriteriaService);
container.bind(Container.Identifiers.PaginationService).to(Services.Search.PaginationService);

const delegateSearchService = container.resolve(DelegateSearchService);

let attributeMap;

beforeEach(() => {
    const attributeSet = new Services.Attributes.AttributeSet();
    attributeSet.set("delegate");
    attributeSet.set("delegate.approval");
    attributeSet.set("delegate.forgedFees");
    attributeSet.set("delegate.forgedRewards");
    attributeSet.set("delegate.forgedTotal");
    attributeSet.set("delegate.lastBlock");
    attributeSet.set("delegate.producedBlocks");
    attributeSet.set("delegate.rank");
    attributeSet.set("delegate.round");
    attributeSet.set("delegate.username");
    attributeSet.set("delegate.voteBalance");

    attributeMap = new Services.Attributes.AttributeMap(attributeSet);
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("DelegateSearchService", () => {
    describe("getDelegate", () => {
        it("should return delegate by wallet address", () => {
            const delegate = new Wallets.Wallet("ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo", attributeMap);
            delegate.setPublicKey("03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37");

            delegate.setAttribute("delegate", {
                username: "delegate_username",
                voteBalance: AppUtils.BigNumber.ONE,
                rank: 12,
                producedBlocks: AppUtils.BigNumber.ZERO,
                forgedFees: AppUtils.BigNumber.ZERO,
                forgedRewards: AppUtils.BigNumber.ZERO,
            });

            walletRepository.findByAddress = jest.fn().mockReturnValue(delegate);

            expect(delegateSearchService.getDelegate("ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo")).toEqual(
                Delegates.delegateResource,
            );
        });

        it("should return delegate by wallet address with produced blocks", () => {
            const delegate = new Wallets.Wallet("ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo", attributeMap);
            delegate.setPublicKey("03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37");

            delegate.setAttribute("delegate", {
                username: "delegate_username",
                voteBalance: AppUtils.BigNumber.ONE,
                rank: 12,
                producedBlocks: AppUtils.BigNumber.ONE,
                lastBlock: {
                    id: "17558410102375926929",
                    height: AppUtils.BigNumber.make(22),
                    timestamp: 111180032,
                },
                forgedFees: AppUtils.BigNumber.ZERO,
                forgedRewards: AppUtils.BigNumber.ZERO,
            });

            walletRepository.findByAddress = jest.fn().mockReturnValue(delegate);

            expect(delegateSearchService.getDelegate("ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo")).toEqual(
                Delegates.delegateResourceWithLastBlock,
            );
        });

        it("should return undefined if walled is not delegate", () => {
            const delegate = new Wallets.Wallet("ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo", attributeMap);
            delegate.setPublicKey("03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37");

            walletRepository.findByAddress = jest.fn().mockReturnValue(delegate);

            expect(delegateSearchService.getDelegate("ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo")).toBeUndefined();
        });
    });

    describe("getDelegatesPage", () => {
        it("should return results with delegate", () => {
            const delegate = new Wallets.Wallet("ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo", attributeMap);
            delegate.setPublicKey("03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37");

            delegate.setAttribute("delegate", {
                username: "delegate_username",
                voteBalance: AppUtils.BigNumber.ONE,
                rank: 12,
                producedBlocks: AppUtils.BigNumber.ZERO,
                forgedFees: AppUtils.BigNumber.ZERO,
                forgedRewards: AppUtils.BigNumber.ZERO,
            });

            walletRepository.allByUsername.mockReturnValue([delegate]);
            standardCriteriaService.testStandardCriterias.mockReturnValue(true);

            const result = delegateSearchService.getDelegatesPage(
                {
                    offset: 0,
                    limit: 100,
                },
                [],
                [],
            );

            expect(result.results).toEqual([Delegates.delegateResource]);

            expect(walletRepository.allByUsername).toHaveBeenCalled();
            expect(standardCriteriaService.testStandardCriterias).toHaveBeenCalled();
        });

        it("should return empty array if all tested criterias are false", () => {
            const delegate = new Wallets.Wallet("ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo", attributeMap);
            delegate.setPublicKey("03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37");

            delegate.setAttribute("delegate", {
                username: "delegate_username",
                voteBalance: AppUtils.BigNumber.ONE,
                rank: 12,
                producedBlocks: AppUtils.BigNumber.ZERO,
                forgedFees: AppUtils.BigNumber.ZERO,
                forgedRewards: AppUtils.BigNumber.ZERO,
            });

            walletRepository.allByUsername.mockReturnValue([delegate]);
            standardCriteriaService.testStandardCriterias.mockReturnValue(false);

            const result = delegateSearchService.getDelegatesPage(
                {
                    offset: 0,
                    limit: 100,
                },
                [],
                [],
            );

            expect(result.results).toEqual([]);

            expect(walletRepository.allByUsername).toHaveBeenCalled();
            expect(standardCriteriaService.testStandardCriterias).toHaveBeenCalled();
        });
    });
});
