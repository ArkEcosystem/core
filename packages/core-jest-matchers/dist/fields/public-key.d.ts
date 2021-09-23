export {};
declare global {
    namespace jest {
        interface Matchers<R> {
            toBePublicKey(): R;
        }
    }
}
