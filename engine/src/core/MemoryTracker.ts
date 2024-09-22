import type { Value, IValueTracker, IMemoryTracker, MemoryType, IMemoryByType } from '@api/index.js';
import { InternalException, VmOverflowException, checkStringValue, formatBytes } from '@sdk/index.js';

export const STRING_MEMORY_TYPE: MemoryType = 'string';

const stringSizer = (data: string): number => {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  return buffer.length + 1; // terminal 0
};

type MemoryTrackerOptions = {
  /** Maximum memory allowed */
  total?: number;
  /** Minimum length for a string to be cached (default: 32) */
  stringCacheThreshold?: number;
  /** Keep track of register */
  debug?: boolean;
};

type ContainerRegisters = {
  container: WeakRef<object>;
  type: MemoryType;
  total: number;
  calls: (Omit<MemoryRegistrationDetails, 'container'> & { stack?: string })[];
};

type MemoryRegistrationDetails = {
  type: MemoryType;
  container: object;
  bytes?: number;
  integers?: number;
  pointers?: number;
  values?: number;
};

export class MemoryTracker implements IValueTracker, IMemoryTracker {
  private readonly _total: number = Infinity;
  private _used: number = 0;
  private _peak: number = 0;
  private _byType: { [type in MemoryType]: number } = {
    system: 0,
    user: 0,
    string: 0
  };
  private _containers: WeakRef<object>[] = [];
  private _byContainers: WeakMap<object, ContainerRegisters> | undefined;

  constructor(options: MemoryTrackerOptions = {}) {
    const { total = Infinity, stringCacheThreshold = 32 } = options;
    this._total = total;
    this._stringCacheThreshold = stringCacheThreshold;
    if (options.debug) {
      this._byContainers = new WeakMap();
    }
  }

  private readonly _stringCacheThreshold: number;
  private readonly _strings: string[] = [];
  private readonly _stringsRefCount: number[] = [];

  private _addStringRef(string: string): void {
    const size = stringSizer(string);
    if (string.length >= this._stringCacheThreshold) {
      const pos = this._strings.indexOf(string);
      if (pos === -1) {
        this._strings.push(string);
        this._stringsRefCount.push(1);
        this.register({
          container: this,
          type: STRING_MEMORY_TYPE,
          bytes: size,
          integers: 1
        });
        return;
      }
      ++this._stringsRefCount[pos]!; // _strings & _stringsRefCount are in sync
      return;
    }
    this.register({
      container: this,
      type: STRING_MEMORY_TYPE,
      bytes: size
    });
  }

  private _releaseString(string: string): boolean {
    const size = stringSizer(string);
    if (string.length >= this._stringCacheThreshold) {
      const pos = this._strings.indexOf(string);
      const refCount = --this._stringsRefCount[pos]!; // _strings & _stringsRefCount are in sync
      if (refCount === 0) {
        this.register({
          container: this,
          type: STRING_MEMORY_TYPE,
          bytes: -size,
          integers: -1
        });
        return false;
      }
      return true;
    }
    this.register({
      container: this,
      type: STRING_MEMORY_TYPE,
      bytes: -size
    });
    return false;
  }

  register(details: MemoryRegistrationDetails) {
    const { type, bytes = 0, integers = 0, pointers = 0, values = 0 } = details;
    const step = bytes + integers * 4 + pointers * 4 + values * 32;
    this._byType[type] += step;
    this._used += step;
    if (this._used > this._total) {
      throw new VmOverflowException();
    }
    this._peak = Math.max(this._used, this._peak);
    if (this._byContainers) {
      const { container, ...other } = details;
      let containerRegisters = this._byContainers.get(container);
      if (containerRegisters === undefined) {
        const containerRef = new WeakRef(container);
        containerRegisters = {
          container: containerRef,
          type,
          total: 0,
          calls: []
        };
        this._containers.push(containerRef);
        this._byContainers.set(container, containerRegisters);
      }
      if (containerRegisters.type !== type) {
        throw new InternalException('Unexpected memory type change');
      }
      containerRegisters.total += step;
      if (containerRegisters.total < 0) {
        throw new InternalException('Invalid memory registration');
      }
      if (containerRegisters.total !== 0) {
        let stack: string | undefined;
        try {
          throw new Error();
        } catch (e) {
          stack = (e as Error).stack;
        }
        containerRegisters.calls.push({ ...other, stack });
      } else {
        const index = this._containers.findIndex((containerRef) => containerRef.deref() === container);
        this._containers.splice(index, 1);
        this._byContainers.delete(container);
      }
    }
  }

  report(): string {
    return `used: ${formatBytes(this.used)}`;
  }

  *enumContainersAllocations(): Generator<ContainerRegisters> {
    if (this._byContainers !== undefined) {
      for (const containerRef of this._containers) {
        yield this._byContainers.get(containerRef.deref()!)!;
      }
    }
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

  // endregion

  // region IValueTracker (for string)

  addValueRef(value: Value): void {
    checkStringValue(value);
    this._addStringRef(value.string);
  }

  releaseValue(value: Value): boolean {
    checkStringValue(value);
    return this._releaseString(value.string);
  }

  // endregion IValueTracker (for string)
}
