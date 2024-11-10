import { SYSTEM_MEMORY_TYPE } from '@api/index.js';
import type {
  Value,
  IValueTracker,
  IMemoryTracker,
  MemoryType,
  IMemoryByType,
  IMemorySnapshot,
  ValueType,
  Result
} from '@api/index.js';
import { assert, VmOverflowException } from '@sdk/index.js';

export const STRING_MEMORY_TYPE: MemoryType = 'string';

const INTEGER_BYTES = 4;
const POINTER_BYTES = 4;
const VALUE_BYTES = 32;

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
};

export type MemorySize = {
  bytes?: number;
  integers?: number;
  pointers?: number;
  values?: number;
};

export type MemoryRegistration = MemorySize & {
  type: MemoryType;
};

type ContainerRegisters = {
  container: WeakRef<object>;
  type: MemoryType;
  total: number;
  calls: (MemoryRegistration & { stack?: string })[];
};

export function addMemorySize(a: MemorySize, b: MemorySize): Required<MemorySize> {
  return {
    bytes: (a.bytes ?? 0) + (b.bytes ?? 0),
    integers: (a.integers ?? 0) + (b.integers ?? 0),
    pointers: (a.pointers ?? 0) + (b.pointers ?? 0),
    values: (a.values ?? 0) + (b.values ?? 0)
  };
}

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
    const { total = Infinity } = options;
    this._total = total;
    if (options.debug) {
      this._byContainers = new WeakMap();
    }
  }

  private readonly _strings: Map<string, number> = new Map();

  private _addStringRef(string: string): void {
    const refCount = this._strings.get(string) ?? 0;
    if (refCount === 0) {
      const size = stringSizer(string);
      this.register({
        container: this,
        type: STRING_MEMORY_TYPE,
        bytes: size,
        integers: 1
      });
    }
    this._strings.set(string, refCount + 1);
  }

  private _releaseString(string: string): boolean {
    const refCount = this._strings.get(string);
    assert(refCount !== undefined, 'Unable to release string as it is not referenced', string);
    if (refCount === 1) {
      const size = stringSizer(string);
      this.register({
        container: this,
        type: STRING_MEMORY_TYPE,
        bytes: -size,
        integers: -1
      });
      this._strings.delete(string);
      return false;
    }
    this._strings.set(string, refCount - 1);
    return true;
  }

  checkIfAvailable(details: MemorySize): Result<undefined, VmOverflowException> {
    // TODO: limit by type ?
    const { bytes = 0, integers = 0, pointers = 0, values = 0 } = details;
    const step = bytes + integers * INTEGER_BYTES + pointers * POINTER_BYTES + values * VALUE_BYTES;
    if (this._used + step <= this._total) {
      return { success: true, value: undefined };
    }
    return { success: false, error: new VmOverflowException() };
  }

  register(details: MemoryRegistration & { container: object }): Result<undefined, VmOverflowException> {
    const isAvailable = this.checkIfAvailable(details);
    if (!isAvailable.success) {
      return isAvailable;
    }
    const { type, bytes = 0, integers = 0, pointers = 0, values = 0 } = details;
    const step = bytes + integers * INTEGER_BYTES + pointers * POINTER_BYTES + values * VALUE_BYTES;
    this._byType[type] += step;
    this._used += step;
    this._peak = Math.max(this._used, this._peak);
    if (this._byContainers && details.container !== this /* exclude strings */) {
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
      assert(containerRegisters.type === type, 'Unexpected memory type change', details);
      containerRegisters.total += step;
      assert(containerRegisters.total >= 0, 'Invalid memory registration', details);
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
    return { success: true, value: undefined };
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
    this._addStringRef((value as Value<ValueType.string>).string);
  }

  releaseValue(value: Value): boolean {
    return this._releaseString((value as Value<ValueType.string>).string);
  }

  // endregion IValueTracker (for string)
}
