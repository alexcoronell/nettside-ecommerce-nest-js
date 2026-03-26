/* Types */
import { Result } from '@commons/types/result.type';
import { PaginatedResult, PaginationDto } from '@commons/dtos/Pagination.dto';
import { User } from '@user/entities/user.entity';

export interface IBaseService<ResponseDto, CreateDto, UpdateDto> {
  countAll(): Promise<Result<number>>;
  count(): Promise<Result<number>>;
  findAll(options?: PaginationDto): Promise<PaginatedResult<ResponseDto>>;
  findOne(id: number): Promise<Result<ResponseDto>>;
  create(
    data: CreateDto | CreateDto[],
    userId: User['id'],
  ): Promise<Result<ResponseDto>> | Promise<Result<ResponseDto[]>>;
  update(
    id: number,
    userId: User['id'],
    data: UpdateDto,
  ): Promise<Result<ResponseDto>>;
  remove(
    id: number,
    userId: User['id'],
  ): Promise<{ statusCode: number; message: string }>;
}
