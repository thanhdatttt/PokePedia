import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PokemonMovesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['level_up', 'machine', 'egg', 'tutor', 'transfer', 'reminder'])
  learnMethod?:
    | 'level_up'
    | 'machine'
    | 'egg'
    | 'tutor'
    | 'transfer'
    | 'reminder';

  // If omitted, defaults to the latest version group this Pokémon has data for
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  versionGroupId?: number;

  @IsOptional()
  @IsIn(['name', 'power', 'accuracy', 'pp', 'level'])
  sortBy?: 'name' | 'power' | 'accuracy' | 'pp' | 'level' = 'level';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'asc';
}