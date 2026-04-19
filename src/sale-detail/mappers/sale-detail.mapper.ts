/**
 * @fileoverview SaleDetail Mapper
 *
 * Maps SaleDetail entity to ResponseSaleDetailDto.
 * Follows DRY principle - reusable in services, controllers, and tests.
 *
 * @module SaleDetailMapper
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { SaleDetail } from '../entities/sale-detail.entity';
import { ResponseSaleDetailDto } from '../dto/response-sale-detail.dto';

/**
 * Maps a SaleDetail entity to ResponseSaleDetailDto.
 */
export const mapSaleDetailToResponseDto = (
  saleDetail: SaleDetail,
): ResponseSaleDetailDto => {
  return {
    id: saleDetail.id,
    quantity: saleDetail.quantity,
    unitPrice: Number(saleDetail.unitPrice),
    subtotal: Number(saleDetail.subtotal),
    product: saleDetail.product
      ? {
          id: saleDetail.product.id,
          name: saleDetail.product.name,
        }
      : { id: 0, name: '' },
    createdAt: saleDetail.createdAt,
  };
};

/**
 * Maps an array of SaleDetail entities to ResponseSaleDetailDto array.
 */
export const mapSaleDetailsToResponseDto = (
  saleDetails: SaleDetail[],
): ResponseSaleDetailDto[] => {
  return saleDetails.map((detail) => mapSaleDetailToResponseDto(detail));
};
