# Autonomous Testing Setup Guide

## Installation

Install Playwright for E2E testing:
```bash
npm install --save-dev @playwright/test
npx playwright install
```

## Available Commands

### Custom Slash Commands
- `/test-feature [feature-name]` - Comprehensive feature testing with browser automation
- `/auto-fix [issue-description]` - Automatically fix issues with retry logic
- `/generate-e2e [feature]` - Generate and run E2E tests
- `/visual-test [component]` - Visual regression testing
- `/monitor` - Continuous health monitoring

### NPM Scripts
```bash
npm test          # Run Playwright E2E tests
npm run test:ui   # Run tests with UI mode
npm run test:auto # Run custom automation
npm run type-check # TypeScript validation
```

## Testing Workflow

1. **Development**: Use `/test-feature` for immediate validation
2. **Debugging**: Use `/auto-fix` for automatic error resolution
3. **CI/CD**: Tests run automatically on PR creation
4. **Monitoring**: Use `/monitor` for continuous health checks

## File Structure
```
.claude/
├── commands/          # Custom slash commands
├── hooks/             # Pre/post edit hooks
└── parallel-config.json # Multi-worker configuration

__tests__/
└── e2e/               # End-to-end test files

.github/workflows/     # GitHub Actions for auto-fixing
```

## Self-Healing Features
- Automatic error detection and fixing
- Browser-based validation
- Visual regression detection
- Continuous monitoring with auto-recovery
- Parallel test execution across components