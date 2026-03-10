import { IsString, IsOptional, MaxLength, IsISO8601, ValidateIf } from 'class-validator';

export class CreateTodoDto {
  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @ValidateIf((o) => o.dueDate !== null)
  @IsISO8601({ strict: false }, { message: 'dueDate must be a valid ISO 8601 date string' })
  dueDate?: string | null;
}
