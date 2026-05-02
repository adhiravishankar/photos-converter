# Contributing

## Overview

Thanks for contributing to `photos-converter`.
This project is intentionally small and focused, so changes should stay simple, testable, and easy to maintain.

## Development Setup

Dependency installation is package-manager agnostic. Bun is recommended, but npm/pnpm/yarn are also fine if the lockfile/workflow is aligned for your environment.

1. Install dependencies (Bun example):

```bash
bun install
```

1. Add sample images to:
   - `input_images/`

1. Run converters (Bun):
   - `bun src/convert.ts avif`
   - `bun src/convert.ts webp`

## Project Structure

- `src/convert.ts`: CLI entry point.
- `src/utils.ts`: shared conversion and summary logic.

Refer to `architecture.md` for deeper design details.

## Contribution Guidelines

- Keep changes scoped to one concern per pull request.
- Reuse shared logic in `src/utils.ts` instead of duplicating behavior.
- Preserve existing CLI behavior unless intentionally changing it.
- Prefer clear errors and explicit validation for CLI arguments.
- Keep output and logs readable for non-technical users.

## Coding Standards

- Use TypeScript.
- Prefer small, composable functions.
- Avoid introducing unnecessary dependencies.
- Keep file and symbol names descriptive.

## Testing Changes

Before opening a PR:

- Run the modified command(s) locally on a small sample set.
- Validate output files are created in `output_images/`.
- Verify errors are understandable for invalid inputs.
- Check docs if you changed behavior or CLI flags.

## Pull Request Checklist

- [ ] Scope is limited and clear.
- [ ] Code follows existing patterns.
- [ ] Manual validation was performed.
- [ ] Documentation was updated when needed.
