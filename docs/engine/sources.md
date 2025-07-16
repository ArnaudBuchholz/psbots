# Sources analysis

## Sources

### api/Exception.ts
**Exported functions :**
* `function getExceptionMessage`
### api/interfaces/IReadOnlyArray.ts
**Exported functions :**
* `function enumIArrayValues`
### api/interfaces/IReadOnlyDictionary.ts
**Exported functions :**
* `function enumIDictionaryValues`
* `function convertIDictionaryToObject`
### api/parser.ts
**Exported functions :**
* `function parse`
### api/run.ts
**Exported functions :**
* `function run`
### core/MemoryTracker.ts
**Exported functions :**
* `function addMemorySize`
* `function memorySizeToBytes`
⚠️ Exported but not used (and not part of API or SDK)
### core/objects/AbstractValueContainer.ts
### core/objects/dictionaries/Dictionary.ts
### core/objects/dictionaries/Empty.ts
### core/objects/dictionaries/System.ts
### core/objects/ShareableObject.ts
### core/objects/stacks/CallStack.ts
### core/objects/stacks/DictionaryStack.ts
### core/objects/stacks/ValueStack.ts
### core/objects/ValueArray.ts
### core/operators/array/aload.ts
### core/operators/array/closeArray.ts
### core/operators/array/openArray.ts
### core/operators/boolean/and.ts
### core/operators/boolean/or.ts
### core/operators/boolean/xor.ts
### core/operators/dictionary/closeDictionary.ts
### core/operators/dictionary/openDictionary.ts
### core/operators/exceptions/dictStackUnderflow.ts
### core/operators/exceptions/invalidAccess.ts
### core/operators/exceptions/limitcheck.ts
### core/operators/exceptions/rangeCheck.ts
### core/operators/exceptions/stackUnderflow.ts
### core/operators/exceptions/stop.ts
### core/operators/exceptions/typeCheck.ts
### core/operators/exceptions/undefined.ts
### core/operators/exceptions/undefinedResult.ts
### core/operators/exceptions/unmatchedMark.ts
### core/operators/exceptions/vmOverflow.ts
### core/operators/flow/closeBlock.ts
### core/operators/flow/finally.ts
### core/operators/flow/gc.ts
### core/operators/flow/if.ts
### core/operators/flow/ifelse.ts
### core/operators/flow/loop.ts
### core/operators/flow/openBlock.ts
### core/operators/flow/repeat.ts
### core/operators/flow/stopped.ts
### core/operators/integer/abs.ts
### core/operators/integer/add.ts
### core/operators/integer/div.ts
### core/operators/integer/gt.ts
### core/operators/integer/gte.ts
### core/operators/integer/lt.ts
### core/operators/integer/lte.ts
### core/operators/integer/mul.ts
### core/operators/integer/sub.ts
### core/operators/openClose.ts
**Exported functions :**
* `function openWithMark`
* `function pushOpenClosedValueWithDebugInfo`
* `function closeToMark`
### core/operators/operators.ts
**Exported functions :**
* `function buildFunctionOperator`
* `function buildConstantOperator`
### core/operators/stacks/call/countexecstack.ts
### core/operators/stacks/dictionary/begin.ts
### core/operators/stacks/dictionary/bind.ts
### core/operators/stacks/dictionary/countdictstack.ts
### core/operators/stacks/dictionary/currentdict.ts
### core/operators/stacks/dictionary/def.ts
### core/operators/stacks/dictionary/end.ts
### core/operators/stacks/dictionary/globaldict.ts
### core/operators/stacks/dictionary/hostdict.ts
### core/operators/stacks/dictionary/systemdict.ts
### core/operators/stacks/dictionary/userdict.ts
### core/operators/stacks/operand/clear.ts
### core/operators/stacks/operand/cleartomark.ts
### core/operators/stacks/operand/count.ts
### core/operators/stacks/operand/counttomark.ts
### core/operators/stacks/operand/dup.ts
### core/operators/stacks/operand/exch.ts
### core/operators/stacks/operand/indexOp.ts
### core/operators/stacks/operand/pop.ts
### core/operators/stacks/operand/roll.ts
### core/operators/value/convert/cvi.ts
### core/operators/value/convert/cvlit.ts
### core/operators/value/convert/cvn.ts
### core/operators/value/eq.ts
### core/operators/value/false.ts
### core/operators/value/get.ts
### core/operators/value/length.ts
### core/operators/value/mark.ts
### core/operators/value/neq.ts
### core/operators/value/put.ts
### core/operators/value/true.ts
### core/operators/value/type.ts
### core/operators/value/version.ts
### core/operators/value/wcheck.ts
### core/operators/value/xcheck.ts
### core/state/block.ts
**Exported functions :**
* `function blockCycle`
### core/state/call.ts
**Exported functions :**
* `function callCycle`
### core/state/operator.ts
**Exported functions :**
* `function operatorPop`
* `function operatorCycle`
### core/state/parse.ts
**Exported functions :**
* `function parseCycle`
### core/state/State.ts
### sdk/assert.ts
**Exported functions :**
* `function assert`
### sdk/checkPos.ts
**Exported functions :**
* `function checkPos`
### sdk/checks/isObject.ts
**Exported functions :**
* `function isObject`
### sdk/checks/isValue.ts
**Exported functions :**
* `function isIntegerValue`
* `function isStringValue`
* `function isNameValue`
* `function isOperatorValue`
* `function isArrayValue`
* `function isDictionaryValue`
### sdk/findMarkPos.ts
**Exported functions :**
* `function findMarkPos`
### sdk/toString.ts
**Exported functions :**
* `function valueToString`
* `function callStackToString`
### sdk/toValue.ts
**Exported functions :**
* `function toIntegerValue`
* `function toStringValue`
* `function toNameValue`
### sdk/valuesOf.ts
**Exported functions :**
* `function valuesOf`