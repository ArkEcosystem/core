export {};
declare global {
    namespace jest {
        interface Matchers<R> {
            toHaveVoteBalance(voteBalance: string): Promise<R>;
        }
    }
}
