import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ICurrentUser } from "../auth/interfaces/current-user.interface";
import { CategoriesService } from "../categories/categories.service";
import { CreateNoteDto } from "./dto/create-note.dto";
import { INotesTransformed } from "./interfaces/notes-query.interface";
import { NoteEntity } from "./note.entity";

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(NoteEntity)
    private readonly notesRepository: Repository<NoteEntity>,
    private readonly categoriesService: CategoriesService,
  ) {}

  async postNote(userId: ICurrentUser["id"], createNoteDto: CreateNoteDto) {
    if (createNoteDto.categoryId) {
      const category = await this.categoriesService.getUserCategoryById(
        userId,
        createNoteDto.categoryId,
      );
      if (category?.userId !== userId) throw new NotFoundException();
    }
    const note = this.notesRepository.create({
      userId,
      ...createNoteDto,
    });
    return this.notesRepository.save(note);
  }

  async getNotes(userId: ICurrentUser["id"], parsedQuery: INotesTransformed) {
    return this.notesRepository.find({
      where: { userId, catgeoryId: parsedQuery.categoryId },
    });
  }
}
