export {};
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeAccepted(): Promise<R>;
            toBeAllAccepted(): Promise<R>;
            toBeEachAccepted(): Promise<R>;
        }
    }
}
