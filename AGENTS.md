# AGENTS.md - Nettside E-commerce NestJS

## Project Overview

- **Stack**: NestJS 11.x + TypeScript 5.7 + PostgreSQL + TypeORM
- **Test Runner**: Jest 29.x
- **Auth**: JWT + Refresh Token (httpOnly cookies)
- **Architecture**: Modular monolith (25+ modules)

## Testing Configuration

- **Unit Tests**: 66 spec files → `npm run test`
- **E2E Tests**: ~90 spec files → `npm run test:e2e`
- **Coverage**: `npm run test:cov`
- **Linting**: `npm run lint` (ESLint 9)
- **Formatting**: `npm run format` (Prettier 3)

## Path Aliases (29 configured)

- `@auth/*`, `@user/*`, `@config/*`, `@product/*`, etc.

## Module Structure

```
src/
├── auth/           # Authentication (strategies, guards, decorators)
├── user/           # User management
├── product/        # Products
├── sale/           # Sales & transactions
├── payment/        # Payment methods
└── [25+ modules]
```

## Auth Architecture (Current - OCP Applied)

- `AuthService` - Contains ALL authentication logic (validate, JWT, refresh, cookies)
- `LocalStrategy` - Uses LocalAuthStrategy via DI (Strategy Pattern)
- `JwtStrategy` - Uses cookieExtractor for token extraction

**DONE**: OCP refactored - PR #2 merged

## Open/Closed Principle Goal

Refactor Auth to use Strategy Pattern:

- `IAuthStrategy` interface for interchangeable auth methods
- `LocalAuthStrategy`, `JwtAuthStrategy`, `OAuthStrategy` (future)
- `AuthService` depends on abstraction, not concretions
- New auth methods added WITHOUT modifying existing code

**STATUS**: ✅ Completed - PR #2 merged

## Key Files

- `src/auth/auth.service.ts` - Main auth logic (429 lines)
- `src/auth/strategies/*.ts` - Passport strategies
- `src/auth/guards/*.ts` - Auth guards
- `test/auth/*.e2e-spec.ts` - Auth e2e tests (6 files)

## Commands

```bash
npm run start:dev          # Start dev server
npm run test               # Run unit tests
npm run test:e2e           # Run e2e tests
npm run test:cov           # Coverage report
npm run lint               # Lint code
```

## Conventions

- Conventional commits: `feat:`, `fix:`, `refactor:`, `test:`
- JSDoc comments on all public methods
- Feature modules with separate .module.ts
- Entity naming: singular (User, Product)

---

## SOLID Principles Status

### ✅ Completed

| Principle                   | Implementation                                                | Status          |
| --------------------------- | ------------------------------------------------------------- | --------------- |
| **S** Single Responsibility | Services well-separated by module                             | ✅ Done         |
| **O** Open/Closed           | IAuthStrategy interface + LocalAuthStrategy + JwtAuthStrategy | ✅ Done (PR #2) |
| **I** Interface Segregation | DTOs: split create/read/update into separate interfaces       | ✅ Done (PR #4) |
| **L** Liskov Substitution   | TypeORM entities well-structured                              | ✅ OK           |
| **D** Dependency Inversion  | Correct use of DI in constructors                             | ✅ OK           |

---

All SOLID principles are now implemented!

**Problem**: DTOs mix create/read/update responsibilities. Example:

- `CreateBrandDto` has `id?` (shouldn't exist)
- `UpdateBrandDto` extends `CreateBrandDto` - inherits fields that shouldn't be updatable

**Solution**: Split each module's DTOs:

- `CreateXxxDto` - only fields needed for creation
- `UpdateXxxDto` - only fields that CAN be updated
- `ResponseXxxDto` - only fields returned in API responses

**Modules to refactor** (alphabetical):

- [x] brand
- [x] category
- [x] discount
- [x] payment-method
- [x] product
- [x] product-discount
- [x] product-images
- [x] product-supplier
- [x] product-tag
- [x] purchase
- [x] sale
- [x] shipment
- [x] shipping-company
- [x] store-detail
- [x] subcategory
- [x] supplier
- [x] tag
- [x] user
- [x] wishlist
- [x] purchase

**Status**: ISP refactor completado ✅ **TODOS LOS 19 MÓDULOS**

**Completed**: sale (último refactorizado - con internal sale-detail)

## Implemented Modules (DTO Interface Segregation)

- [x] brand - completed in current branch
- [x] category - completed in current branch
- [x] discount - completed in current branch
- [x] payment-method - completed in current branch
- [x] product - completed in current branch
- [x] product-discount - completed (pendiente: internal module)
- [x] product-images - completed (pendiente: internal module)
- [x] product-supplier - completed (pendiente: internal module)
- [x] product-tag - completed (pendiente: internal module)
- [x] shipping-company - completed in current branch
- [x] shipment - completed in current branch
- [x] store-detail - completed in current branch
- [x] subcategory - completed in current branch
- [x] supplier - completed in current branch
- [x] tag - completed in current branch
- [x] user - completed in current branch
- [x] wishlist - completed in current branch
- [x] purchase - completed in current branch
- [x] sale - completed in current branch

---

## Seeders Configuration

### Database Seeders (Bootstrap)

| Seeder                        | Type    | Description                         |
| ----------------------------- | ------- | ----------------------------------- |
| `UserSeeder`                  | Default | Creates default admin user          |
| `DefaultStoreDetailsSeeder`   | Default | Creates default store detail (id=1) |
| `FakeUsersSeeder`             | Fake    | Creates 100 fake users              |
| `FakeShippingCompaniesSeeder` | Fake    | Creates 10 fake shipping companies  |
| `FakeStoreDetailsSeeder`      | Fake    | Updates store with fake data        |
| `FakeBrandsSeeder`            | Fake    | Creates 100 fake brands             |
| `FakeCategoriesSeeder`        | Fake    | Creates fake categories             |
| `FakeDiscountsSeeder`         | Fake    | Creates fake discounts              |
| `FakePaymentMethodsSeeder`    | Fake    | Creates fake payment methods        |
| `FakeSubcategoriesSeeder`     | Fake    | Creates fake subcategories          |
| `FakeSuppliersSeeder`         | Fake    | Creates fake suppliers              |
| `FakeTagsSeeder`              | Fake    | Creates fake tags                   |
| `FakeProductsSeeder`          | Fake    | Creates fake products               |
| `FakeProductImageSeeder`      | Fake    | Creates 1-10 images per product     |
| `FakePurchasesSeeder`         | Fake    | Creates 500 fake purchases          |
| `FakeSalesSeeder`             | Fake    | Creates 500 fake sales              |

### Seed Order (BootstrapService)

1. **Default Seeds** (Production mode): UserSeeder → DefaultStoreDetailsSeeder
2. **Fake Seeds**: FakeUsersSeeder → FakeShippingCompaniesSeeder → FakeStoreDetailsSeeder → FakeBrandsSeeder → FakeCategoriesSeeder → FakeDiscountsSeeder → FakePaymentMethodsSeeder → FakeSubcategoriesSeeder → FakeSuppliersSeeder → FakeTagsSeeder → FakeProductsSeeder → **FakeProductImageSeeder** → FakePurchasesSeeder → FakeSalesSeeder

---

## Current Branch Status

- **Branch**: `dev`
- **Status**: 1 commit ahead of `origin/dev` ⚠️
- **Último commit**: `7f783b3` feat(seeders): add FakeProductImageSeeder and update faker with entity types
- **ISP Refactor**: ✅ COMPLETADO (19 módulos)
- **Seeders**: ✅ COMPLETADOS (16 seeders - FakeProductImageSeeder added)
- **Internal Modules**: 🔄 EN PROGRESO (product-images Fase 1 ✅ COMPLETADA)

---

## Internal Modules Pattern (Aggregate Root)

### Overview

Módulos de relación (junction tables) deben ser **internos** - gestionados por el módulo padre (Aggregate Root Pattern de DDD):

| Módulo Padre | Módulos Internos                                                                    |
| ------------ | ----------------------------------------------------------------------------------- |
| `sale`       | `sale-detail` ✅                                                                    |
| `product`    | `product-images`, `product-discount`, `product-supplier`, `product-tag` (PENDIENTE) |
| `purchase`   | `purchase-detail` ✅                                                                |

### Plan: Product Relations → Internal Modules

**Problema**: Los módulos de relación tienen endpoints propios cuando deberían ser gestionados solo por el servicio del módulo padre.

**Solución**: Hacerlos internos como `sale-detail` y `purchase-detail`.

#### Fases de Implementación

| Fase | Módulo             | Acción                                             | Status     |
| ---- | ------------------ | -------------------------------------------------- | ---------- |
| 1    | `product-images`   | Eliminar controller, mover lógica a ProductService | ✅ DONE    |
| 2    | `product-discount` | Eliminar controller, mover lógica a ProductService | 🔄 PENDING |
| 3    | `product-supplier` | Eliminar controller, mover lógica a ProductService | 🔄 PENDING |
| 4    | `product-tag`      | Eliminar controller, mover lógica a ProductService | 🔄 PENDING |

#### Por cada fase:

1. Eliminar `{module}.controller.ts`
2. Mover lógica de gestión a `{Parent}Service`
3. Agregar Entity repository en `{Parent}Module`
4. Actualizar `{Parent}Service` para gestionar relaciones
5. Eliminar tests e2e del módulo
6. Actualizar ResponseDto del padre para incluir relaciones

#### Referencia

- Pattern: `sale` con `sale-detail` (internal module)
- **Completed**: `product-images` now integrated with ProductService (image upload on create/update, Fase 1 complete in commit b115e98)
