import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { NoteEntity } from "../notes/note.entity";

@Entity("attachments")
export class AttachmentEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;
  @Column({ type: "varchar" })
  originalName: string;
  @Column({ type: "varchar" })
  storageName: string;
  @Column({ type: "int" })
  size: number;
  @Column({ type: "varchar" })
  mimeType: string;
  @Column({ type: "varchar" })
  noteId: string;
  @ManyToOne(() => NoteEntity, (note) => note.attachments, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "noteId" })
  note: NoteEntity;
  @CreateDateColumn()
  createdAt: Date;
}
