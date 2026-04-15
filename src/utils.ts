import * as path from 'path';
import * as fse from 'fs-extra';
import pLimit from 'p-limit';
import sharp from 'sharp';
import {
  createFileNameGenerator,
  DEFAULT_FILE_NAME_STRATEGY,
} from './filename-strategy';
import { type ConversionResult, type ConvertOptions, type OutputFormat } from './types';

export const DEFAULT_INPUT_DIR = './input_images';
export const DEFAULT_OUTPUT_DIR = './output_images';
export const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.tiff', '.bmp', '.avif'];

function normalizeFormat(format: string): OutputFormat {
  if (format === 'avif' || format === 'webp') {
    return format;
  }

  throw new Error(`Unsupported format '${format}'. Use 'avif' or 'webp'.`);
}

function convertWithSharp(inputPath: string, outputPath: string, format: OutputFormat) {
  if (format === 'avif') {
    return sharp(inputPath).avif({ effort: 9 }).toFile(outputPath);
  }

  return sharp(inputPath).webp({ effort: 6 }).toFile(outputPath);
}

async function processImage(
  file: string,
  current: number,
  total: number,
  format: OutputFormat,
  inputDir: string,
  outputDir: string,
  getNextOutputBaseName: (sourceFileName: string) => string,
): Promise<ConversionResult> {
  const fileExtension = path.extname(file).toLowerCase();
  const isNoOpCopy = format === 'avif' && fileExtension === '.avif';
  const inputPath = path.join(inputDir, file);
  const outputFileName = `${getNextOutputBaseName(file)}.${format}`;
  const outputPath = path.join(outputDir, outputFileName);

  if (isNoOpCopy) {
    console.log(`[${current}/${total}] Copying AVIF: ${file}`);
  } else {
    console.log(`[${current}/${total}] Converting: ${file}`);
  }

  try {
    const inputStats = await fse.stat(inputPath);
    const inputSizeMB = (inputStats.size / 1024 / 1024).toFixed(2);

    if (isNoOpCopy) {
      await fse.copy(inputPath, outputPath);

      let dimensions = { width: 0, height: 0 };
      try {
        const metadata = await sharp(inputPath).metadata();
        dimensions = {
          width: metadata.width || 0,
          height: metadata.height || 0,
        };
      } catch {
        console.log(`   ⚠️  Could not extract metadata for ${file}`);
      }

      console.log(`   ✅ Copied AVIF: ${outputFileName}`);
      console.log(`   📊 ${outputFileName} Size: ${inputSizeMB}MB (no conversion)`);
      if (dimensions.width > 0 && dimensions.height > 0) {
        console.log(`   📐 ${outputFileName} Dimensions: ${dimensions.width}x${dimensions.height}\n`);
      } else {
        console.log(`   📐 ${outputFileName} Dimensions: Unknown\n`);
      }

      return {
        fileName: file,
        success: true,
        inputSize: inputStats.size,
        outputSize: inputStats.size,
        dimensions,
      };
    }

    // Validate file as readable image before conversion.
    try {
      await sharp(inputPath).metadata();
    } catch (validationError) {
      throw new Error(
        `Invalid image file: ${validationError instanceof Error ? validationError.message : 'Unknown format'}`,
      );
    }

    const info = await convertWithSharp(inputPath, outputPath, format);
    const outputStats = await fse.stat(outputPath);
    const outputSizeMB = (outputStats.size / 1024 / 1024).toFixed(2);
    const reduction = ((1 - outputStats.size / inputStats.size) * 100).toFixed(1);

    const upper = format.toUpperCase();
    console.log(`   ✅ Converted to ${upper}: ${outputFileName}`);
    console.log(`   📊 ${outputFileName} Size: ${inputSizeMB}MB → ${outputSizeMB}MB (${reduction}% reduction)`);
    console.log(`   📐 ${outputFileName} Dimensions: ${info.width}x${info.height}\n`);

    return {
      fileName: file,
      success: true,
      inputSize: inputStats.size,
      outputSize: outputStats.size,
      dimensions: {
        width: info.width,
        height: info.height,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`   ❌ Error processing ${file}: ${errorMessage}\n`);

    return {
      fileName: file,
      success: false,
      error: errorMessage,
    };
  }
}

function displaySummary(results: ConversionResult[], format: OutputFormat, outputDir: string): void {
  console.log('━'.repeat(50));
  console.log('\n📊 Processing Summary:');

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  if (format === 'avif') {
    const converted = successful.filter((r) => r.inputSize !== r.outputSize);
    const copied = successful.filter((r) => r.inputSize === r.outputSize);

    console.log(`   ✅ Successfully processed: ${successful.length} image(s)`);
    if (converted.length > 0) {
      console.log(`      📤 Converted: ${converted.length} image(s)`);
    }
    if (copied.length > 0) {
      console.log(`      📋 Copied: ${copied.length} image(s)`);
    }

    if (converted.length > 0) {
      const totalInputSize = converted.reduce((sum, r) => sum + (r.inputSize || 0), 0);
      const totalOutputSize = converted.reduce((sum, r) => sum + (r.outputSize || 0), 0);
      const totalReduction = ((1 - totalOutputSize / totalInputSize) * 100).toFixed(1);
      console.log(`   💾 Size reduction (converted files): ${totalReduction}%`);
    }
  } else {
    console.log(`   ✅ Successfully converted: ${successful.length} image(s)`);
    if (successful.length > 0) {
      const totalInputSize = successful.reduce((sum, r) => sum + (r.inputSize || 0), 0);
      const totalOutputSize = successful.reduce((sum, r) => sum + (r.outputSize || 0), 0);
      const totalReduction = ((1 - totalOutputSize / totalInputSize) * 100).toFixed(1);
      console.log(`   💾 Total size reduction: ${totalReduction}%`);
    }
  }

  if (failed.length > 0) {
    const failedLabel = format === 'webp' ? 'Failed conversions' : 'Failed operations';
    console.log(`   ❌ ${failedLabel}: ${failed.length} image(s)`);
    failed.forEach((f) => {
      console.log(`      - ${f.fileName}: ${f.error}`);
    });
  }

  console.log(`   📁 Output directory: ${outputDir}\n`);
}

export async function convertImages(options: ConvertOptions): Promise<void> {
  const format = normalizeFormat(options.format);
  const inputDir = options.inputDir ?? DEFAULT_INPUT_DIR;
  const outputDir = options.outputDir ?? DEFAULT_OUTPUT_DIR;
  const concurrency = options.concurrency ?? 12;
  const fileNameStrategy = options.fileNameStrategy ?? DEFAULT_FILE_NAME_STRATEGY;

  console.log(`🚀 Starting image conversion to ${format.toUpperCase()}...\n`);

  try {
    const inputExists = await fse.pathExists(inputDir);
    if (!inputExists) {
      console.error(`❌ Input directory '${inputDir}' does not exist!`);
      return;
    }

    await fse.ensureDir(outputDir);
    console.log(`✅ Output directory '${outputDir}' is ready.\n`);
    console.log(`📝 File naming strategy: ${fileNameStrategy}\n`);

    const files = await fse.readdir(inputDir);
    const imageFiles = files.filter((file: string): boolean => {
      const ext = path.extname(file).toLowerCase();
      return SUPPORTED_EXTENSIONS.includes(ext);
    });

    if (imageFiles.length === 0) {
      console.log('⚠️  No supported image files found in the input directory.');
      return;
    }

    console.log(`📁 Found ${imageFiles.length} image(s) to convert:\n`);

    const getNextOutputBaseName = await createFileNameGenerator({
      outputDir,
      extension: format,
      strategy: fileNameStrategy,
    });

    const limit = pLimit(concurrency);
    const results: ConversionResult[] = await Promise.all(
      imageFiles.map((file, index) =>
        limit(() =>
          processImage(file, index + 1, imageFiles.length, format, inputDir, outputDir, getNextOutputBaseName),
        ),
      ),
    );

    displaySummary(results, format, outputDir);
  } catch (error) {
    console.error('❌ Fatal error:', error instanceof Error ? error.message : error);
  }
}
