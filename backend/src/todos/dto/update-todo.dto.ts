import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsBoolean, ValidateIf, IsISO8601 } from 'class-validator';
import { CreateTodoDto } from './create-todo.dto';

export class UpdateTodoDto extends PartialType(CreateTodoDto) {
  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @ValidateIf((o) => o.dueDate !== null)
  @IsISO8601({ strict: false }, { message: 'dueDate must be a valid ISO 8601 date string or null' })
  dueDate?: string | null;
}
