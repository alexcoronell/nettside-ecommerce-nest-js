/**
 * @fileoverview Sale Mapper
 *
 * Maps Sale entity to ResponseSaleDto.
 * Follows DRY principle - reusable in services, controllers, and tests.
 *
 * @module SaleMapper
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { Sale } from '../entities/sale.entity';
import { ResponseSaleDto } from '../dto/response-sale.dto';

/**
 * Maps a Sale entity to ResponseSaleDto.
 *
 * @param sale - The Sale entity to map
 * @returns The mapped ResponseSaleDto
 */
export const mapSaleToResponseDto = (sale: Sale): ResponseSaleDto => {
  const user = sale.user;
  const paymentMethod = sale.paymentMethod;

  return {
    id: sale.id,
    saleDate: sale.saleDate,
    totalAmount: sale.totalAmount,
    shippingAddress: sale.shippingAddress,
    status: sale.status,
    isCancelled: sale.isCancelled,
    cancelledAt: sale.cancelledAt,
    user: user
      ? {
          id: user.id,
          email: user.email,
          firstName: user.firstname ?? undefined,
          lastName: user.lastname ?? undefined,
        }
      : { id: 0, email: '' },
    paymentMethod: paymentMethod
      ? {
          id: paymentMethod.id,
          name: paymentMethod.name,
        }
      : { id: 0, name: '' },
  };
};

/**
 * Maps an array of Sale entities to ResponseSaleDto array.
 *
 * @param sales - Array of Sale entities to map
 * @returns Array of mapped ResponseSaleDto
 */
export const mapSalesToResponseDto = (sales: Sale[]): ResponseSaleDto[] => {
  return sales.map((sale) => mapSaleToResponseDto(sale));
};
