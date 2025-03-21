import fetch, { Response } from "node-fetch";
import { apiKeys } from "./config.js";
import { logger } from "./logger.js";
import {
  ResourceData,
  FreepikSuccessResponse,
  FreepikErrorResponse,
} from "./types/index.js";

let currentKeyIndex = 0;
export let dailyLimitEncountered = false;
const RETRY_ATTEMPTS = 3;

function isErrorResponse(obj: unknown): obj is FreepikErrorResponse {
  return (obj as FreepikErrorResponse).message !== undefined;
}

export async function fetchResourceInfo(
  resourceId: string
): Promise<ResourceData | null> {
  let attempts = 0;
  const maxKeyAttempts = apiKeys.length;
  while (attempts < maxKeyAttempts) {
    const currentKey = apiKeys[currentKeyIndex];
    const requestOptions = {
      method: "GET",
      headers: { "x-freepik-api-key": currentKey },
    };
    const apiUrl = `https://api.freepik.com/v1/resources/${resourceId}/download`;
    for (let i = 0; i < RETRY_ATTEMPTS; i++) {
      try {
        const response: Response = await fetch(apiUrl, requestOptions);
        const result: unknown = await response.json();
        if (isErrorResponse(result) && result.message.includes("daily limit")) {
          logger.error(
            `API key index ${currentKeyIndex} reached daily limit on resource ${resourceId}.`
          );
          break;
        }
        if (!response.ok) {
          logger.error(
            `Failed API call for resource ${resourceId}: ${
              (result as FreepikErrorResponse).message || response.statusText
            }`
          );
          return null;
        }
        return (result as FreepikSuccessResponse).data;
      } catch (err: any) {
        logger.warn(
          `Attempt ${i + 1} failed for resource ${resourceId}: ${err.message}`
        );
        if (i === RETRY_ATTEMPTS - 1) {
          logger.error(`Exceeded retry attempts for resource ${resourceId}`);
          return null;
        }
      }
    }
    attempts++;
    if (currentKeyIndex < apiKeys.length - 1) {
      currentKeyIndex++;
      logger.info(`Switching to API key index ${currentKeyIndex}`);
      continue;
    } else {
      dailyLimitEncountered = true;
      return null;
    }
  }
  return null;
}
