import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { CategoryEntity } from "../categories/category.entity";
import { UserEntity } from "../users/user.entity";

@Entity("notes")
export class NoteEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 200 })
  title: string;

  @Column({ type: "varchar", length: 10000, default: "", nullable: true })
  content: string;

  @Column({ type: "boolean", default: false })
  isArchived: boolean;

  @Column({ type: "varchar", nullable: true })
  catgeoryId: string;

  @ManyToOne(() => CategoryEntity, (category) => category.id)
  @JoinColumn({ name: "categoryId" })
  category: CategoryEntity;

  @Column({ type: "varchar" })
  userId: string;

  @ManyToOne(() => UserEntity, (user) => user.id)
  @JoinColumn({ name: "userId" })
  user: UserEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
