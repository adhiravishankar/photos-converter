# Contributing

## Overview

Thanks for contributing to `photos-converter`.
This project is intentionally small and focused, so changes should stay simple, testable, and easy to maintain.

## Development Setup

1. Install dependencies:

```bash
npm ci
```

2. Add sample images to:
   - `input_images/`

3. Run converters:
   - `bun convert.ts avif`
   - `bun convert.ts webp`

## Project Structure

- `convert.ts`: CLI entry point.
- `convert-avif.ts`: AVIF convenience entry.
- `convert-webp.ts`: WebP convenience entry.
- `utils.ts`: shared conversion and summary logic.

Refer to `architecture.md` for deeper design details.

## Contribution Guidelines

- Keep changes scoped to one concern per pull request.
- Reuse shared logic in `utils.ts` instead of duplicating behavior.
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
