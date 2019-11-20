import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

// TODO: check if can be replaced completely by TypeORM migrations
@Entity()
export class Migration {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column()
    public name!: string;
}
