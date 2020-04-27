import { SnakeNamingStrategy } from "../../../../packages/core-database/src/utils/snake-naming-strategy";

describe("SnakeNamingStrategy.tableName", () => {
    it("should convert class name to snake-case table name", () => {
        const snakeNamingStrategy = new SnakeNamingStrategy();
        const snakeName = snakeNamingStrategy.tableName("MyClass", "");
        expect(snakeName).toEqual("my_class");
    });

    it("should return custom name if provided", () => {
        const snakeNamingStrategy = new SnakeNamingStrategy();
        const snakeName = snakeNamingStrategy.tableName("MyClass", "MYCLASSTABLE");
        expect(snakeName).toEqual("MYCLASSTABLE");
    });
});

describe("SnakeNamingStrategy.columnName", () => {
    it("should convert class property to snake-case column name", () => {
        const snakeNamingStrategy = new SnakeNamingStrategy();
        const snakeName = snakeNamingStrategy.columnName("myProperty", "", []);
        expect(snakeName).toEqual("my_property");
    });

    it("should return custom name if provided", () => {
        const snakeNamingStrategy = new SnakeNamingStrategy();
        const snakeName = snakeNamingStrategy.columnName("myProperty", "MYPROPERTYCOLUMN", []);
        expect(snakeName).toEqual("MYPROPERTYCOLUMN");
    });
});

describe("SnakeNamingStrategy.relationName", () => {
    it("should convert class property to snake-case column name", () => {
        const snakeNamingStrategy = new SnakeNamingStrategy();
        const snakeName = snakeNamingStrategy.relationName("myProperty");
        expect(snakeName).toEqual("my_property");
    });
});

describe("SnakeNamingStrategy.joinColumnName", () => {
    it("should convert class property to snake-case column name", () => {
        const snakeNamingStrategy = new SnakeNamingStrategy();
        const snakeName = snakeNamingStrategy.joinColumnName("MyClass", "myProperty");
        expect(snakeName).toEqual("my_class_my_property");
    });
});

describe("SnakeNamingStrategy.joinTableName", () => {
    it("should convert class and property to snake-case table name", () => {
        const snakeNamingStrategy = new SnakeNamingStrategy();
        const snakeName = snakeNamingStrategy.joinTableName("MyClass", "MyOtherClass", "myProperty", "myOtherProperty");
        expect(snakeName).toEqual("my_class_my_property__my_other_class");
    });
});

describe("SnakeNamingStrategy.joinTableColumnName", () => {
    it("should convert class and property to snake-case column name", () => {
        const snakeNamingStrategy = new SnakeNamingStrategy();
        const snakeName = snakeNamingStrategy.joinTableColumnName("MyClass", "myProperty", "");
        expect(snakeName).toEqual("my_class_my_property");
    });

    it("should convert class and column to snake-case column name", () => {
        const snakeNamingStrategy = new SnakeNamingStrategy();
        const snakeName = snakeNamingStrategy.joinTableColumnName("MyClass", "myProperty", "my_property_column");
        expect(snakeName).toEqual("my_class_my_property_column");
    });
});

describe("SnakeNamingStrategy.classTableInheritanceParentColumnName", () => {
    it("should convert parent table and column to column name", () => {
        const snakeNamingStrategy = new SnakeNamingStrategy();
        const snakeName = snakeNamingStrategy.classTableInheritanceParentColumnName("my_class", "id");
        expect(snakeName).toEqual("my_class_id");
    });
});

describe("SnakeNamingStrategy.eagerJoinRelationAlias", () => {
    it("should convert property path to alias", () => {
        const snakeNamingStrategy = new SnakeNamingStrategy();
        const snakeName = snakeNamingStrategy.eagerJoinRelationAlias("my_table_alias", "some.property");
        expect(snakeName).toEqual("my_table_alias__some_property");
    });
});
