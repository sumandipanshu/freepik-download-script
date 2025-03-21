export interface ResourceData {
  filename: string;
  url: string;
}

export interface FreepikSuccessResponse {
  data: ResourceData;
}

export interface FreepikErrorResponse {
  message: string;
}

export interface Options {
  batchNumber: number | null;
  batchSize: number;
  skipZip: boolean;
  forceZip: boolean;
  keepImages: boolean;
  storeMode: "file" | "memory";
}
