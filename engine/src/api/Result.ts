export type Result<Value = undefined, E extends Error = Error> =
  | {
      success: false;
      error: E;
    }
  | {
      success: true;
      value: Value;
    };
