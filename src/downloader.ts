import fs from "fs";
import path from "path";
import JSZip from "jszip";
import fetch, { Response } from "node-fetch";
import { logger } from "./logger.js";
import { fetchResourceInfo } from "./api.js";
import { ResourceData } from "./types/index.js";

export async function processResource(
  resourceId: string,
  storeMode: "file" | "memory",
  imagesDir: string,
  memoryStorage: { [key: string]: Buffer }
): Promise<void> {
  logger.info(`Processing resource ID: ${resourceId}`);
  const resourceInfo: ResourceData | null = await fetchResourceInfo(resourceId);
  if (!resourceInfo) {
    logger.error(
      `Skipping resource ${resourceId} due to errors or daily limit.`
    );
    return;
  }
  const { filename, url } = resourceInfo;
  logger.info(`Downloading file: ${filename}`);
  try {
    const fileResponse: Response = await fetch(url);
    if (!fileResponse.ok) {
      logger.error(`Failed to download file for resource ${resourceId}`);
      return;
    }
    const buffer: Buffer = await fileResponse.buffer();
    if (storeMode === "file") {
      const filePath: string = path.join(imagesDir, filename);
      fs.writeFileSync(filePath, buffer);
      logger.info(`Saved file to ${filePath}`);
    } else {
      memoryStorage[filename] = buffer;
      logger.info(`Stored file ${filename} in memory.`);
    }
  } catch (error: any) {
    logger.error(`Error downloading resource ${resourceId}: ${error.message}`);
  }
}

export async function generateZip(
  storeMode: "file" | "memory",
  imagesDir: string,
  memoryStorage: { [key: string]: Buffer }
): Promise<void> {
  logger.info("Generating zip file from downloaded images...");
  try {
    const zip = new JSZip();
    if (storeMode === "file") {
      const files: string[] = fs.readdirSync(imagesDir);
      for (const file of files) {
        const filePath: string = path.join(imagesDir, file);
        const data: Buffer = fs.readFileSync(filePath);
        zip.file(file, data);
      }
    } else {
      for (const [filename, data] of Object.entries(memoryStorage)) {
        zip.file(filename, data);
      }
    }
    const zipBuffer: Buffer = await zip.generateAsync({ type: "nodebuffer" });
    const zipPath: string = path.join(imagesDir, "..", "freepik_resources.zip");
    fs.writeFileSync(zipPath, zipBuffer);
    logger.info(`Zip file saved to ${zipPath}`);
  } catch (error: any) {
    logger.error(`Error generating zip file: ${error.message}`);
  }
}
