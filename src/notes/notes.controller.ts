import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ICurrentUser } from "../auth/interfaces/current-user.interface";
import { CreateNoteDto } from "./dto/create-note.dto";
import { INotesTransformed } from "./interfaces/notes-query.interface";
import { NotesService } from "./notes.service";
import { ParseNotesPipe } from "./pipes/parse-notes.pipe";

@UseGuards(JwtAuthGuard)
@Controller("notes")
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  postNote(
    @CurrentUser("id") userId: ICurrentUser["id"],
    @Body() body: CreateNoteDto,
  ) {
    return this.notesService.postNote(userId, body);
  }

  @Get()
  getNotes(
    @CurrentUser("id") userId: ICurrentUser["id"],
    @Query(ParseNotesPipe) parsedQuery: INotesTransformed,
  ) {
    return this.notesService.getNotes(userId, parsedQuery);
  }
}
