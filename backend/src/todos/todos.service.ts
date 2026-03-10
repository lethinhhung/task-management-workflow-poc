import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Todo } from './todo.entity';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

@Injectable()
export class TodosService {
  constructor(
    @InjectRepository(Todo)
    private readonly todosRepository: Repository<Todo>,
  ) {}

  async create(userId: string, dto: CreateTodoDto): Promise<Todo> {
    const todo = this.todosRepository.create({
      ...dto,
      userId,
    });
    return this.todosRepository.save(todo);
  }

  async findAll(userId: string): Promise<Todo[]> {
    return this.todosRepository.find({ where: { userId } });
  }

  async update(userId: string, id: string, dto: UpdateTodoDto): Promise<Todo> {
    const todo = await this.todosRepository.findOne({
      where: { id, userId },
    });
    if (!todo) {
      throw new NotFoundException('Todo not found');
    }
    Object.assign(todo, dto);
    return this.todosRepository.save(todo);
  }

  async remove(userId: string, id: string): Promise<{ deleted: boolean }> {
    const todo = await this.todosRepository.findOne({
      where: { id, userId },
    });
    if (!todo) {
      throw new NotFoundException('Todo not found');
    }
    await this.todosRepository.remove(todo);
    return { deleted: true };
  }
}
