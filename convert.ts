import { convertImages, DEFAULT_INPUT_DIR, DEFAULT_OUTPUT_DIR, type OutputFormat } from './utils';

interface CliOptions {
  format: OutputFormat;
  inputDir?: string;
  outputDir?: string;
  concurrency?: number;
}

function printHelp(): void {
  console.log(`
Usage:
  bun convert.ts <format> [options]
  bun convert.ts --format <format> [options]

Formats:
  avif | webp

Options:
  -f, --format <format>        Output format (avif/webp)
  -i, --input <dir>            Input directory (default: ${DEFAULT_INPUT_DIR})
  -o, --output <dir>           Output directory (default: ${DEFAULT_OUTPUT_DIR})
  -c, --concurrency <number>   Parallel workers (default: 12)
  -h, --help                   Show this help
`);
}

function parseCliArgs(argv: string[]): CliOptions | null {
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    return null;
  }

  const options: Partial<CliOptions> = {};
  let index = 0;

  while (index < argv.length) {
    const arg = argv[index];

    if (arg === '--format' || arg === '-f') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('Missing value for --format');
      }
      options.format = value as OutputFormat;
      index += 2;
      continue;
    }

    if (arg === '--input' || arg === '-i') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('Missing value for --input');
      }
      options.inputDir = value;
      index += 2;
      continue;
    }

    if (arg === '--output' || arg === '-o') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('Missing value for --output');
      }
      options.outputDir = value;
      index += 2;
      continue;
    }

    if (arg === '--concurrency' || arg === '-c') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('Missing value for --concurrency');
      }
      const parsed = Number.parseInt(value, 10);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error(`Invalid concurrency value '${value}'. Expected a positive integer.`);
      }
      options.concurrency = parsed;
      index += 2;
      continue;
    }

    // First positional argument is treated as format.
    if (!options.format) {
      options.format = arg as OutputFormat;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument '${arg}'`);
  }

  if (options.format !== 'avif' && options.format !== 'webp') {
    throw new Error(`Invalid format '${options.format ?? ''}'. Use 'avif' or 'webp'.`);
  }

  return options as CliOptions;
}

async function main(): Promise<void> {
  try {
    const options = parseCliArgs(process.argv.slice(2));
    if (!options) {
      printHelp();
      return;
    }

    await convertImages(options);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ ${message}\n`);
    printHelp();
    process.exitCode = 1;
  }
}

void main();
