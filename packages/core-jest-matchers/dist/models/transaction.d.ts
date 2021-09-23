export {};
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeTransaction(): R;
        }
    }
}
