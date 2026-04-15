## Photos Converter

Small local utilities for converting source images into WebP and AVIF formats for use by the travel apps.

### Inputs and Outputs

- **Input directory**: `input_images/`
- **Output directory**: `output_images/`

Place original JPEG/PNG files in `input_images/`; converted images will be written to `output_images/` with the same base filename.

### Setup

```bash
cd photos-converter
npm ci
```

### Commands

- **Convert to WebP**

```bash
npx tsx convert-webp.ts
```

- **Convert to AVIF**

```bash
npx tsx convert-avif.ts
```

