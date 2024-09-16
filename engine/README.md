# 🤖 psbots / engine

The engine part

## Warning

Even if largely inspired from the [PostScript engine](https://en.wikipedia.org/wiki/PostScript), this implementation takes some liberties.
In particular :

* Some types are missing :
  * name (replaced with executable string)
  * condition *(❓might be implemented)*
  * null *(❓might be implemented)*
  * file *(❓might be implemented)*
  * packed arrays
  * font
  * real
  * gstate
  * save *(❓might be implemented)*
  * lock *(❓might be implemented)*
* Some operators are a deviation from the specification, please double check their definition
* Strings are **not** shared values, modifying a string (for instance using  `put`) creates a new string
* The dictionary stack contains a `host` level
