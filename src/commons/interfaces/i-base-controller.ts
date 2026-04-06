import { Result } from '@commons/types/result.type';

export interface IBaseController<T, CreateDto, UpdateDto> {
  count(): Promise<Result<number>>;
  findAll(): Promise<Result<T[]>>;
  findOne(id: number): Promise<Result<T>>;
  create(
    payload: CreateDto | CreateDto[],
    userId: number,
  ): Promise<Result<T>> | Promise<Result<T[]>>;
  update(
    id: number | string,
    userId: number,
    payload: UpdateDto,
  ): Promise<Result<T>>;
  remove(id: number | string, userId: number): Promise<Result<T>>;
}
