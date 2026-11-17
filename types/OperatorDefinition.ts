import type { IOperatorTypeCheck } from './IOperatorTypeCheck.js';

export type OperatorDefinition<Input = IOperatorTypeCheck[]> = {
  name: string;
  ref: string;
  aliases?: string[];
  description: string;
  postScriptDeviation?: string;
  labels: (
    | 'array'
    | 'boolean'
    | 'callstack'
    | 'comparison'
    | 'conversion'
    | 'dictionary'
    | 'dictstack'
    | 'exception'
    | 'flow'
    | 'generic'
    | 'integer'
    | 'loop'
    | 'mark'
    | 'math'
    | 'operand'
    | 'permission'
    | 'value'
  )[];
  signature?: {
    input?: Input;
    output?: [...IOperatorTypeCheck[]];
    exceptions?: [string];
  };
  samples: {
    description?: string;
    in: string;
    out: string;
  }[];
};
