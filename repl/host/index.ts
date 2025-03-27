import { nullValue } from '@psbots/engine';
import type { Value, IReadOnlyDictionary } from '@psbots/engine';
import type { IReplIO } from '../IReplIo.js';
import { createExitOperator } from './exit.js';
import { createStateOperator } from './state.js';
import { createHelpOperator } from './help.js';
import { createPstackOperator } from './pstack.js';
import { createDebugOperator } from './debug.js';

export class ReplHostDictionary implements IReadOnlyDictionary {
  private mappings: Record<string, Value> = {};

  constructor(replIO: IReplIO) {
    this.mappings['exit'] = createExitOperator(this);
    this.mappings['state'] = createStateOperator(replIO);
    this.mappings['help'] = createHelpOperator(replIO);
    this.mappings['pstack'] = createPstackOperator(replIO);
    this.mappings['debug'] = createDebugOperator(this);
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

  get debugCalled() {
    return this._debug;
  }

  debug() {
    this._debug = true;
  }
}
