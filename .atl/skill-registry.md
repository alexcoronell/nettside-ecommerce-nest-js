# Skill Registry

**Project**: nettside-ecommerce-nest-js
**Generated**: 2026-04-14

---

## Project Skills

| Skill                      | Location                                  | Trigger                     |
| -------------------------- | ----------------------------------------- | --------------------------- |
| nestjs-best-practices      | .agents/skills/nestjs-best-practices      | NestJS code review/refactor |
| nestjs-testing-expert      | .agents/skills/nestjs-testing-expert      | Writing NestJS tests        |
| jest-testing-expert        | .agents/skills/jest-testing-expert        | Jest testing patterns       |
| readme-blueprint-generator | .agents/skills/readme-blueprint-generator | Generate README.md          |

---

## User-Level Skills (Available)

| Skill          | Location                                 | Trigger               |
| -------------- | ---------------------------------------- | --------------------- |
| branch-pr      | ~/.config/opencode/skills/branch-pr      | PR creation           |
| find-skills    | ~/.agents/skills/find-skills             | Find/install skills   |
| go-testing     | ~/.config/opencode/skills/go-testing     | Go tests              |
| issue-creation | ~/.config/opencode/skills/issue-creation | Issue creation        |
| judgment-day   | ~/.config/opencode/skills/judgment-day   | Adversarial review    |
| omarchy        | ~/.claude/skills/omarchy                 | Linux desktop config  |
| skill-creator  | ~/.config/opencode/skills/skill-creator  | Create new skills     |
| skill-registry | ~/.config/opencode/skills/skill-registry | Update skill registry |
| sdd-apply      | ~/.config/opencode/skills/sdd-apply      | SDD implementation    |
| sdd-archive    | ~/.config/opencode/skills/sdd-archive    | SDD archive           |
| sdd-design     | ~/.config/opencode/skills/sdd-design     | SDD design            |
| sdd-explore    | ~/.config/opencode/skills/sdd-explore    | SDD exploration       |
| sdd-init       | ~/.config/opencode/skills/sdd-init       | SDD init              |
| sdd-onboard    | ~/.config/opencode/skills/sdd-onboard    | SDD onboarding        |
| sdd-propose    | ~/.config/opencode/skills/sdd-propose    | SDD proposal          |
| sdd-spec       | ~/.config/opencode/skills/sdd-spec       | SDD specification     |
| sdd-tasks      | ~/.config/opencode/skills/sdd-tasks      | SDD task breakdown    |
| sdd-verify     | ~/.config/opencode/skills/sdd-verify     | SDD verification      |

---

## Project Conventions

- **Architecture**: Modular monolith with 25+ NestJS modules
- **Testing**: Jest with ts-jest preset, comprehensive unit + e2e coverage
- **Code Style**: ESLint 9 + Prettier 3, Husky pre-commit hooks
- **Database**: TypeORM with PostgreSQL, migration-based schema
- **API**: REST with Swagger/OpenAPI documentation
- **Auth**: JWT + Refresh Token + Local strategies via Passport

---

## Compact Rules

### NestJS Best Practices (auto-inject)

```
## NestJS Best Practices (auto-resolved)
- Use @Injectable() with provided: 'root' for singleton services
- Prefer constructor injection over property injection
- Use DTOs with class-validator for input validation
- Leverage TypeORM transactions for multi-entity operations
- Implement proper error handling with custom exceptions
- Use Swagger decorators (@ApiResponse, @ApiOperation) for documentation
```

### NestJS Testing Expert (auto-inject)

```
## NestJS Testing (auto-resolved)
- Use Test.createTestingModule() for unit tests
- Mock dependencies with jest.mock() or provideMockService
- Use supertest for e2e endpoint testing
- Follow AAA pattern: Arrange, Act, Assert
- Include coverage threshold in jest.config
```

---

_Regenerate this file when skills are added or removed._
