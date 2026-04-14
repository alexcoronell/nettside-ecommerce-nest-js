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

### 🔄 In Progress

| Principle                   | Implementation                                          | Status    |
| --------------------------- | ------------------------------------------------------- | --------- |
| **I** Interface Segregation | DTOs: split create/read/update into separate interfaces | 🔄 Active |

### 📋 Pending

| Principle                  | Implementation                    | Status |
| -------------------------- | --------------------------------- | ------ |
| **L** Liskov Substitution  | TypeORM entities well-structured  | ✅ OK  |
| **D** Dependency Inversion | Correct use of DI in constructors | ✅ OK  |

---

## Current Task: DTO Interface Segregation

**Problem**: DTOs mix create/read/update responsibilities. Example:

- `CreateBrandDto` has `id?` (shouldn't exist)
- `UpdateBrandDto` extends `CreateBrandDto` - inherits fields that shouldn't be updatable

**Solution**: Split each module's DTOs:

- `CreateXxxDto` - only fields needed for creation
- `UpdateXxxDto` - only fields that CAN be updated
- `ResponseXxxDto` - only fields returned in API responses

**Modules to refactor** (alphabetical):

- [ ] brand
- [ ] category
- [ ] discount
- [ ] payment-method
- [ ] product
- [ ] product-discount
- [ ] product-images
- [ ] product-supplier
- [ ] product-tag
- [ ] purchase
- [ ] sale
- [ ] shipment
- [ ] shipping-company
- [ ] store-detail
- [ ] subcategory
- [ ] supplier
- [ ] tag
- [ ] user
- [ ] wishlist

**Priority**: Start with modules that have most complex DTOs (user, product, brand)

## Implemented Modules (DTO Interface Segregation)

- [x] brand - completed in current branch
