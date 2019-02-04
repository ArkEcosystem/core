class Bla {
    public static X = 1;
    private static readonly Seaa = new Map();

    constructor() {
        console.log("Hello");
        Bla.Seaa.set("a", 1);
        console.log(Bla.Seaa);
    }
}

// tslint:disable-next-line:max-classes-per-file
class C extends Bla {
    constructor() {
        super();
        console.log(this.constructor.name);
    }
}

function foo(bla: typeof Bla) {
    console.log(bla);
    return new bla();
}

foo(C);
