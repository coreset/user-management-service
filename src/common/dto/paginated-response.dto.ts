import { Expose, Type } from 'class-transformer';
import { PaginationMetaDto } from './pagination-meta.dto';

export class PaginatedResponseDto<T> {
  @Expose()
  @Type(() => Object) // Generic type, will be overridden in child classes
  data: T[];

  @Expose()
  @Type(() => PaginationMetaDto)
  meta: PaginationMetaDto;
}
