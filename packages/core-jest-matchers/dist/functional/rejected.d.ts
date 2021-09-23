export {};
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeRejected(): Promise<R>;
            toBeEachRejected(): Promise<R>;
        }
    }
}
