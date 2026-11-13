import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CategoriesModule } from "../categories/categories.module";
import { NoteEntity } from "./note.entity";
import { NotesController } from "./notes.controller";
import { NotesService } from "./notes.service";
import { ParseNotesPipe } from "./pipes/parse-notes.pipe";

@Module({
  controllers: [NotesController],
  providers: [NotesService, ParseNotesPipe],
  imports: [TypeOrmModule.forFeature([NoteEntity]), CategoriesModule],
})
export class NotesModule {}
