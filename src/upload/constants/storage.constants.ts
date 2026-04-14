export const STORAGE_CONFIG = {
  endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
  region: process.env.MINIO_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  },
  forcePathStyle: true,
};

export const BUCKETS = {
  BRAND_LOGOS: 'brand-logos',
  PRODUCT_IMAGES: 'product-images',
  AVATARS: 'avatars',
} as const;

export const PUBLIC_URL_BASE =
  process.env.MINIO_PUBLIC_URL || 'http://localhost:9000';
