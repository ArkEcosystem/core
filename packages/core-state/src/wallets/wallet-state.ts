import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Utils } from "@arkecosystem/crypto";

// todo: ioc
// todo: review the implementation
@Container.injectable()
export class WalletState {
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.WalletRepository)
    private walletRepository!: Contracts.State.WalletRepository;

    public loadActiveDelegateList(roundInfo: Contracts.Shared.RoundInfo): Contracts.State.Wallet[] {
        const delegates: Contracts.State.Wallet[] = this.buildDelegateRanking(roundInfo);
        const { maxDelegates } = roundInfo;

        if (delegates.length < maxDelegates) {
            throw new Error(
                `Expected to find ${maxDelegates} delegates but only found ${delegates.length}. ` +
                `This indicates an issue with the genesis block & delegates.`,
            );
        }

        this.app.log.debug(`Loaded ${delegates.length} active ${AppUtils.pluralize("delegate", delegates.length)}`);

        return delegates;
    }

    // Only called during integrity verification on boot.
    public buildVoteBalances(): void {
        for (const voter of this.walletRepository.allByPublicKey()) {
            if (voter.hasVoted()) {
                const delegate: Contracts.State.Wallet = this.walletRepository.findByPublicKey(
                    voter.getAttribute("vote"),
                );

                const voteBalance: Utils.BigNumber = delegate.getAttribute("delegate.voteBalance");

                if (voter.hasAttribute("htlc.lockedBalance")) {
                    delegate.setAttribute(
                        "delegate.voteBalance",
                        voteBalance.plus(voter.balance).plus(voter.getAttribute("htlc.lockedBalance")),
                    );
                }
            }
        }
    }

    public buildDelegateRanking(roundInfo?: Contracts.Shared.RoundInfo): Contracts.State.Wallet[] {
        const delegatesActive: Contracts.State.Wallet[] = [];

        for (const delegate of this.walletRepository.allByUsername()) {
            if (delegate.hasAttribute("delegate.resigned")) {
                delegate.forgetAttribute("delegate.rank");
            } else {
                delegatesActive.push(delegate);
            }
        }

        let delegateSorted = delegatesActive
            .sort((a, b) => {
                const voteBalanceA: Utils.BigNumber = a.getAttribute("delegate.voteBalance");
                const voteBalanceB: Utils.BigNumber = b.getAttribute("delegate.voteBalance");

                const diff = voteBalanceB.comparedTo(voteBalanceA);

                if (diff === 0) {
                    AppUtils.assert.defined<string>(a.publicKey);
                    AppUtils.assert.defined<string>(b.publicKey);

                    if (a.publicKey === b.publicKey) {
                        throw new Error(
                            `The balance and public key of both delegates are identical! Delegate "${a.getAttribute(
                                "delegate.username",
                            )}" appears twice in the list.`,
                        );
                    }

                    return a.publicKey.localeCompare(b.publicKey, "en");
                }

                return diff;
            })
            .map(
                (delegate, i): Contracts.State.Wallet => {
                    const rank = i + 1;
                    delegate.setAttribute("delegate.rank", rank);
                    return delegate;
                },
            );

        if (roundInfo) {
            delegateSorted = delegateSorted.slice(0, roundInfo.maxDelegates);

            for (const delegate of delegateSorted) {
                delegate.setAttribute("delegate.round", roundInfo.round);
            }
        }

        return delegateSorted;
    }
}
