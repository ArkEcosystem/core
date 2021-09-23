export {};
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeUnconfirmed(): Promise<R>;
        }
    }
}
