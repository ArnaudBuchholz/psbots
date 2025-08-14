export class TimeBucket {
  static measure(from) {
    const now = performance.now();
    return from ? now - from : now;
  }

  static SCALE = 1_000_000;

  /** Returns best resolution for the current system */
  static getResolution() {
    const COUNT = 10_000;
    const powersOf10 = [];
    const scale = TimeBucket.SCALE;
    let last = performance.now() * scale;
    for (let index = 0; index < COUNT; ++index) {
      let now;
      do {
        now = performance.now() * scale;
      } while (now === last);
      let powerOf10 = Math.round(Math.log10(now - last));
      if (powerOf10 === Number.NEGATIVE_INFINITY) {
        powerOf10 = 0;
      }
      powersOf10[powerOf10] = (powersOf10[powerOf10] ?? 0) + 1;
      last = now;
    }
    let powerOf10 = 1;
    let countForPowerOf10 = 0;
    for (const [index, count] of powersOf10.entries()) {
      if (count && count > countForPowerOf10) {
        countForPowerOf10 = count;
        powerOf10 = index;
      }
    }
    return 10 ** powerOf10;
  }

  #resolution;
  #count;
  #ranges;
  #maxHits;

  constructor(resolution = TimeBucket.getResolution()) {
    this.#resolution = resolution;
    this.#count = 0;
    this.#ranges = [];
    this.#maxHits = 0;
  }

  get count() {
    return this.#count;
  }

  /** duration is expressed in ms (based on performance.now()) */
  add(duration) {
    ++this.#count;
    const index = Math.floor((duration * TimeBucket.SCALE) / this.#resolution);
    const rangeHits = (this.#ranges[index] ?? 0) + 1;
    this.#ranges[index] = rangeHits;
    this.#maxHits = Math.max(rangeHits, this.#maxHits);
  }

  /** returns { count, min, max, mean } when enough data (undefined otherwise) */
  cleanedStats(options = {}) {
    const { thresholdType = 'z-score', msUnitFactor = 1 } = options;
    let min = Number.POSITIVE_INFINITY;
    let max = 0;
    let sum = 0;
    let hitsTotal = 0;
    for (const index of Object.keys(this.#ranges)) {
      const hits = this.#ranges[index];
      const duration = (Number.parseInt(index) * this.#resolution * msUnitFactor) / TimeBucket.SCALE;
      sum += hits * duration;
      hitsTotal += hits;
    }
    let mean = sum / hitsTotal;
    let count = 0;
    if (thresholdType === 'z-score') {
      let sumOfVariances = 0;
      for (const index of Object.keys(this.#ranges)) {
        const hits = this.#ranges[index];
        const duration = (Number.parseInt(index) * this.#resolution * msUnitFactor) / TimeBucket.SCALE;
        const diff = duration - mean;
        const variance = diff * diff;
        sumOfVariances += hits * variance;
      }
      const standardDeviation = Math.sqrt(sumOfVariances / hitsTotal);
      sum = 0;
      for (const index of Object.keys(this.#ranges)) {
        const duration = (Number.parseInt(index) * this.#resolution * msUnitFactor) / TimeBucket.SCALE;
        if (duration < mean - 2 * standardDeviation || duration > mean + 2 * standardDeviation) {
          continue; // ignore
        }
        min = Math.min(min, duration);
        max = Math.max(max, duration);
        const hits = this.#ranges[index];
        sum += hits * duration;
        count += hits;
      }
    }
    if (count !== 0) {
      return {
        count,
        min,
        max,
        mean: sum / count,
        ignored: hitsTotal - count
      };
    }
  }
}
