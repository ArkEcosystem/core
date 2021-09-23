export {};
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeForged(): Promise<R>;
        }
    }
}
