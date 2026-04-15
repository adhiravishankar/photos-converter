# Photos Converter

Local utilities for converting images to optimized `AVIF` and `WebP` formats.

## Inputs and Outputs

- Input directory: `input_images/`
- Output directory: `output_images/`

Drop source images into `input_images/` and run one of the commands below.  
Converted images are written to `output_images/` using UUID-based filenames.

## Setup

```bash
npm ci
```

## Quick Commands

### Convert to AVIF

```bash
npm run convert:avif
```

### Convert to WebP

```bash
npm run convert:webp
```

## Unified CLI

Use the shared CLI for both formats:

```bash
bun src/convert.ts <format> [options]
```

Examples:

```bash
bun src/convert.ts avif
bun src/convert.ts webp --input ./input_images --output ./output_images --concurrency 8
```

Options:

- `-f, --format <avif|webp>`
- `-i, --input <dir>`
- `-o, --output <dir>`
- `-c, --concurrency <number>`
- `-h, --help`

## Supported Input Formats

`.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.tiff`, `.bmp`, `.avif`

## Project Structure

- `convert-avif.ts` - AVIF convenience wrapper
- `convert-webp.ts` - WebP convenience wrapper
- `src/convert.ts` - unified CLI entry point
- `src/utils.ts` - shared conversion pipeline

## Documentation

- `architecture.md` - architecture and conversion flow
- `contributing.md` - contribution guidelines
- `license.md` - project license
