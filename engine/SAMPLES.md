# Samples

## Factorial

`n! = n * (n-1) * (n-2) * ... * 3 * 2 * 1`

```postscript
"factorial"
{
  %% check stack
  count 1 lt { stackunderflow } if
  dup type "integer" neq { typecheck } if

  1 exch
  %% result n
  loop {
    dup 2 lt { pop stop } if
    dup 3 1 roll mull
    exch
    1 sub
  }
} bind def
```
