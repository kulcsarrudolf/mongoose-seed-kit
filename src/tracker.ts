import mongoose from "mongoose";
import { SeederRecord } from "./types";

let indexesEnsured = false;

function getCollection(collectionName: string) {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error(
      "mongoose-seed-kit: mongoose is not connected. " +
        "Call runPendingSeeders() after mongoose.connect().",
    );
  }
  return db.collection(collectionName);
}

export async function ensureIndexes(collectionName: string): Promise<void> {
  if (indexesEnsured) return;
  const col = getCollection(collectionName);
  await col.createIndex({ name: 1 }, { unique: true });
  indexesEnsured = true;
}

export async function getExecutedSeeders(
  collectionName: string,
): Promise<SeederRecord[]> {
  const col = getCollection(collectionName);
  return col
    .find({ status: "success" })
    .toArray() as unknown as SeederRecord[];
}

export async function getAllTrackedSeeders(
  collectionName: string,
): Promise<SeederRecord[]> {
  const col = getCollection(collectionName);
  return col.find({}).toArray() as unknown as SeederRecord[];
}

export async function upsertSeederRecord(
  collectionName: string,
  record: SeederRecord,
): Promise<void> {
  const col = getCollection(collectionName);
  await col.updateOne(
    { name: record.name },
    { $set: record },
    { upsert: true },
  );
}

export async function deleteSeederRecord(
  collectionName: string,
  name: string,
): Promise<void> {
  const col = getCollection(collectionName);
  await col.deleteOne({ name });
}

export function resetIndexesFlag(): void {
  indexesEnsured = false;
}
