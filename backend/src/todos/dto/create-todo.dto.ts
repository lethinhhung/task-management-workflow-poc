import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateTodoDto {
  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
