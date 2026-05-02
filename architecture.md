# Photos Converter Architecture

## Overview

This project provides local image conversion utilities for generating optimized assets from files in `input_images/` and writing converted outputs to `output_images/`.

Dependency installation is package-manager agnostic. Bun is the primary runtime used in examples, but npm/pnpm/yarn can be used as long as scripts and lockfile expectations are respected.

The architecture is intentionally small:

- `src/convert.ts` is the main CLI entry point.
- `convert-avif.ts` and `convert-webp.ts` are thin format-specific entry points.
- `src/utils.ts` contains the shared conversion pipeline.

## Module Responsibilities

### `src/convert.ts`

- Parses CLI arguments.
- Validates target format (`avif` or `webp`).
- Accepts optional runtime overrides:
  - `--input` / `-i`
  - `--output` / `-o`
  - `--concurrency` / `-c`
- Calls `convertImages()` from `src/utils.ts`.

### `convert-avif.ts`

- Convenience wrapper that calls shared logic with:
  - `format: 'avif'`

### `convert-webp.ts`

- Convenience wrapper that calls shared logic with:
  - `format: 'webp'`

### `src/utils.ts`

Implements the reusable processing pipeline:

1. Resolve and validate input/output directories.
2. Filter supported source files by extension.
3. Process files concurrently using `p-limit`.
4. Convert via `sharp` based on target format.
5. Preserve AVIF files as copy operations when output format is AVIF.
6. Print a conversion summary (success, failures, size reduction).

## Conversion Flow

1. Entry file invokes `convertImages(options)`.
2. `convertImages` scans `input_images/` (or custom input path).
3. For each file:
   - If target is AVIF and source is AVIF, copy directly.
   - Otherwise, validate image metadata with `sharp`.
   - Convert to target format (`.avif` or `.webp`).
4. Write outputs using the configured file name strategy (default: keep source filename with collision suffixing).
5. Display aggregated processing stats.

## Defaults and Configuration

- Default input directory: `./input_images`
- Default output directory: `./output_images`
- Supported inputs: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.tiff`, `.bmp`, `.avif`
- Default concurrency: `8`
- Default file naming strategy: `keep-file-name`

## Runtime Dependencies

- `sharp` for image processing.
- `fs-extra` for filesystem operations.
- `p-limit` for concurrency limiting.
- `uuid` for output filename generation.
