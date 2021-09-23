export {};
declare global {
    namespace jest {
        interface Matchers<R> {
            toTransition(transition: object): R;
        }
    }
}
