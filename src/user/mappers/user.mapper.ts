/**
 * @fileoverview User Mapper
 *
 * Maps User entity to ResponseUserDto.
 * Follows DRY principle - reusable in services, controllers, and tests.
 * Excludes sensitive fields like password from responses.
 *
 * @module UserMapper
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { User } from '../entities/user.entity';
import { ResponseUserDto } from '../dto/response-user.dto';

export const mapUserToResponseDto = (user: User): ResponseUserDto => {
  return {
    id: user.id,
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email,
    phoneNumber: user.phoneNumber,
    isActive: user.isActive,
    role: user.role,
    department: user.department,
    city: user.city,
    address: user.address,
    neighborhood: user.neighborhood,
    isDeleted: user.isDeleted,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt ?? undefined,
    deletedAt: user.deletedAt ?? null,
    deletedBy: user.deletedBy?.id
      ? {
          id: user.deletedBy.id,
          firstname: user.deletedBy.firstname,
          lastname: user.deletedBy.lastname,
        }
      : null,
    createdBy: user.createdBy?.id
      ? {
          id: user.createdBy.id,
          firstname: user.createdBy.firstname,
          lastname: user.createdBy.lastname,
        }
      : undefined,
    updatedBy: user.updatedBy?.id
      ? {
          id: user.updatedBy.id,
          firstname: user.updatedBy.firstname,
          lastname: user.updatedBy.lastname,
        }
      : undefined,
  };
};

/**
 * Maps an array of User entities to ResponseUserDto array.
 */
export const mapUsersToResponseDto = (users: User[]): ResponseUserDto[] => {
  return users.map((user) => mapUserToResponseDto(user));
};
