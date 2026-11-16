import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ICurrentUser } from "../auth/interfaces/current-user.interface";
import { CategoriesService } from "../categories/categories.service";
import { CreateNoteDto } from "./dto/create-note.dto";
import { UpdateNoteDto } from "./dto/update-note.dto";
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
      where: { userId, categoryId: parsedQuery.categoryId },
    });
  }

  async getNoteById(userId: ICurrentUser["id"], noteId: string) {
    const note = await this.notesRepository.findOne({ where: { id: noteId } });
    if (!note || note?.userId !== userId) throw new NotFoundException();
    return note;
  }

  async updateNoteById(
    userId: ICurrentUser["id"],
    noteId: string,
    updateNoteDto: UpdateNoteDto,
  ) {
    const note = await this.getNoteById(userId, noteId);
    if (!!updateNoteDto.categoryId) {
      const category = await this.categoriesService.getUserCategoryById(
        userId,
        updateNoteDto.categoryId,
      );
      if (!category || category?.userId !== userId)
        throw new NotFoundException();
    }
    return this.notesRepository.save({ ...note, ...updateNoteDto });
  }

  async deleteNoteById(userId: ICurrentUser["id"], noteId: string) {
    const note = await this.getNoteById(userId, noteId);
    this.notesRepository.remove(note);
  }

  async makeNoteArchiveById(userId: ICurrentUser["id"], noteId: string) {
    const note = await this.getNoteById(userId, noteId);
    note.isArchived = !note.isArchived;
    return this.notesRepository.save(note);
  }
}
