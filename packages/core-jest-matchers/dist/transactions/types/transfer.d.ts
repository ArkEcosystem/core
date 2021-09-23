export {};
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeTransferType(): R;
        }
    }
}
