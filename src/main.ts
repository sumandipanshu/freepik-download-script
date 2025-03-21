import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "./logger.js";
import { apiKeys, resourceIds as configResourceIds } from "./config.js";
import { Options } from "./types/index.js";
import { asyncPool } from "./utils/asyncPool.js";
import { processResource, generateZip } from "./downloader.js";
import { dailyLimitEncountered } from "./api.js";

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);

// Remove duplicate resource IDs
const resourceIds: string[] = Array.from(new Set(configResourceIds));

const DEFAULT_BATCH_SIZE = 50;
const CONCURRENCY_LIMIT = 5;

/**
 * Parses command-line arguments and returns an Options object.
 */
function parseArgs(): Options {
  const options: Options = {
    batchNumber: null,
    batchSize: DEFAULT_BATCH_SIZE,
    skipZip: false,
    forceZip: false,
    keepImages: false,
    storeMode: "file",
  };

  const args: string[] = process.argv.slice(2);
  args.forEach((arg: string): void => {
    if (arg.startsWith("--batch=")) {
      const value: string = arg.split("=")[1];
      const num: number = parseInt(value, 10);
      if (!isNaN(num) && num > 0) {
        options.batchNumber = num;
      } else {
        logger.error("Invalid batch number provided.");
        process.exit(1);
      }
    } else if (arg === "--all") {
      options.batchNumber = null;
    } else if (arg === "--skip-zip") {
      options.skipZip = true;
    } else if (arg === "--force-zip") {
      options.forceZip = true;
    } else if (arg.startsWith("--batch-size=")) {
      const value: string = arg.split("=")[1];
      const num: number = parseInt(value, 10);
      if (!isNaN(num) && num > 0) {
        options.batchSize = num;
      } else {
        logger.error("Invalid batch size provided.");
        process.exit(1);
      }
    } else if (arg.startsWith("--store=")) {
      const value: string = arg.split("=")[1];
      if (value === "memory" || value === "file") {
        options.storeMode = value;
      } else {
        logger.error("Invalid store mode. Use 'memory' or 'file'.");
        process.exit(1);
      }
    } else if (arg === "--keep-images") {
      options.keepImages = true;
    }
  });

  if (options.forceZip) {
    options.skipZip = false;
  }
  return options;
}

async function main(): Promise<void> {
  const options: Options = parseArgs();
  let resourceSubset: string[];
  if (options.batchNumber !== null) {
    const startIndex: number = (options.batchNumber - 1) * options.batchSize;
    const endIndex: number = startIndex + options.batchSize;
    resourceSubset = resourceIds.slice(startIndex, endIndex);
    if (resourceSubset.length === 0) {
      logger.info("No resource IDs in this batch. Exiting.");
      process.exit(0);
    }
    logger.info(
      `Processing batch ${options.batchNumber}: ${resourceSubset.length} resource(s) with batch size ${options.batchSize}`
    );
  } else {
    resourceSubset = resourceIds;
    logger.info(
      `Processing all resources: ${resourceSubset.length} resource(s)`
    );
  }

  const imagesDir: string = path.join(__dirname, "images");
  if (options.storeMode === "file" && !fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }
  const memoryStorage: { [key: string]: Buffer } = {};

  await asyncPool(
    CONCURRENCY_LIMIT,
    resourceSubset,
    async (id: string): Promise<void> => {
      await processResource(id, options.storeMode, imagesDir, memoryStorage);
    }
  );

  if (dailyLimitEncountered && !options.forceZip) {
    logger.info(
      "Daily limit encountered and forceZip flag not set. Skipping zip creation."
    );
    options.skipZip = true;
  }

  if (!options.skipZip) {
    await generateZip(options.storeMode, imagesDir, memoryStorage);
    if (options.storeMode === "file" && !options.keepImages) {
      fs.rmSync(imagesDir, { recursive: true, force: true });
      logger.info("Images folder deleted after zipping.");
    }
  } else {
    logger.info("Skipping zip creation. Downloaded images remain as is.");
  }

  logger.info("Processing complete.");
}

main().catch((error: any): void => {
  logger.error(`Unexpected error: ${error.message}`);
  process.exit(1);
});
