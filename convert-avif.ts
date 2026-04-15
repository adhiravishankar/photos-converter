// convertToAvif.ts

import * as path from 'path';
import * as fse from 'fs-extra';
import pLimit from 'p-limit'; // Import p-limit for concurrency control
import sharp from 'sharp';
import { v4 } from 'uuid'; // Importing UUID for unique file names

// Configuration
const INPUT_DIR = './input_images';
const OUTPUT_DIR = './output_images';

// Supported image extensions
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.tiff', '.bmp', '.avif'];

interface ConversionResult {
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

/**
 * Converts all images in the input directory to AVIF format
 */
async function convertImagesToAvif(): Promise<void> {
  console.log('🚀 Starting image conversion to AVIF...\n');

  try {
    // Ensure input directory exists
    const inputExists = await fse.pathExists(INPUT_DIR);
    if (!inputExists) {
      console.error(`❌ Input directory '${INPUT_DIR}' does not exist!`);
      return;
    }

    // Ensure output directory exists (create if it doesn't)
    await fse.ensureDir(OUTPUT_DIR);
    console.log(`✅ Output directory '${OUTPUT_DIR}' is ready.\n`);

    // Read all files from input directory
    const files = await fse.readdir(INPUT_DIR);

    // Filter for supported image files
    const imageFiles = files.filter((file: string): boolean => {
      const ext = path.extname(file).toLowerCase();
      return SUPPORTED_EXTENSIONS.includes(ext);
    });

    if (imageFiles.length === 0) {
      console.log('⚠️  No supported image files found in the input directory.');
      return;
    }

    console.log(`📁 Found ${imageFiles.length} image(s) to convert:\n`);

    // Process each image in parallel with concurrency limit
    const limit = pLimit(12); // Limit concurrency to 12
    const results: ConversionResult[] = await Promise.all(
      imageFiles.map((file, index) => limit(() => processImage(file, index + 1, imageFiles.length))),
    );

    // Display summary
    displaySummary(results);
  } catch (error) {
    console.error('❌ Fatal error:', error instanceof Error ? error.message : error);
  }
}

/**
 * Copy an existing AVIF file to the output directory with a new name
 */
async function copyAvifFile(file: string, current: number, total: number): Promise<ConversionResult> {
  const inputPath = path.join(INPUT_DIR, file);
  const outputFileName = `${v4()}.avif`;
  const outputPath = path.join(OUTPUT_DIR, outputFileName);

  console.log(`[${current}/${total}] Copying AVIF: ${file}`);

  try {
    // Get input file stats
    const inputStats = await fse.stat(inputPath);
    const inputSizeMB = (inputStats.size / 1024 / 1024).toFixed(2);

    // Copy the AVIF file directly without conversion
    await fse.copy(inputPath, outputPath);

    // Try to get image info for dimensions, but don't fail if it doesn't work
    let dimensions = { width: 0, height: 0 };
    try {
      const info = await sharp(inputPath).metadata();
      dimensions = {
        width: info.width || 0,
        height: info.height || 0,
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
      outputSize: inputStats.size, // Same size since no conversion
      dimensions,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`   ❌ Error copying AVIF ${file}: ${errorMessage}\n`);

    return {
      fileName: file,
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Convert a non-AVIF image file to AVIF format
 */
async function convertImageToAvif(file: string, current: number, total: number): Promise<ConversionResult> {
  const inputPath = path.join(INPUT_DIR, file);
  const outputFileName = `${v4()}.avif`;
  const outputPath = path.join(OUTPUT_DIR, outputFileName);

  console.log(`[${current}/${total}] Converting: ${file}`);

  try {
    // Get input file stats
    const inputStats = await fse.stat(inputPath);
    const inputSizeMB = (inputStats.size / 1024 / 1024).toFixed(2);

    // Validate that the file is a valid image before conversion
    try {
      await sharp(inputPath).metadata();
    } catch (validationError) {
      throw new Error(
        `Invalid image file: ${validationError instanceof Error ? validationError.message : 'Unknown format'}`,
      );
    }

    // Convert to AVIF using sharp [[8]]
    const info = await sharp(inputPath).avif({ effort: 9 }).toFile(outputPath); // Write the output image data to a file [[1]]

    // Get output file size
    const outputStats = await fse.stat(outputPath);
    const outputSizeMB = (outputStats.size / 1024 / 1024).toFixed(2);
    const reduction = ((1 - outputStats.size / inputStats.size) * 100).toFixed(1);

    console.log(`   ✅ Converted to AVIF: ${outputFileName}`);
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
    console.error(`   ❌ Error converting ${file}: ${errorMessage}\n`);

    return {
      fileName: file,
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Process a single image file
 */
async function processImage(file: string, current: number, total: number): Promise<ConversionResult> {
  const fileExtension = path.extname(file).toLowerCase();

  // Check if the file is already an AVIF file
  if (fileExtension === '.avif') {
    return await copyAvifFile(file, current, total);
  } else {
    return await convertImageToAvif(file, current, total);
  }
}

/**
 * Display conversion summary
 */
function displaySummary(results: ConversionResult[]): void {
  console.log('━'.repeat(50));
  console.log('\n📊 Processing Summary:');

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  // Count conversions vs copies
  const converted = successful.filter((r) => r.inputSize !== r.outputSize);
  const copied = successful.filter((r) => r.inputSize === r.outputSize);

  console.log(`   ✅ Successfully processed: ${successful.length} image(s)`);
  if (converted.length > 0) {
    console.log(`      📤 Converted: ${converted.length} image(s)`);
  }
  if (copied.length > 0) {
    console.log(`      📋 Copied: ${copied.length} image(s)`);
  }

  if (failed.length > 0) {
    console.log(`   ❌ Failed operations: ${failed.length} image(s)`);
    failed.forEach((f) => {
      console.log(`      - ${f.fileName}: ${f.error}`);
    });
  }

  // Calculate total size reduction (only for converted files)
  if (converted.length > 0) {
    const totalInputSize = converted.reduce((sum, r) => sum + (r.inputSize || 0), 0);
    const totalOutputSize = converted.reduce((sum, r) => sum + (r.outputSize || 0), 0);
    const totalReduction = ((1 - totalOutputSize / totalInputSize) * 100).toFixed(1);

    console.log(`   💾 Size reduction (converted files): ${totalReduction}%`);
  }

  console.log(`   📁 Output directory: ${OUTPUT_DIR}\n`);
}

// Run the conversion
convertImagesToAvif();
