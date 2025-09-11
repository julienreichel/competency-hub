# Competency Hub

[![CI](https://github.com/julienreichel/competency-hub/actions/workflows/ci.yml/badge.svg)](https://github.com/julienreichel/competency-hub/actions/workflows/ci.yml)
[![codecov](https://codecov.io/github/julienreichel/competency-hub/coverage.svg?branch=main)](https://codecov.io/github/julienreichel/competency-hub?branch=main)
[![Quality Gate Status](https://img.shields.io/badge/quality%20gate-passing-brightgreen)](https://github.com/julienreichel/competency-hub)
[![Mutation Score](https://img.shields.io/badge/mutation%20score-90.06%25-brightgreen)](https://github.com/julienreichel/competency-hub)

A Vue 3 + Quasar application for managing competencies with enterprise-grade testing and quality assurance.

## 🚀 Features

- **Vue 3** with Composition API and TypeScript
- **Quasar Framework** for UI components and responsive design
- **AWS Amplify** for backend services and GraphQL API
- **Comprehensive Testing Suite** with Vitest and mutation testing
- **Quality Assurance** with ESLint, Prettier, and automated checks
- **CI/CD Pipeline** with GitHub Actions and quality gates
- **Code Coverage** reporting with Codecov integration

## 📊 Quality Metrics

- **Test Coverage**: 84.71% overall coverage with focus on business logic
- **Mutation Score**: 90.06% (exceeding 80% threshold)
- **Code Quality**: ESLint + Prettier with complexity limits
- **Git Hooks**: Pre-commit quality checks with Husky
- **CI/CD**: Multi-node testing (Node 18.x, 20.x) with artifacts

## 🧪 Testing Infrastructure

Our comprehensive testing strategy ensures code reliability and maintainability:

### Test Coverage

- **139 tests** across all business logic
- **84.71% overall coverage** with targeted exclusions
- **100% coverage** on critical components (GraphQLClient, BaseModel)
- **Automated coverage reporting** via Codecov

### Mutation Testing

- **Stryker Mutator** for test quality assessment
- **90.06% mutation score** indicating robust test suite
- **402 mutants tested** across business logic
- **HTML reports** for detailed analysis and improvement

### Test Types

- **Unit Tests**: Individual component and function testing
- **Integration Tests**: Component interaction validation
- **Repository Tests**: Data layer and API integration
- **Error Handling**: Comprehensive edge case coverage

## 🛠️ Development Setup

## Install the dependencies

```bash
npm install
```

## 🏃‍♂️ Running the Application

### Start the app in development mode

```bash
npm run dev
# With hot-code reloading, error reporting, and development tools
```

### Build for production

```bash
npm run build
```

## 🧪 Testing Commands

### Basic Testing

```bash
# Run all tests
npm run test:run

# Run tests in watch mode
npm run test

# Run tests with UI
npm run test:ui
```

### Coverage Analysis

```bash
# Generate coverage report
npm run test:coverage

# Check coverage with detailed reporting
npm run test:coverage:check
```

### Mutation Testing

```bash
# Run mutation testing (test quality analysis)
npm run test:mutation

# Quick validation without mutations
npm run test:mutation:dry

# Incremental mutation testing (faster)
npm run test:mutation:incremental
```

## ⚡ Quality Assurance

### Code Quality

```bash
# Lint the files
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Format the files
npm run format

# Check formatting
npm run format:check
```

### Quality Gates

```bash
# Run complete quality check
npm run quality:check

# Fix quality issues automatically
npm run quality:fix

# Full quality check including mutation testing
npm run quality:check:full
```

## 📁 Project Structure

```
src/
├── components/           # Vue components
├── models/              # Business logic and data models
│   ├── base/           # Base classes (GraphQLClient, BaseModel)
│   ├── repositories/   # Data access layer
│   ├── User.ts         # User model and validation
│   └── Competency.ts   # Competency model and logic
├── layouts/            # Page layouts
├── pages/              # Route components
├── router/             # Vue Router configuration
├── boot/               # App initialization
├── css/                # Global styles
└── i18n/              # Internationalization

test/
├── models/             # Model tests
├── repositories/       # Repository tests
└── setup/              # Test configuration
```

## 🔧 Configuration Files

- `vitest.config.ts` - Test configuration with coverage settings
- `stryker.config.mjs` - Mutation testing configuration
- `eslint.config.js` - ESLint rules and TypeScript integration
- `quasar.config.ts` - Quasar framework configuration
- `.github/workflows/ci.yml` - CI/CD pipeline with quality gates

## 📈 Continuous Integration

Our GitHub Actions CI pipeline includes:

- **Multi-Node Testing**: Node.js 18.x and 20.x
- **Quality Gates**: Linting, formatting, type checking
- **Test Execution**: Full test suite with coverage
- **Coverage Reporting**: Automatic Codecov uploads
- **Artifact Generation**: Coverage reports and build outputs
- **PR Validation**: All checks must pass before merge

## 🎯 Development Guidelines

### Code Quality Standards

- **Test Coverage**: Maintain 80%+ on business logic
- **Mutation Score**: Target 80%+ mutation testing score
- **Linting**: Zero ESLint errors/warnings
- **Formatting**: Consistent Prettier formatting
- **Type Safety**: Full TypeScript coverage

### Commit Message Format

Follow [Conventional Commits](https://conventionalcommits.org/):

```
type(scope): Description starting with capital letter

- Body lines start with capital letter
- Use imperative mood: "Add" not "Added"
- Subject must be sentence-case
```

### Testing Strategy

1. **Unit Tests**: Test individual functions and methods
2. **Integration Tests**: Test component interactions
3. **Repository Tests**: Test data access patterns
4. **Mutation Tests**: Validate test quality and completeness

## 🚀 Deployment

The application is configured for deployment with:

- **AWS Amplify** backend integration
- **Quasar** production builds
- **GitHub Actions** automated deployment
- **Quality gates** ensuring only tested code reaches production

### Customize the configuration

See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js).
