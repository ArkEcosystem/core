export {};
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeWallet(): R;
        }
    }
}
