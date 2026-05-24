export type Experience = {
  state: string;
  driverId: string;
  shipmentId: string;

  reward: number;
  value: number;

  nextState?: string;
};

const buffer: Experience[] = [];

const MAX_SIZE = 2000;

/**
 * 🧠 STORE EXPERIENCE
 */
export function storeExperience(exp: Experience) {
  buffer.push(exp);

  if (buffer.length > MAX_SIZE) {
    buffer.shift(); // remove oldest
  }
}

/**
 * 📦 SAMPLE RANDOM BATCH
 */
export function sampleBatch(size = 32) {
  const batch: Experience[] = [];

  for (let i = 0; i < size; i++) {
    const idx = Math.floor(
      Math.random() * buffer.length
    );

    if (buffer[idx]) {
      batch.push(buffer[idx]);
    }
  }

  return batch;
}

/**
 * 📊 GET BUFFER SIZE
 */
export function bufferSize() {
  return buffer.length;
}