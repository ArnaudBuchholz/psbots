# 🤖 psbots / engine

The engine part

## Warning

Even if largely inspired from the [PostScript engine](https://en.wikipedia.org/wiki/PostScript), this implementation takes some liberties.
In particular :

* Some operators (labelled as `not_standard`) are a deviation from the specification, please double check their definition
* Strings are **not** shared values, modifying a string (with `put`) creates a new string
