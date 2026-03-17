# NestJS E-Commerce API

A robust, production-ready RESTful API built with NestJS for managing an e-commerce platform. Features comprehensive authentication, product management, order processing, and inventory tracking.

## Tech Stack

- **Framework**: NestJS 11.x
- **Language**: TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with Refresh Tokens
- **Testing**: Jest (Unit & E2E)
- **Package Manager**: pnpm
- **API Documentation**: Swagger/OpenAPI

## Features

### Core Modules

- **User Management** - Multi-role authentication (Admin, Seller, Customer)
- **Product Catalog** - Categories, subcategories, brands, tags
- **Inventory Management** - Stock tracking, supplier management
- **Order Processing** - Sales, purchases, detailed tracking
- **Shipping** - Multiple shipping companies, shipment tracking
- **Discounts** - Product and catalog-level promotions
- **Wishlist** - Customer favorites management

### Technical Features

- Role-based access control (RBAC)
- API Key authentication for external clients
- Audit logging interceptor
- Pagination and filtering support
- Slug generation for SEO-friendly URLs
- Comprehensive error handling

## Project Structure

```
src/
├── auth/                 # Authentication module (JWT, Login)
├── brand/               # Brand management
├── category/            # Product categories
├── commons/             # Shared utilities, guards, interceptors
├── config/              # Application configuration
├── database/            # Database module & migrations
├── discount/            # Discount management
├── payment-method/     # Payment methods
├── product/             # Product CRUD
├── product-discount/    # Product-discount relationships
├── product-images/      # Product image management
├── product-supplier/    # Product-supplier relationships
├── product-tag/         # Product-tag relationships
├── purchase/            # Purchase orders
├── purchase-detail/     # Purchase line items
├── sale/                # Sales orders
├── sale-detail/         # Sale line items
├── shipment/            # Shipment tracking
├── shipping-company/    # Shipping providers
├── store-detail/        # Store configuration
├── subcategory/         # Product subcategories
├── supplier/            # Supplier management
├── tag/                # Product tags
├── user/               # User management
└── wishlist/           # Customer wishlists
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- pnpm 8+

### Installation

```bash
# Install dependencies
pnpm install

# Configure environment
cp .env.dev .env
# Edit .env with your database credentials
```

### Database Setup

```bash
# Generate migrations (after schema changes)
pnpm run migration:generate MigrationName

# Run migrations
pnpm run migration:run-dev
```

### Development

```bash
# Start development server with hot reload
pnpm run start:dev

# Start production server
pnpm run start:prod
```

## Testing

```bash
# Run unit tests
pnpm run test

# Run unit tests with coverage
pnpm run test:cov

# Run e2e tests
pnpm run test:e2e
```

## API Endpoints

| Module           | Endpoints                                  |
| ---------------- | ------------------------------------------ |
| Auth             | POST /auth/login, POST /auth/refresh-token |
| Brand            | CRUD at /brands                            |
| Category         | CRUD at /categories                        |
| Discount         | CRUD at /discounts                         |
| Payment Method   | CRUD at /payment-methods                   |
| Product          | CRUD at /products                          |
| Product Images   | CRUD at /product-images                    |
| Product Discount | CRUD at /product-discounts                 |
| Product Supplier | CRUD at /product-suppliers                 |
| Product Tag      | CRUD at /product-tags                      |
| Purchase         | CRUD at /purchases                         |
| Purchase Detail  | CRUD at /purchase-details                  |
| Sale             | CRUD at /sales                             |
| Sale Detail      | CRUD at /sale-details                      |
| Shipment         | CRUD at /shipments                         |
| Shipping Company | CRUD at /shipping-companies                |
| Store Detail     | GET/PATCH at /store-detail                 |
| Subcategory      | CRUD at /subcategories                     |
| Supplier         | CRUD at /suppliers                         |
| Tag              | CRUD at /tags                              |
| User             | CRUD at /users                             |
| Wishlist         | CRUD at /wishlists                         |

## Environment Variables

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=secret
DATABASE_NAME=ecommerce

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# API
API_KEY=your-api-key-for-external-clients
PORT=3000
```

## Available Scripts

| Command                       | Description              |
| ----------------------------- | ------------------------ |
| `pnpm run build`              | Build the application    |
| `pnpm run start`              | Start the application    |
| `pnpm run start:dev`          | Start with hot reload    |
| `pnpm run start:prod`         | Start production build   |
| `pnpm run lint`               | Lint and fix code        |
| `pnpm run test`               | Run unit tests           |
| `pnpm run test:cov`           | Run tests with coverage  |
| `pnpm run test:e2e`           | Run e2e tests            |
| `pnpm run migration:generate` | Generate a new migration |

## Architecture Patterns

- **Service-Controller-Module** architecture per feature
- **Repository Pattern** with TypeORM
- **DTOs** for request validation
- **Entity** models with proper relationships
- **Guards** for authentication and authorization
- **Interceptors** for audit logging
- **Filters** for exception handling

## License

Private - All rights reserved
