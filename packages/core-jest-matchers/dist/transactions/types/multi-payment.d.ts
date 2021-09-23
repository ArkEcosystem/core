export {};
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeMultiPaymentType(): R;
        }
    }
}
