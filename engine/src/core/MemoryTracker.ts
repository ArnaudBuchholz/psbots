import { SYSTEM_MEMORY_TYPE } from '@api/index.js';
import type {
  Value,
  IValueTracker,
  IMemoryTracker,
  MemoryType,
  IMemoryByType,
  IMemorySnapshot,
  Result
} from '@api/index.js';
import { assert, valuesOf } from '@sdk/index.js';

export const STRING_MEMORY_TYPE: MemoryType = 'string';

export const INTEGER_BYTES = 4;
export const POINTER_BYTES = 4;
export const VALUE_BYTES = 32;

const stringSizer = (data: string): number => {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  return buffer.length + 1; // terminal 0
};

type MemoryTrackerOptions = {
  /** Maximum memory allowed */
  total?: number;
  /** Keep track of register */
  debug?: boolean;
  experimentalGarbageCollector?: boolean;
};

export type MemorySize = {
  bytes?: number;
  integers?: number;
  pointers?: number;
  values?: number;
};

const memoryPointer = Symbol('MemoryTracker::MemoryPointer');

export type MemoryPointer = {
  [memoryPointer]: true;
  readonly bytes: number;
  readonly type: MemoryType;
};

export function addMemorySize(a: MemorySize, b: MemorySize): Required<MemorySize> {
  return {
    bytes: (a.bytes ?? 0) + (b.bytes ?? 0),
    integers: (a.integers ?? 0) + (b.integers ?? 0),
    pointers: (a.pointers ?? 0) + (b.pointers ?? 0),
    values: (a.values ?? 0) + (b.values ?? 0)
  };
}

export function memorySizeToBytes(size: MemorySize): number {
  const { bytes = 0, integers = 0, pointers = 0, values = 0 } = size;
  return bytes + integers * INTEGER_BYTES + pointers * POINTER_BYTES + values * VALUE_BYTES;
}

type ContainerRegisters = {
  container: WeakRef<object>;
  type: MemoryType;
  total: number;
  calls: {
    bytes: number;
    type: MemoryType;
    stack?: string;
  }[];
};

export interface IGarbageCollectible {
  /** Nothing more to collect when false is returned */
  collectGarbage(): boolean;
}

export class MemoryTracker implements IValueTracker, IMemoryTracker {
  private readonly _total: number = Number.POSITIVE_INFINITY;
  private _used: number = 0;
  private _peak: number = 0;
  private _byType: { [type in MemoryType]: number } = {
    system: 0,
    user: 0,
    string: 0
  };
  private _containers: WeakRef<object>[] = [];
  private _byContainers: WeakMap<object, ContainerRegisters> | undefined;

  private _experimentalGarbageCollector: boolean;
  public get experimentalGarbageCollector() {
    return this._experimentalGarbageCollector;
  }

  constructor(options: MemoryTrackerOptions = {}) {
    const { total = Number.POSITIVE_INFINITY } = options;
    this._total = total;
    if (options.debug) {
      this._byContainers = new WeakMap();
    }
    this._experimentalGarbageCollector = options.experimentalGarbageCollector ?? false;
  }

  /** Check if the requested memory size can be allocated, returns the equivalent number of bytes */
  isAvailable(size: MemorySize, type: MemoryType): Result<number> {
    assert(!!type);
    const bytes = memorySizeToBytes(size);
    assert(bytes > 0);
    if (this._used + bytes <= this._total) {
      return { success: true, value: bytes };
    }
    return { success: false, exception: 'vmOverflow' };
  }

  /** Allocate memory */
  allocate(size: MemorySize, type: MemoryType, container: object): Result<MemoryPointer> {
    assert(type !== 'string');
    const isAvailable = this.isAvailable(size, type);
    if (!isAvailable.success) {
      return isAvailable;
    }
    const { value: bytes } = isAvailable;
    this.register(bytes, type, container);
    return { success: true, value: { [memoryPointer]: true, bytes, type } };
  }

  /** Release memory (must pass the result of a previous allocation) */
  release({ bytes, type }: MemoryPointer, container: object): void {
    this.register(-bytes, type, container);
  }

  private register(bytes: number, type: MemoryType, container: object): Result<undefined> {
    if (bytes > 0) {
      if (this._used + bytes > this._total) {
        return { success: false, exception: 'vmOverflow' };
      }
    } else {
      assert(bytes < this._used);
    }
    this._byType[type] += bytes;
    this._used += bytes;
    this._peak = Math.max(this._used, this._peak);
    if (this._byContainers && container !== this /* exclude strings */) {
      let containerRegisters = this._byContainers.get(container);
      if (containerRegisters === undefined) {
        const containerWeakReference = new WeakRef(container);
        containerRegisters = {
          container: containerWeakReference,
          type,
          total: 0,
          calls: []
        };
        this._containers.push(containerWeakReference);
        this._byContainers.set(container, containerRegisters);
      }
      assert(containerRegisters.type === type, 'Unexpected memory type change', { bytes, type, container });
      containerRegisters.total += bytes;
      assert(containerRegisters.total >= 0, 'Invalid memory registration', { bytes, type, container });
      if (containerRegisters.total === 0) {
        const index = this._containers.findIndex(
          (containerWeakReference) => containerWeakReference.deref() === container
        );
        this._containers.splice(index, 1);
        this._byContainers.delete(container);
      } else {
        let stack: string | undefined;
        try {
          throw new Error('Capture call stack');
        } catch (error) {
          stack = (error as Error).stack;
        }
        containerRegisters.calls.push({ bytes, type, stack });
      }
    }
    return { success: true, value: undefined };
  }

  *enumContainersAllocations(): Generator<ContainerRegisters> {
    if (this._byContainers !== undefined) {
      for (const containerWeakReference of this._containers) {
        yield this._byContainers.get(containerWeakReference.deref()!)!;
      }
    }
  }

  private readonly _strings: Map<string, number> = new Map();

  /** returns the number of reference count */
  addStringRef(string: string): Result<number> {
    let referenceCount = this._strings.get(string) ?? 0;
    if (referenceCount === 0) {
      const size = stringSizer(string);
      const isMemoryAvailable = this.register(
        memorySizeToBytes({
          bytes: size,
          integers: 1
        }),
        STRING_MEMORY_TYPE,
        this
      );
      if (!isMemoryAvailable.success) {
        return isMemoryAvailable;
      }
    }
    this._strings.set(string, ++referenceCount);
    return { success: true, value: referenceCount };
  }

  public releaseString(string: string): boolean {
    const referenceCount = this._strings.get(string);
    assert(referenceCount !== undefined, 'Unable to release string as it is not referenced', string);
    if (referenceCount === 1) {
      const size = stringSizer(string);
      this.release(
        {
          [memoryPointer]: true,
          bytes: memorySizeToBytes({
            bytes: size,
            integers: 1
          }),
          type: STRING_MEMORY_TYPE
        },
        this
      );
      this._strings.delete(string);
      return false;
    }
    this._strings.set(string, referenceCount - 1);
    return true;
  }

  // region IMemoryTracker

  get used(): number {
    return this._used;
  }

  get peak(): number {
    return this._peak;
  }

  get total(): number {
    return this._total;
  }

  get byType(): IMemoryByType {
    return this._byType;
  }

  snapshot(): IMemorySnapshot {
    const result: IMemorySnapshot = {
      used: this._used,
      peak: this._peak,
      total: this._total,
      byType: this._byType,
      string: [],
      system: [],
      user: []
    };
    for (const [string, references] of this._strings.entries()) {
      const size = stringSizer(string);
      result.string.push({
        references,
        string,
        size,
        total: size + INTEGER_BYTES
      });
    }
    for (const { container, total, type, calls } of this.enumContainersAllocations()) {
      const info = {
        container: {
          class: '<unknown>'
        },
        total,
        calls
      };
      const containerInstance = container.deref();
      if (containerInstance !== undefined) {
        info.container.class = containerInstance.constructor.name;
      }
      if (type === SYSTEM_MEMORY_TYPE) {
        result.system.push(info);
      } else {
        result.user.push(info);
      }
    }
    return result;
  }

  // endregion

  // region IValueTracker (for string)

  addValueRef(value: Value): void {
    const string = valuesOf(value)[0];
    assert(typeof string === 'string');
    const isMemoryAvailable = this.addStringRef(string);
    assert(isMemoryAvailable);
    assert(isMemoryAvailable.value !== 1, 'addValueRef must not be used to create a new string ref');
  }

  releaseValue(value: Value): boolean {
    const string = valuesOf(value)[0];
    assert(typeof string === 'string');
    return this.releaseString(string);
  }

  // endregion IValueTracker (for string)

  // region Garbage Collector

  /** false when no more garbage collection needed */
  collectGarbage(): boolean {
    const [collectible] = this._gcQueue;
    if (!collectible) {
      return false;
    }
    if (!collectible.collectGarbage()) {
      this._gcQueue.shift();
    }
    return this._gcQueue.length > 0;
  }

  private _gcQueue: IGarbageCollectible[] = [];

  addToGarbageCollectorQueue(collectible: IGarbageCollectible): void {
    this._gcQueue.push(collectible);
  }

  get hasGarbageToCollect() {
    return this._gcQueue.length > 0;
  }

  // endregion Garbage Collector
}
