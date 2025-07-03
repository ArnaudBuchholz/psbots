* Operators *must* have a **predictable** cycle length : **no iteration** should occur within a cycle, use `operatorState` to iterate.

* To enable debugging, operators *must* leave the engine in a *comprehensive* state when they **fail** :
  * the operand stack *must* reflect the operator parameters,
  * the dictionary stack *must* reflect the state *before* the operator was executed,
  * the call stack *might* not be changed.

* Some operators *may* modify the operand stack along the cycles, it is *acceptable* only if they do not fail during those cycles.

* When the operator requires several cycles, we must distinguish two **phases** :

  * `calling` : any failure *must* leave the engine as it was *before* executing the operator. Yet, the `operatorState` and call stack specific dictionary *might* be altered.

  * `popping` : as soon as the calling phase is completed, the operator already **impacted** the state of the engine. As a consequence, it is nearly impossible to revert the changes.

  * When failing, the operator state *must* reflect *which* phase failed.
