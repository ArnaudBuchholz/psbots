const BUCKET_RANGE = 10;

let data;

function compute() {
  const numberOfLoops = document.querySelector('#loopCount').value;
  const eventSource = new EventSource(`http://localhost:8080/compute/${numberOfLoops}`);
  const progress = document.querySelector('.progress');
  data = [];

  eventSource.addEventListener('progress', (event) => {
    const chunk = JSON.parse(event.data);
    data.push(chunk);
    progress.innerHTML = `sample count: ${chunk.sampleCount}, cycles: ${chunk.cycles}, time spent: ${chunk.timeSpent}`;
  });

  eventSource.addEventListener('done', () => {
    eventSource.close();
    progress.innerHTML = 'Analyzing data...';
    setTimeout(analyze, 0);
  });
}

class TimeBucket {
  #count = 0;
  #ranges = [];
  #maxHit = 0;
  #min = Number.POSITIVE_INFINITY;
  #mean = 0;
  #max = 0;

  get min() {
    return this.#min;
  }

  get mean() {
    return this.#mean;
  }

  get max() {
    return this.#max;
  }

  add(duration) {
    ++this.#count;
    const index = Math.floor(duration / BUCKET_RANGE);
    if (this.#ranges[index]) {
      ++this.#ranges[index];
    } else {
      this.#ranges[index] = 1;
    }
    this.#maxHit = Math.max(this.#ranges[index], this.#maxHit);
  }

  clean() {
    const threshold = Math.ceil(this.#count / 100);
    let sum = 0;
    let count = 0;
    for (let index = 0; index < this.#ranges.length; ++index) {
      const value = this.#ranges[index] ?? 0;
      if (value < threshold) {
        delete this.#ranges[index];
      } else {
        this.#min = Math.min(this.#min, index);
        this.#max = Math.max(this.#max, index);
        sum += value * index;
        count += value;
      }
    }
    this.#mean = Math.floor(sum / count);
  }

  ratio(index) {
    return (this.#ranges[index] ?? 0) / this.#maxHit;
  }
}

const buckets = {};

function fillBuckets() {
  for (const { measures } of data) {
    for (const measure of measures.split(/[,|]/)) {
      // eslint-disable-next-line security/detect-unsafe-regex
      const [, type, name /* operatorState */, , baseDuration] = measure.match(/(\w)(?::([^=@]+))?(?:@(-?\d+))?=(\d+)/);
      const duration = Number.parseInt(baseDuration);
      if (type === 'p') {
        if (!buckets['-parser-']) {
          buckets['-parser-'] = new TimeBucket();
        }
        buckets['-parser-'].add(duration);
      } else if (type === 'o') {
        if (!buckets[`-${name}-`]) {
          buckets[`-${name}-`] = new TimeBucket();
        }
        buckets[`-${name}-`].add(duration);
      }
    }
  }
}

function newChild(parent, tagName) {
  const child = document.createElement(tagName);
  parent.append(child);
  return child;
}

function analyze() {
  fillBuckets();

  const keys = Object.keys(buckets).sort();
  const tbody = document.querySelector('tbody');
  tbody.innerHTML = '';
  for (const key of keys) {
    const bucket = buckets[key];
    bucket.clean();
    const row = newChild(tbody, 'tr');
    newChild(row, 'td').innerHTML = key;
    const bars = [];
    const colors = [
      '#FFFFFF', // White
      '#FFCCCC',
      '#FF9999',
      '#FF6666',
      '#FF3333',
      '#FF0000', // Red
      '#CC0000',
      '#990000',
      '#660000',
      '#330000'
    ];
    for (let index = 0; index < 100; ++index) {
      const ratio = bucket.ratio(index);
      if (ratio > 0) {
        const color = ratio === 1 ? colors.at(-1) : colors[Math.floor(ratio * colors.length)];
        bars.push(`<rect x="${index}" y="0" width="1" height="20" fill="${color}"/>`);
      }
    }
    newChild(row, 'td').innerHTML =
      `<svg width="100" height="20" version="1.1" xmlns="http://www.w3.org/2000/svg">${bars.join('')}</svg>`;
    newChild(row, 'td').innerHTML = bucket.min;
    newChild(row, 'td').innerHTML = bucket.mean;
    newChild(row, 'td').innerHTML = bucket.max;
  }

  document.querySelector('.progress').innerHTML = '';
  for (const span of document.querySelectorAll('.bucket_range')) {
    span.innerHTML = BUCKET_RANGE.toString();
  }
}

window.addEventListener('load', () => {
  document.querySelector('button').addEventListener('click', compute);
});
