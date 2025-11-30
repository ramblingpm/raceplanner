# Contributing to Race Planner

Thank you for your interest in contributing! As this is a build-in-public project, we welcome contributions from the community.

## Getting Started

1. Fork the repository
2. Clone your fork
3. Follow the QUICK_START.md guide to set up locally
4. Create a new branch for your feature

## Development Workflow

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes
# ...

# Run linting
npm run lint

# Format code
npm run format

# Test locally
npm run dev

# Commit your changes
git add .
git commit -m "feat: add your feature description"

# Push to your fork
git push origin feature/your-feature-name
```

## Code Style

This project uses:
- **ESLint** for code quality
- **Prettier** for code formatting
- **TypeScript** for type safety

Run before committing:
```bash
npm run lint
npm run format
```

## Commit Message Convention

We follow conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

Examples:
```
feat: add race history view
fix: correct speed calculation for uphill segments
docs: update deployment guide
```

## Pull Request Process

1. Update documentation if needed
2. Ensure all tests pass
3. Run linting and formatting
4. Write a clear PR description
5. Link any related issues

## What to Contribute

### Ideas for Contributions

- 🐛 Bug fixes
- ✨ New features
- 📝 Documentation improvements
- 🎨 UI/UX enhancements
- ♿ Accessibility improvements
- 🌍 Internationalization
- 🧪 Tests
- ⚡ Performance optimizations

### Feature Ideas

- Multiple race routes
- Historical performance tracking
- Weather integration
- Elevation profile support
- Social features (share results)
- Export results as PDF/image
- Mobile app (React Native)
- Strava integration

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn
- Share knowledge openly

## Questions?

- Open an issue for discussion
- Tag it with `question` label
- Be patient and kind

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT).

## Recognition

Contributors will be recognized in the README.md file.

Thank you for helping make Race Planner better! 🚴
