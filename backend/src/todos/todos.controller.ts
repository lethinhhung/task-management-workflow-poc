import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TodosService } from './todos.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

@Controller('todos')
@UseGuards(JwtAuthGuard)
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Post()
  async create(@Request() req: any, @Body() dto: CreateTodoDto) {
    return this.todosService.create(req.user.userId, dto);
  }

  @Get()
  async findAll(@Request() req: any) {
    return this.todosService.findAll(req.user.userId);
  }

  @Patch(':id')
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateTodoDto,
  ) {
    return this.todosService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  async remove(@Request() req: any, @Param('id') id: string) {
    return this.todosService.remove(req.user.userId, id);
  }
}
