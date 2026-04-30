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
    filePath: productImage.filePath,
    title: productImage.title,
    isMain: productImage.isMain,
    isActive: productImage.isActive,
    createdAt: productImage.createdAt,
    uploadedBy: mapUserToAuditResponse(productImage.createdBy),
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
