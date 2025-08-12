export const TimeBucket = {
  /** Returns best resolution for the current system (microseconds) */
  getResolution() {
    const COUNT = 10_000;
    const powersOf10 = [];
    let last = performance.now() * 1_000_000;
    for (let index = 0; index < COUNT; ++index) {
      let now;
      do {
        now = performance.now() * 1_000_000;
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
  },

  constructor(resolution = TimeBucket.getResolution()) {
    this.#resolution = resolution;
    this.#count = 0;
    this.#ranges = [];
    this.#maxHits = 0;
  },

  add(duration) {
    ++this.#count;
    const index = Math.floor(duration / this.#resolution);
    const rangeHits = (this.#ranges[index] ?? 0) + 1;
    this.#ranges[index] = rangeHits;
    this.#maxHits = Math.max(rangeHits, this.#maxHits);
  }
};
