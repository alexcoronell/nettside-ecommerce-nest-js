import { ProductImage } from '../entities/product-image.entity';
import { ResponseProductImageDto } from '../dto/response-product-image.dto';
import { AuditResponse } from '@commons/interfaces/audit-response.interface';
import { User } from '@user/entities/user.entity';

/**
 * Maps a User entity to AuditResponse
 */
const mapUserToAuditResponse = (user: User | null): AuditResponse | null => {
  if (!user) return null;
  return {
    id: user.id,
    firstname: user.firstname || '',
    lastname: user.lastname || '',
  };
};

/**
 * Maps a ProductImage entity to ResponseProductImageDto
 */
export const mapProductImageToResponseDto = (
  productImage: ProductImage,
): ResponseProductImageDto => {
  return {
    id: productImage.id,
    product: productImage.product.id,
    filePath: productImage.filePath,
    title: productImage.title,
    isMain: productImage.isMain,
    createdAt: productImage.createdAt,
    updatedAt: productImage.updatedAt,
    isActive: productImage.isActive,
    createdBy: mapUserToAuditResponse(productImage.createdBy),
    updatedBy: mapUserToAuditResponse(productImage.updatedBy),
  };
};

/**
 * Maps an array of ProductImage entities to ResponseProductImageDto array
 */
export const mapProductImagesToResponseDto = (
  productImages: ProductImage[],
): ResponseProductImageDto[] => {
  return productImages.map(mapProductImageToResponseDto);
};
