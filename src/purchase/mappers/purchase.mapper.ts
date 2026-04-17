/**
 * @fileoverview Purchase Mapper
 *
 * Maps Purchase entity to ResponsePurchaseDto.
 * Includes optional purchaseDetails for findOne scenario.
 * Follows DRY principle - reusable in services, controllers, and tests.
 *
 * @module PurchaseMapper
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { Purchase } from '../entities/purchase.entity';
import { PurchaseDetail } from '@purchase_detail/entities/purchase-detail.entity';
import { ResponsePurchaseDto } from '../dto/response-purchase.dto';
import { ResponsePurchaseDetailDto } from '@purchase_detail/dto/response-purchase-detail.dto';

/**
 * Maps a PurchaseDetail entity to ResponsePurchaseDetailDto
 */
export const mapPurchaseDetailToResponseDto = (
  detail: PurchaseDetail,
): ResponsePurchaseDetailDto => ({
  id: detail.id,
  quantity: detail.quantity,
  unitPrice: Number(detail.unitPrice),
  subtotal: Number(detail.subtotal),
  purchase: detail.purchase?.id ?? (detail.purchase as unknown as number),
  product: detail.product?.id ?? (detail.product as unknown as number),
  isDeleted: false,
  createdAt: detail.createdAt,
  updatedAt: detail.updatedAt ?? undefined,
  deletedAt: detail.deletedAt ?? null,
  deletedBy: null,
});

/**
 * Maps a Purchase entity to ResponsePurchaseDto
 * @param includeDetails - Whether to include purchaseDetails (for findOne)
 */
export const mapPurchaseToResponseDto = (
  purchase: Purchase,
  includeDetails: boolean = false,
): ResponsePurchaseDto => {
  const response: ResponsePurchaseDto = {
    id: purchase.id,
    purchaseDate: purchase.purchaseDate,
    totalAmount: Number(purchase.totalAmount),
    supplier: purchase.supplier?.id ?? (purchase.supplier as unknown as number),
    isDeleted: purchase.isDeleted,
    createdAt: purchase.createdAt,
    updatedAt: purchase.updatedAt ?? undefined,
    deletedAt: purchase.deletedAt ?? null,
    deletedBy: purchase.deletedBy?.id ?? null,
    createdBy: purchase.createdBy?.id ?? null,
    updatedBy: purchase.updatedBy?.id ?? null,
  };

  if (includeDetails && purchase.purchaseDetails) {
    return {
      ...response,
      purchaseDetails: purchase.purchaseDetails.map(
        mapPurchaseDetailToResponseDto,
      ),
    };
  }

  return response;
};

/**
 * Maps an array of Purchase entities to ResponsePurchaseDto array
 */
export const mapPurchasesToResponseDto = (
  purchases: Purchase[],
): ResponsePurchaseDto[] => {
  return purchases.map((purchase) => mapPurchaseToResponseDto(purchase, false));
};
