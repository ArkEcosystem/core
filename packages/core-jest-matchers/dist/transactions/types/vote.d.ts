export {};
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeVoteType(): R;
        }
    }
}
