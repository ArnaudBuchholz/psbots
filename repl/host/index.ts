import { nullValue } from '@psbots/engine';
import type { Value, IReadOnlyDictionary } from '@psbots/engine';
import type { IReplIO } from '../IReplIo.js';
import { createExitOperator } from './exit.js';
import { createStateOperator } from './state.js';
import { createHelpOperator } from './help.js';
import { createPstackOperator } from './pstack.js';
import { createDebugOperator } from './debug.js';
import { createPerfOperator } from './perf.js';

export class ReplHostDictionary implements IReadOnlyDictionary {
  private mappings: Record<string, Value> = {};

  public get replIO() { return this._replIO; }

  constructor(private _replIO: IReplIO) {
    this.mappings['exit'] = createExitOperator(this);
    this.mappings['state'] = createStateOperator(this);
    this.mappings['help'] = createHelpOperator(this);
    this.mappings['pstack'] = createPstackOperator(this);
    this.mappings['debug'] = createDebugOperator(this);
    this.mappings['perf'] = createPerfOperator(this);
  }

  get names() {
    return Object.keys(this.mappings);
  }

  lookup(name: string): Value {
    return this.mappings[name] ?? nullValue;
  }

  private _exit = false;

  get exitCalled() {
    return this._exit;
  }

  exit() {
    this._exit = true;
  }

  private _debug = false;

  get debugIsOn() {
    return this._debug;
  }

  debug(on = true) {
    this._debug = on;
  }

  private _ready = Promise.resolve();
  get ready() {
    return this._ready;
  }

  private _blockCount = 0;
  private _unblock: (() => void) | undefined;
  
  public block() {
    if (++this._blockCount === 1) {
      this._ready = new Promise<void>((resolve) => {
        this._unblock = resolve;
      });
    }
  }

  public unblock() {
    if (--this._blockCount === 0) {
      this._unblock?.();
    }
  }
}
