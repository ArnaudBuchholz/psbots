# 🤖 psbots / engine

The engine part

## Warning

Even if largely inspired from the [PostScript engine](https://en.wikipedia.org/wiki/PostScript), this implementation does not strictly follow the specification.

In particular :

* **Many** types are missing :
  * `condition` *(❓might be implemented)*
  * `null` *(❓might be implemented)*
  * `file` *(❓might be implemented)*
  * `packed arrays`
  * `font`
  * `real`
  * `gstate`
  * `save` *(❓might be implemented)*
  * `lock` *(❓might be implemented)*

> types are reduced to their name without `type` suffix

* Some operators are not compliant with their official equivalent, please double check the definitions

* Strings are **not** shared values, modifying a string (for instance using  `put`) creates a new string

* The dictionary stack contains a `host` level by default, it enables the scripting host to inject its own operators (for instance `exit`).

## Syntax

### Tokens

The engine **parser** recognizes only **three** type of tokens, usually separated by indentation characters *(spaces, tabs or new lines)* :

* Integers : `1`, `-2` ...
* Strings : `"Hello World !"`, `"an escaped quote is \""`, `"abc"` ...
* Names *(or executable strings)* : `add`, `.`, `-`, `a"b` ... 
  * Almost anything that is not an integer or does not start with `"`
  * The following names are **explicitely** identified and extracted **separately** even without space between them :
    * `[` and `]` for arrays
    * `{` and `}` for blocks
    * `<<`, `«`, `>>` and `»` for dictionaries

### Complex objects

Special operators are designed to build complex objects :

* Arrays : `[ 1 2 3 ]`

* Blocks of code : `{ 1 2 add }`
  *  While composing a block, **no** names (other than `{`, `}`, `<<`, `«`, `>>` and `»`) are executed.

* Dictionaries : `<< test 123 method { 1 2 add } >>`
  *  While composing a dictionary, no names (other than `{`, `}`, `<<`, `«`, `>>` and `»`) are executed.
