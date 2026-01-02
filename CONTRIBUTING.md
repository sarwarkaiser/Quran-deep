# Contributing to RCQI Platform

Thank you for your interest in contributing to the RCQI Platform! This document provides guidelines and instructions for contributing.

## 🌟 Ways to Contribute

- **Code**: Implement features, fix bugs, improve performance
- **Documentation**: Improve docs, add examples, write tutorials
- **Design**: UI/UX improvements, icons, graphics
- **Testing**: Write tests, report bugs, test new features
- **Translation**: Add new Quran translations, UI translations
- **Research**: Improve RCQI algorithms, linguistic analysis

## 🚀 Getting Started

1. **Fork the repository**
2. **Clone your fork**: `git clone https://github.com/YOUR_USERNAME/rcqi-platform.git`
3. **Create a branch**: `git checkout -b feature/my-feature`
4. **Make changes**: Follow our coding standards
5. **Test**: Run `pnpm test` and `pnpm lint`
6. **Commit**: Use conventional commits (see below)
7. **Push**: `git push origin feature/my-feature`
8. **Create PR**: Open a pull request with description

## 📝 Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
git commit -m "feat(api): add semantic search endpoint"
git commit -m "fix(mobile): resolve sync conflict issue"
git commit -m "docs(readme): update installation instructions"
```

## 🏗️ Project Structure

```
rcqi-platform/
├── apps/
│   ├── web/          # Next.js web app
│   ├── mobile/       # React Native app
│   └── api/          # Fastify API
├── packages/
│   ├── shared/       # Shared utilities
│   ├── database/     # Database schemas
│   ├── rcqi-engine/ # AI analysis
│   └── ...
```

## 💻 Development Guidelines

### Code Style

- **TypeScript**: Use strict mode, avoid `any`
- **Naming**: camelCase for variables, PascalCase for components
- **Imports**: Organize imports (types, external, internal)
- **Comments**: Use JSDoc for public APIs
- **Formatting**: Run `pnpm format` before committing

### Component Guidelines

```typescript
// Good: Typed props, clear naming
interface AyahCardProps {
  ayah: Ayah;
  onBookmark?: (id: string) => void;
}

export function AyahCard({ ayah, onBookmark }: AyahCardProps) {
  // Implementation
}

// Bad: Untyped, unclear
export function Card(props: any) {
  // Implementation
}
```

### API Guidelines

- Use proper HTTP status codes
- Validate input with Zod schemas
- Handle errors gracefully
- Document endpoints with JSDoc
- Add rate limiting for expensive operations

### Database Guidelines

- Use Drizzle ORM, avoid raw SQL
- Add indexes for frequently queried fields
- Use transactions for multi-step operations
- Add migrations for schema changes
- Seed data for testing

## 🧪 Testing

### Unit Tests

```typescript
// packages/shared/src/utils/__tests__/arabic.test.ts
import { describe, it, expect } from 'vitest';
import { removeDiacritics } from '../arabic';

describe('removeDiacritics', () => {
  it('should remove Arabic diacritics', () => {
    expect(removeDiacritics('بِسْمِ')).toBe('بسم');
  });
});
```

### Integration Tests

```typescript
// apps/api/src/routes/__tests__/quran.test.ts
import { describe, it, expect } from 'vitest';
import { app } from '../../app';

describe('GET /v1/surahs', () => {
  it('should return all surahs', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/surahs',
    });
    
    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveLength(114);
  });
});
```

### E2E Tests

```typescript
// apps/web/tests/e2e/reading.spec.ts
import { test, expect } from '@playwright/test';

test('should display ayah', async ({ page }) => {
  await page.goto('/surah/1/ayah/1');
  await expect(page.locator('.ayah-text')).toBeVisible();
});
```

## 📚 Documentation

- Update README.md for major changes
- Add JSDoc comments for public APIs
- Create examples for new features
- Update ARCHITECTURE.md for architectural changes

## 🐛 Bug Reports

When reporting bugs, include:

1. **Description**: Clear description of the issue
2. **Steps to Reproduce**: Detailed steps
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**: OS, browser, Node version
6. **Screenshots**: If applicable
7. **Logs**: Error messages, stack traces

## 💡 Feature Requests

When requesting features, include:

1. **Problem**: What problem does it solve?
2. **Solution**: Proposed solution
3. **Alternatives**: Other solutions considered
4. **Use Cases**: Real-world examples
5. **Priority**: How important is it?

## 🔍 Code Review

All PRs require review before merging. Reviewers check:

- Code quality and style
- Test coverage
- Documentation
- Performance impact
- Security implications
- Breaking changes

## 📋 PR Checklist

Before submitting a PR:

- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Commits follow convention
- [ ] No console.log or debug code
- [ ] Linting passes (`pnpm lint`)
- [ ] Tests pass (`pnpm test`)
- [ ] Build succeeds (`pnpm build`)

## 🎯 Priority Areas

We especially welcome contributions in:

1. **Quran Data**: Adding translations, tafsir sources
2. **RCQI Analysis**: Improving linguistic analysis
3. **Mobile Features**: Offline sync, performance
4. **Accessibility**: Screen readers, keyboard navigation
5. **Internationalization**: UI translations
6. **Testing**: Increasing test coverage

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in documentation

## 📞 Questions?

- **GitHub Discussions**: Ask questions
- **Discord**: Join our community
- **Email**: dev@rcqi.app

---

**Thank you for contributing to RCQI Platform! 🌟**
