export {};
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeApiTransaction(): R;
        }
    }
}
