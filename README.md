# NestJS E-Commerce API

<div align="center">

![NestJS](https://img.shields.io/badge/NestJS-11.x-E0234E?style=for-the-badge&logo=nestjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js)

</div>

A robust, production-ready RESTful API built with NestJS for managing a complete e-commerce platform. Features comprehensive authentication, product management, order processing, inventory tracking, and shipping integration.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Authentication](#authentication)
- [API Documentation](#api-documentation)
- [Database](#database)
- [Development](#development)
- [Testing](#testing)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Core Modules

| Module                   | Description                                                                  |
| ------------------------ | ---------------------------------------------------------------------------- |
| **User Management**      | Multi-role authentication system with Admin, Seller, and Customer roles      |
| **Authentication**       | JWT + API Key dual authentication with refresh tokens                        |
| **Product Catalog**      | Complete product management with categories, subcategories, brands, and tags |
| **Product Images**       | Multiple image support per product                                           |
| **Product Tags**         | Many-to-many product-tag relationships                                       |
| **Product Suppliers**    | Product-supplier relationships for inventory                                 |
| **Product Discounts**    | Product-specific discount associations                                       |
| **Inventory Management** | Stock tracking, supplier management, and purchase orders                     |
| **Order Processing**     | Full sales lifecycle with detailed line items and payment methods            |
| **Shipping**             | Multiple carrier support with real-time shipment tracking                    |
| **Discounts**            | Flexible promotions with codes, usage limits, and date ranges                |
| **Wishlist**             | Customer favorites for personalized shopping experience                      |
| **Store Configuration**  | Global store settings and preferences                                        |

### Technical Highlights

- **Role-Based Access Control (RBAC)** - Granular permissions for Admin, Seller, and Customer
- **Dual Authentication** - API Key for external clients + JWT with refresh tokens
- **Audit Logging** - Automatic tracking of created/updated by users
- **Soft Deletes** - Safe data removal with recovery capability
- **Pagination & Filtering** - Efficient data retrieval for large datasets
- **SEO-Friendly URLs** - Automatic slug generation for categories and brands
- **Swagger/OpenAPI** - Interactive API documentation

---

## Tech Stack

| Category          | Technology              |
| ----------------- | ----------------------- |
| Framework         | NestJS 11.x             |
| Language          | TypeScript 5.x          |
| Database          | PostgreSQL 16           |
| ORM               | TypeORM                 |
| Authentication    | JWT + Passport + Bcrypt |
| API Documentation | Swagger/OpenAPI         |
| Testing           | Jest + Supertest        |
| Package Manager   | pnpm                    |
| Containerization  | Docker + Docker Compose |
| Code Quality      | ESLint + Prettier       |
| Git Hooks         | Husky + lint-staged     |
| Build Tool        | SWC (Speedy Compiler)   |

---

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- pnpm 8+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd nettside-ecommerce-nest-js

# Install dependencies
pnpm install

# Copy environment file
cp .env.dev .env

# Start PostgreSQL with Docker
docker compose up -d postgres pgadmin

# Run migrations
pnpm run migration:run-dev

# Start development server
pnpm run start:dev
```

The API will be available at `http://localhost:3000/api/v1`
Swagger documentation at `http://localhost:3000/api/docs`

### Application Configuration

- **Global Prefix**: `api/v1`
- **CORS**: Enabled for `http://localhost:4200` (Angular frontend)
- **Cookie Parser**: Enabled for JWT refresh tokens
- **Global Exception Filter**: HttpExceptionFilter for centralized error handling
- **Global Interceptor**: AuditInterceptor for tracking user modifications

---

## Project Structure

```
src/
├── auth/                      # Authentication & authorization
│   ├── guards/                # JwtAuthGuard, AdminGuard, etc.
│   ├── strategies/            # Passport strategies
│   ├── decorators/            # Auth decorators
│   ├── dto/                   # Auth DTOs
│   └── auth.module.ts
├── bootstrap/                  # Application bootstrap & initialization
├── brand/                     # Brand management
├── category/                  # Product categories
├── commons/                   # Shared utilities
│   ├── constants/             # Error messages, status codes
│   ├── decorators/            # @Public(), @UserId(), @NoAudit()
│   ├── dtos/                  # Common DTOs (PaginationDto, CreatePerson, etc.)
│   ├── entities/              # BaseEntity, PersonEntity with soft delete
│   ├── enums/                 # UserRole, SaleStatus, ShipmentStatus
│   ├── filters/               # HttpExceptionFilter
│   ├── guards/                # ApiKeyGuard (global)
│   ├── interceptors/          # AuditInterceptor (global)
│   ├── interfaces/            # IBaseController, IBaseService
│   ├── types/                 # Type definitions
│   └── utils/                 # Helper functions
├── config/                    # Configuration module
├── database/                  # Database migrations
├── discount/                  # Promotions & discounts
├── payment-method/           # Payment methods
├── product/                   # Product CRUD operations
├── product-discount/          # Product-discount relationships
├── product-images/            # Product images
├── product-supplier/          # Product-supplier links
├── product-tag/               # Product-tag relationships
├── purchase/                  # Inventory purchase orders
├── purchase-detail/           # Purchase line items
├── sale/                      # Sales/orders
├── sale-detail/               # Sale line items
├── shipment/                  # Shipment tracking
├── shipping-company/          # Shipping providers
├── store-detail/              # Store configuration
├── subcategory/               # Product subcategories
├── supplier/                  # Supplier management
├── tag/                       # Product tags
├── user/                      # User management
└── wishlist/                  # Customer wishlists
```

---

## Architecture

### Design Patterns

```
┌─────────────────────────────────────────────────────────────┐
│                        Controller                          │
│              (Request/Response handling)                    │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                         Service                             │
│                  (Business Logic)                          │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                       Repository                            │
│                   (Data Access)                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Patterns Used

| Pattern                   | Implementation                                |
| ------------------------- | --------------------------------------------- |
| **Module Pattern**        | Feature-based modules with clear separation   |
| **Repository Pattern**    | TypeORM entities with data access abstraction |
| **DTO Pattern**           | Request validation with class-validator       |
| **Guard Pattern**         | Authentication & authorization middleware     |
| **Interceptor Pattern**   | Cross-cutting concerns like audit logging     |
| **Filter Pattern**        | Global exception handling                     |
| **Interface Segregation** | IBaseController, IBaseService interfaces      |

### NestJS Best Practices Applied

- **Dependency Injection**: Constructor injection with TypeORM repositories
- **Feature Modules**: Each domain has its own module with clear boundaries
- **Single Responsibility**: Focused services for each business domain
- **TypeORM Transactions**: Support for database transactions in operations
- **Soft Deletes**: All entities use BaseEntity with soft delete support

### Response Format

All API responses follow a consistent structure:

```typescript
// Success Response
{
  "statusCode": 200,
  "data": { ... },
  "message": "Operation successful"
}

// Paginated Response
{
  "statusCode": 200,
  "data": [...],
  "total": 100,
  "page": 1,
  "lastPage": 10
}

// Error Response
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found"
}
```

---

## Authentication

### Authentication Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────▶│ ApiKey   │────▶│   JWT    │
│          │     │  Guard   │     │  Guard   │
└──────────┘     └──────────┘     └──────────┘
```

### Dual Authentication System

| Type                  | Purpose                        | Configuration       |
| --------------------- | ------------------------------ | ------------------- |
| **API Key**           | External client authentication | Header: `x-api-key` |
| **JWT Access Token**  | Session authentication         | 10-minute expiry    |
| **JWT Refresh Token** | Token renewal                  | 7-day expiry        |

### Role-Based Access Control

| Role         | Permissions                              |
| ------------ | ---------------------------------------- |
| **Admin**    | Full system access, user management      |
| **Seller**   | Product/order management, no user access |
| **Customer** | Own orders, wishlist, profile only       |

### Public vs Protected Routes

Routes marked with `@Public()` decorator bypass API key authentication.

---

## API Documentation

### Swagger/OpenAPI

Interactive API documentation is available at `/api/docs` when the server is running.

### Authentication Endpoints

| Method | Endpoint              | Description                    |
| ------ | --------------------- | ------------------------------ |
| POST   | `/auth/login`         | User login with email/password |
| POST   | `/auth/refresh-token` | Refresh access token           |

### Core Endpoints

| Module            | Prefix                | Operations                     |
| ----------------- | --------------------- | ------------------------------ |
| Auth              | `/auth`               | POST login, POST refresh-token |
| Users             | `/users`              | GET, POST, PATCH, DELETE       |
| Products          | `/products`           | GET, POST, PATCH, DELETE       |
| Categories        | `/categories`         | GET, POST, PATCH, DELETE       |
| Brands            | `/brands`             | GET, POST, PATCH, DELETE       |
| Subcategories     | `/subcategories`      | GET, POST, PATCH, DELETE       |
| Tags              | `/tags`               | GET, POST, PATCH, DELETE       |
| Suppliers         | `/suppliers`          | GET, POST, PATCH, DELETE       |
| Shipping          | `/shipments`          | GET, POST, PATCH, DELETE       |
| Shipping Company  | `/shipping-companies` | GET, POST, PATCH, DELETE       |
| Sales             | `/sales`              | GET, POST, DELETE (cancel)     |
| Purchases         | `/purchases`          | GET, POST, PATCH, DELETE       |
| Discounts         | `/discounts`          | GET, POST, PATCH, DELETE       |
| Wishlist          | `/wishlist`           | GET, POST, DELETE              |
| Store Details     | `/store-details`      | GET, PATCH                     |
| Payment Methods   | `/payment-methods`    | GET, POST, PATCH, DELETE       |
| Product Images    | `/product-images`     | GET, POST, DELETE              |
| Product Tags      | `/product-tags`       | GET, POST, DELETE              |
| Product Suppliers | `/product-suppliers`  | GET, POST, DELETE              |
| Product Discounts | `/product-discounts`  | GET, POST, DELETE              |

### Query Parameters

| Parameter   | Type     | Description                  |
| ----------- | -------- | ---------------------------- |
| `page`      | number   | Page number (default: 1)     |
| `limit`     | number   | Items per page (default: 10) |
| `search`    | string   | Search across text fields    |
| `orderBy`   | string   | Field to order by            |
| `orderType` | ASC/DESC | Sort direction               |

---

## Database

### Entity Relationships

```
User
├── Wishlist (1:N)
├── Sale (1:N)
├── Purchase (1:N)
└── Product (1:N)

Product
├── Category (N:1)
├── Subcategory (N:1)
├── Brand (N:1)
├── ProductImage (1:N)
├── ProductTag (1:N)
├── ProductSupplier (1:N)
├── ProductDiscount (1:N)
├── Wishlist (M:N)
├── SaleDetail (1:N)
└── PurchaseDetail (1:N)

Product
├── Category (N:1)
├── Subcategory (N:1)
├── Brand (N:1)
├── ProductImage (1:N)
├── ProductTag (1:N)
├── ProductSupplier (1:N)
├── ProductDiscount (1:N)
├── Wishlist (M:N)
├── SaleDetail (1:N)
└── PurchaseDetail (1:N)

Sale
├── User (N:1)
├── PaymentMethod (N:1)
├── Shipment (N:1)
└── SaleDetail (1:N)

Shipment
├── ShippingCompany (N:1)
└── Sale (N:1)

Purchase
├── User (N:1)
├── Supplier (N:1)
└── PurchaseDetail (1:N)
```

### Soft Delete Pattern

All entities extend `BaseEntity` with:

```typescript
{
  id: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null; // Soft delete timestamp
  isDeleted: boolean; // Soft delete flag
}
```

### Database Configuration

The application uses TypeORM with the following configuration:

- **Synchronize**: Disabled (use migrations for schema changes)
- **Logging**: SQL queries in development mode
- **Entities**: Auto-loaded from entity files

### Migrations

```bash
# Create empty migration
pnpm run migration:create -- src/database/migrations/MigrationName

# Generate migration from changes
pnpm run migration:generate src/database/migrations/MigrationName

# Run migrations (development)
pnpm run migration:run-dev

# Revert last migration
pnpm run migration:revert
```

---

## Development

### Docker Services

```bash
# Start all services
docker compose up -d

# Services
- postgres:5432      # Development database (port 5432)
- postgres-e2e:5433 # E2E test database (port 5433)
- pgadmin:5050      # Database management UI (port 5050)
```

| Service      | Port | Credentials                                       |
| ------------ | ---- | ------------------------------------------------- |
| postgres     | 5432 | user: postgres, pass: postgres                    |
| postgres-e2e | 5433 | user: e2e, pass: e2e123                           |
| pgadmin      | 5050 | email: admin@nestjs-ecommerce.com, pass: admin123 |

### Environment Configuration

Create `.env` from the template:

```bash
cp .env.dev .env
```

Required variables:

```env
# Application
MODE=development
API_ROUTE=api/v1/
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=nestjs_ecommerce_db

# Authentication
API_KEY=your-api-key
JWT_SECRET=your-jwt-secret
JWT_TOKEN_EXPIRATION_TIME=600
JWT_REFRESH_TOKEN_SECRET=your-refresh-secret
JWT_REFRESH_TOKEN_EXPIRATION_TIME=604800
```

---

## Testing

```bash
# Run all unit tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Generate coverage report
pnpm run test:cov

# Run e2e tests
pnpm run test:e2e

# Debug tests
pnpm run test:debug
```

### Test Structure

```
src/
├── *.spec.ts           # Unit tests (co-located with modules)
test/
├── *.e2e-spec.ts       # E2E tests (mirrors src structure)
├── auth/               # Auth E2E tests
├── user/               # User E2E tests
├── product/            # Product E2E tests
└── ...                 # Other module E2E tests
```

### Testing Configuration

- **Unit Tests**: Jest with ts-jest transformer
- **E2E Tests**: Supertest with separate test database
- **Coverage**: Configured to exclude migrations, faker, and test directories
- **Module Mapping**: Path aliases for clean imports in tests

---

## Environment Variables

### Development (.env)

| Variable                            | Default               | Description                 |
| ----------------------------------- | --------------------- | --------------------------- |
| `MODE`                              | development           | Application mode            |
| `API_ROUTE`                         | api/v1/               | API base path               |
| `PORT`                              | 3000                  | Server port                 |
| `DB_HOST`                           | localhost             | Database host               |
| `DB_PORT`                           | 5432                  | Database port               |
| `DB_USERNAME`                       | postgres              | Database username           |
| `DB_PASSWORD`                       | postgres              | Database password           |
| `DB_NAME`                           | nestjs_ecommerce_db   | Database name               |
| `API_KEY`                           | -                     | External client API key     |
| `JWT_SECRET`                        | -                     | JWT signing secret          |
| `JWT_TOKEN_EXPIRATION_TIME`         | 600                   | Access token TTL (seconds)  |
| `JWT_REFRESH_TOKEN_SECRET`          | -                     | Refresh token secret        |
| `JWT_REFRESH_TOKEN_EXPIRATION_TIME` | 604800                | Refresh token TTL (seconds) |
| `CORS_ORIGIN`                       | http://localhost:4200 | Allowed CORS origin         |

### E2E Test Environment

| Variable      | Default                 | Description        |
| ------------- | ----------------------- | ------------------ |
| `DB_HOST`     | localhost               | Test database host |
| `DB_PORT`     | 5433                    | Test database port |
| `DB_USERNAME` | e2e                     | Test database user |
| `DB_PASSWORD` | e2e123                  | Test database pass |
| `DB_NAME`     | nestjs_ecommerce_db_e2e | Test database name |

---

## Available Scripts

| Command                       | Description            |
| ----------------------------- | ---------------------- |
| `pnpm run build`              | Build the application  |
| `pnpm run start`              | Start the application  |
| `pnpm run start:dev`          | Start with hot reload  |
| `pnpm run start:debug`        | Start in debug mode    |
| `pnpm run start:prod`         | Start production build |
| `pnpm run lint`               | Lint code              |
| `pnpm run lint:fix`           | Lint and auto-fix      |
| `pnpm run test`               | Run unit tests         |
| `pnpm run test:watch`         | Watch mode             |
| `pnpm run test:cov`           | Coverage report        |
| `pnpm run test:e2e`           | E2E tests              |
| `pnpm run migration:create`   | Create migration       |
| `pnpm run migration:generate` | Generate migration     |
| `pnpm run migration:run-dev`  | Run migrations         |
| `pnpm run migration:revert`   | Revert migration       |

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- Follow ESLint and Prettier configurations
- Write unit tests for new features
- Update documentation as needed
- Use conventional commit messages

---

## License

Private - All rights reserved
