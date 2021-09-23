export {};
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeValidTransaction(): R;
        }
    }
}
