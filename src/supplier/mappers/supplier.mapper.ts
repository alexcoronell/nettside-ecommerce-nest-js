/**
 * @fileoverview Supplier Mapper
 *
 * Maps Supplier entity to ResponseSupplierDto.
 * Follows DRY principle - reusable in services, controllers, and tests.
 *
 * @module SupplierMapper
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { Supplier } from '../entities/supplier.entity';
import { ResponseSupplierDto } from '../dto/response-supplier.dto';

export const mapSupplierToResponseDto = (
  supplier: Supplier,
): ResponseSupplierDto => {
  return {
    id: supplier.id,
    name: supplier.name,
    contactName: supplier.contactName,
    phoneNumber: supplier.phoneNumber,
    email: supplier.email,
    isDeleted: supplier.isDeleted,
    createdAt: supplier.createdAt,
    updatedAt: supplier.updatedAt,
    createdBy: supplier.createdBy?.id
      ? {
          id: supplier.createdBy.id,
          firstname: supplier.createdBy.firstname,
          lastname: supplier.createdBy.lastname,
        }
      : null,
    updatedBy: supplier.updatedBy?.id
      ? {
          id: supplier.updatedBy.id,
          firstname: supplier.updatedBy.firstname,
          lastname: supplier.updatedBy.lastname,
        }
      : null,
    deletedAt: supplier.deletedAt ?? null,
    deletedBy: supplier.deletedBy?.id
      ? {
          id: supplier.deletedBy.id,
          firstname: supplier.deletedBy.firstname,
          lastname: supplier.deletedBy.lastname,
        }
      : null,
  };
};

/**
 * Maps an array of Supplier entities to ResponseSupplierDto array.
 */
export const mapSuppliersToResponseDto = (
  suppliers: Supplier[],
): ResponseSupplierDto[] => {
  return suppliers.map((supplier) => mapSupplierToResponseDto(supplier));
};
