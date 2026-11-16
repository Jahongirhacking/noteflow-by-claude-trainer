import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { AttachmentEntity } from "../attachments/attachment.entity";
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

  @Column({ type: "varchar", nullable: true, default: null })
  categoryId: string | null;

  @ManyToOne(() => CategoryEntity, (category) => category.id, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "categoryId" })
  category: CategoryEntity | null;

  @Column({ type: "varchar" })
  userId: string;

  @ManyToOne(() => UserEntity, (user) => user.id, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: UserEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => AttachmentEntity, (attachment) => attachment.noteId)
  attachments: AttachmentEntity[];
}
