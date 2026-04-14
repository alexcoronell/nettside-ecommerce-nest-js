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

## Auth Architecture (Current - Violates OCP)

- `AuthService` - Contains ALL authentication logic (validate, JWT, refresh, cookies)
- `LocalStrategy` - Hardcoded to use AuthService.validateUser
- `JwtStrategy` - Hardcoded token extraction

## Open/Closed Principle Goal

Refactor Auth to use Strategy Pattern:

- `IAuthStrategy` interface for interchangeable auth methods
- `LocalAuthStrategy`, `JwtAuthStrategy`, `OAuthStrategy` (future)
- `AuthService` depends on abstraction, not concretions
- New auth methods added WITHOUT modifying existing code

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
