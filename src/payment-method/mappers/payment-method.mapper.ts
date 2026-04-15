/**
 * @fileoverview Payment Method Mapper
 *
 * Maps PaymentMethod entity to ResponsePaymentMethodDto.
 * Follows DRY principle - reusable in services, controllers, and tests.
 *
 * @module PaymentMethodMapper
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { PaymentMethod } from '../entities/payment-method.entity';
import { ResponsePaymentMethodDto } from '../dto/response-payment-method.dto';

export const mapPaymentMethodToResponseDto = (
  paymentMethod: PaymentMethod,
): ResponsePaymentMethodDto => {
  return {
    id: paymentMethod.id,
    name: paymentMethod.name,
    isDeleted: paymentMethod.isDeleted,
    createdAt: paymentMethod.createdAt,
    updatedAt: paymentMethod.updatedAt ?? undefined,
    deletedAt: paymentMethod.deletedAt ?? null,
    deletedBy: paymentMethod.deletedBy?.id ?? null,
  };
};

/**
 * Maps an array of PaymentMethod entities to ResponsePaymentMethodDto array.
 */
export const mapPaymentMethodsToResponseDto = (
  paymentMethods: PaymentMethod[],
): ResponsePaymentMethodDto[] => {
  return paymentMethods.map((pm) => mapPaymentMethodToResponseDto(pm));
};
