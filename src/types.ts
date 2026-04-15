import type { FileNameStrategy } from './filename-strategy';

export type OutputFormat = 'avif' | 'webp';

export interface ConversionResult {
  fileName: string;
  success: boolean;
  error?: string;
  inputSize?: number;
  outputSize?: number;
  dimensions?: {
    width: number;
    height: number;
  };
}

export interface ConvertOptions {
  format: OutputFormat;
  inputDir?: string;
  outputDir?: string;
  concurrency?: number;
  fileNameStrategy?: FileNameStrategy;
}
