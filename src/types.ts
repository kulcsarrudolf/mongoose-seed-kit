export interface MongooseSeederConfig {
  seedersPath: string;
  collectionName?: string;
  filePattern?: RegExp;
}

export interface SeederRunResult {
  name: string;
  status: "success" | "failed" | "skipped";
  error?: string;
}

export interface SeederStatus {
  name: string;
  status: "success" | "failed" | "pending";
  executedAt: Date | null;
  error: string | null;
}

export interface SeederRecord {
  name: string;
  executedAt: Date;
  status: "success" | "failed";
  error?: string;
}
