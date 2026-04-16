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
    deletedAt: supplier.deletedAt ?? null,
    deletedBy: supplier.deletedBy?.id ?? null,
    createdBy: supplier.createdBy?.id
      ? { id: supplier.createdBy.id }
      : undefined,
    updatedBy: supplier.updatedBy?.id
      ? { id: supplier.updatedBy.id }
      : undefined,
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
