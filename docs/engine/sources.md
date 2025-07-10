# Sources

## Dependencies

### api/Exception.ts
### api/interfaces/IAbstractOperator.ts
### api/interfaces/IAbstractValue.ts
### api/interfaces/IArray.ts
### api/interfaces/IDebugSource.ts
### api/interfaces/IDictionary.ts
### api/interfaces/IMemoryTracker.ts
### api/interfaces/IReadOnlyArray.ts

<span style="color: red;"><code>export</code></span> `function enumIArrayValues `
### api/interfaces/IReadOnlyCallStack.ts
### api/interfaces/IReadOnlyDictionary.ts

<span style="color: red;"><code>export</code></span> `function enumIDictionaryValues (1)`

<span style="color: red;"><code>export</code></span> `function convertIDictionaryToObject `

  → `enumIDictionaryValues`
### api/interfaces/IState.ts
### api/interfaces/IValueTracker.ts
### api/parser.ts

`function parseNumber `

  → `assert`

`function parseName `

  → `assert` (3)

<span style="color: red;"><code>export</code></span> `function parse (3)`

  → `assert`

  → `parseString`

  → `parseNumber`

  → `parseName`
### api/Result.ts
### api/run.ts

<span style="color: red;"><code>export</code></span> `class RunError`

<span style="color: red;"><code>export</code></span> `function run `

  → `toStringValue`
### api/values/ArrayValue.ts
### api/values/BooleanValue.ts
### api/values/DictionaryValue.ts
### api/values/IntegerValue.ts
### api/values/MarkValue.ts
### api/values/NameValue.ts
### api/values/NullValue.ts
### api/values/OperatorValue.ts
### api/values/StringValue.ts
### api/values/Value.ts
### api/values/ValueType.ts
### core/MemoryTracker.ts

<span style="color: red;"><code>export</code></span> `class MemoryTracker`

`MemoryTracker::isAvailable`

  → `assert` (2)

  → `memorySizeToBytes`

`MemoryTracker::allocate`

  → `assert`

`MemoryTracker::register`

  → `assert` (3)

`MemoryTracker::addStringRef`

  → `stringSizer`

  → `memorySizeToBytes`

`MemoryTracker::releaseString`

  → `assert`

  → `stringSizer`

  → `memorySizeToBytes`

`MemoryTracker::snapshot`

  → `stringSizer`

`MemoryTracker::addValueRef`

  → `valuesOf`

  → `assert` (3)

`MemoryTracker::releaseValue`

  → `valuesOf`

  → `assert`

<span style="color: red;"><code>export</code></span> `function addMemorySize (4)`

<span style="color: red;"><code>export</code></span> `function memorySizeToBytes (3)`
### core/objects/AbstractValueContainer.ts

<span style="color: red;"><code>export</code></span> `class AbstractValueContainer`

`AbstractValueContainer::toValue`

  → `assert`

`AbstractValueContainer::constructor`

  → `assert` (3)

`AbstractValueContainer::createInstance`

  → `assert` (2)

`AbstractValueContainer::getSize`

  → `addMemorySize`

`AbstractValueContainer::reserve`

  → `assert`

`AbstractValueContainer::swap`

  → `assert`
### core/objects/dictionaries/Dictionary.ts

<span style="color: red;"><code>export</code></span> `class Dictionary`

`Dictionary::toValue`

  → `assert`

`Dictionary::constructor`

  → `assert`

`Dictionary::getSize`

  → `addMemorySize`

`Dictionary::def`

  → `assert`
### core/objects/dictionaries/Empty.ts

<span style="color: red;"><code>export</code></span> `class EmptyDictionary`

`EmptyDictionary::def`

  → `assert` (2)
### core/objects/dictionaries/System.ts

<span style="color: red;"><code>export</code></span> `class SystemDictionary`
### core/objects/ShareableObject.ts

<span style="color: red;"><code>export</code></span> `class ShareableObject`

`ShareableObject::release`

  → `assert`

`function getShareableObject `

  → `assert`
### core/objects/stacks/CallStack.ts

<span style="color: red;"><code>export</code></span> `class CallStack`

`CallStack::create`

  → `assert`

`CallStack::getSize`

  → `addMemorySize`

`CallStack::getIncrementSize`

  → `addMemorySize`

`CallStack::topOperatorState`

  → `assert`

`CallStack::topOperatorState`

  → `assert`
### core/objects/stacks/DictionaryStack.ts

<span style="color: red;"><code>export</code></span> `class DictionaryStack`

`DictionaryStack::create`

  → `assert` (2)

`DictionaryStack::getDictionaryValue`

  → `assert`

`DictionaryStack::setGlobal`

  → `assert`

`DictionaryStack::setUser`

  → `assert`
### core/objects/stacks/ValueStack.ts

<span style="color: red;"><code>export</code></span> `class ValueStack`
### core/objects/ValueArray.ts

<span style="color: red;"><code>export</code></span> `class ValueArray`

`ValueArray::toValue`

  → `assert`
### core/operators/array/aload.ts

→ `buildFunctionOperator`

`function (anonymous arrow) `

  → `assert`
### core/operators/array/closeArray.ts

→ `buildFunctionOperator`

`function (anonymous arrow) `

  → `closeToMark`
### core/operators/array/openArray.ts

→ `buildFunctionOperator`
### core/operators/boolean/and.ts

→ `buildFunctionOperator`
### core/operators/boolean/or.ts

→ `buildFunctionOperator`
### core/operators/boolean/xor.ts

→ `buildFunctionOperator`
### core/operators/dictionary/closeDictionary.ts

→ `buildFunctionOperator`

`function (anonymous arrow) `

  → `findMarkPos`

  → `valuesOf`

  → `pushOpenClosedValueWithDebugInfo`
### core/operators/dictionary/openDictionary.ts

→ `buildFunctionOperator`

`function (anonymous arrow) `

  → `openWithMark`
### core/operators/exceptions/dictStackUnderflow.ts

→ `buildFunctionOperator`
### core/operators/exceptions/invalidAccess.ts

→ `buildFunctionOperator`
### core/operators/exceptions/limitcheck.ts

→ `buildFunctionOperator`
### core/operators/exceptions/rangeCheck.ts

→ `buildFunctionOperator`
### core/operators/exceptions/stackUnderflow.ts

→ `buildFunctionOperator`
### core/operators/exceptions/stop.ts

→ `buildFunctionOperator`
### core/operators/exceptions/typeCheck.ts

→ `buildFunctionOperator`
### core/operators/exceptions/undefined.ts

→ `buildFunctionOperator`
### core/operators/exceptions/undefinedResult.ts

→ `buildFunctionOperator`
### core/operators/exceptions/unmatchedMark.ts

→ `buildFunctionOperator`
### core/operators/exceptions/vmOverflow.ts

→ `buildFunctionOperator`
### core/operators/flow/closeBlock.ts

→ `buildFunctionOperator`

`function (anonymous arrow) `

  → `closeToMark`
### core/operators/flow/finally.ts

→ `buildFunctionOperator`

`function firstCall `

  → `assert`

`function callBeforePop `

  → `toStringValue`

  → `assert` (2)

`function popping `

  → `assert` (2)

`function (anonymous arrow) `

  → `firstCall`

  → `callBeforePop`

  → `assert`

  → `popping`
### core/operators/flow/gc.ts

→ `buildFunctionOperator`

`function (anonymous arrow) `

  → `assert`
### core/operators/flow/if.ts

→ `buildFunctionOperator`
### core/operators/flow/ifelse.ts

→ `buildFunctionOperator`
### core/operators/flow/loop.ts

→ `buildFunctionOperator`

`function (anonymous arrow) `

  → `assert`
### core/operators/flow/openBlock.ts

→ `buildFunctionOperator`

`function (anonymous arrow) `

  → `openWithMark`
### core/operators/flow/repeat.ts

→ `buildFunctionOperator`

`function (anonymous arrow) `

  → `firstCall`

  → `repeat`
### core/operators/flow/stopped.ts

→ `buildFunctionOperator`

`function (anonymous arrow) `

  → `assert`
### core/operators/integer/abs.ts

→ `buildFunctionOperator`

`function (anonymous arrow) `

  → `toIntegerValue`
### core/operators/integer/add.ts

→ `buildFunctionOperator`

`function (anonymous arrow) `

  → `toIntegerValue`
### core/operators/integer/div.ts

→ `buildFunctionOperator`

`function (anonymous arrow) `

  → `toIntegerValue` (2)
### core/operators/integer/gt.ts

→ `buildFunctionOperator`
### core/operators/integer/gte.ts

→ `buildFunctionOperator`
### core/operators/integer/lt.ts

→ `buildFunctionOperator`
### core/operators/integer/lte.ts

→ `buildFunctionOperator`
### core/operators/integer/mul.ts

→ `buildFunctionOperator`

`function (anonymous arrow) `

  → `toIntegerValue`
### core/operators/integer/sub.ts

→ `buildFunctionOperator`

`function (anonymous arrow) `

  → `toIntegerValue`
### core/operators/openClose.ts

<span style="color: red;"><code>export</code></span> `function openWithMark (2)`

<span style="color: red;"><code>export</code></span> `function pushOpenClosedValueWithDebugInfo (2)`

<span style="color: red;"><code>export</code></span> `function closeToMark (2)`

  → `findMarkPos`

  → `toIntegerValue`

  → `assert` (4)

  → `pushOpenClosedValueWithDebugInfo`
### core/operators/operators.ts

<span style="color: red;"><code>export</code></span> `function buildFunctionOperator (68)`

  → `assert`

<span style="color: red;"><code>export</code></span> `function buildConstantOperator (4)`
### core/operators/stacks/call/countexecstack.ts

→ `buildFunctionOperator`

`function (anonymous arrow) `

  → `toIntegerValue`

  → `assert`
### core/operators/stacks/dictionary/begin.ts

→ `buildFunctionOperator`
### core/operators/stacks/dictionary/bind.ts

→ `buildFunctionOperator`

`function bindValue `

  → `bindName`

  → `assert`

  → `bindArray`

`function (anonymous arrow) `

  → `assert` (2)

  → `isArrayValue`

  → `bindValue`
### core/operators/stacks/dictionary/countdictstack.ts

→ `buildFunctionOperator`

`function (anonymous arrow) `

  → `toIntegerValue`

  → `assert`
### core/operators/stacks/dictionary/currentdict.ts

→ `buildFunctionOperator`
### core/operators/stacks/dictionary/def.ts

→ `buildFunctionOperator`
### core/operators/stacks/dictionary/end.ts

→ `buildFunctionOperator`
### core/operators/stacks/dictionary/globaldict.ts

→ `buildFunctionOperator`
### core/operators/stacks/dictionary/hostdict.ts

→ `buildFunctionOperator`
### core/operators/stacks/dictionary/systemdict.ts

→ `buildFunctionOperator`
### core/operators/stacks/dictionary/userdict.ts

→ `buildFunctionOperator`
### core/operators/stacks/operand/clear.ts

→ `buildFunctionOperator`
### core/operators/stacks/operand/cleartomark.ts

→ `buildFunctionOperator`

`function (anonymous arrow) `

  → `findMarkPos`
### core/operators/stacks/operand/count.ts

→ `buildFunctionOperator`

`function (anonymous arrow) `

  → `toIntegerValue`

  → `assert`
### core/operators/stacks/operand/counttomark.ts

→ `buildFunctionOperator`

`function (anonymous arrow) `

  → `findMarkPos`

  → `toIntegerValue`

  → `assert`
### core/operators/stacks/operand/dup.ts

→ `buildFunctionOperator`
### core/operators/stacks/operand/exch.ts

→ `buildFunctionOperator`
### core/operators/stacks/operand/indexOp.ts

→ `buildFunctionOperator`
### core/operators/stacks/operand/pop.ts

→ `buildFunctionOperator`
### core/operators/stacks/operand/roll.ts

→ `buildFunctionOperator`

`function initialize `

  → `toIntegerValue` (2)

  → `assert` (2)

`function roll `

  → `assert` (5)

  → `toIntegerValue`

`function (anonymous arrow) `

  → `initialize`

  → `roll`
### core/operators/value/convert/cvi.ts

→ `buildFunctionOperator`

`function (anonymous arrow) `

  → `toIntegerValue`
### core/operators/value/convert/cvlit.ts

→ `buildFunctionOperator`
### core/operators/value/convert/cvn.ts

→ `buildFunctionOperator`

`function (anonymous arrow) `

  → `assert`

  → `toNameValue`
### core/operators/value/eq.ts

→ `buildFunctionOperator`

`function (anonymous arrow) `

  → `valuesOf`
### core/operators/value/false.ts

→ `buildConstantOperator`
### core/operators/value/get.ts

→ `buildFunctionOperator`

`function (anonymous arrow) `

  → `assert`

  → `checkPos`

  → `toStringValue`

`function (anonymous arrow) `

  → `checkPos`

`function (anonymous arrow) `

  → `implementation`
### core/operators/value/length.ts

→ `buildFunctionOperator`

`function (anonymous arrow) `

  → `toIntegerValue`

  → `implementation`

  → `assert`
### core/operators/value/mark.ts

→ `buildConstantOperator`
### core/operators/value/neq.ts

→ `buildFunctionOperator`

`function (anonymous arrow) `

  → `valuesOf`
### core/operators/value/put.ts

→ `buildFunctionOperator`

`function (anonymous arrow) `

  → `assert`

  → `checkPos`

  → `toStringValue`

`function (anonymous arrow) `

  → `checkPos`

`function (anonymous arrow) `

  → `implementation`
### core/operators/value/true.ts

→ `buildConstantOperator`
### core/operators/value/type.ts

→ `buildFunctionOperator`

`function (anonymous arrow) `

  → `toNameValue`
### core/operators/value/version.ts

→ `buildConstantOperator`

→ `toStringValue`
### core/operators/value/wcheck.ts

→ `buildFunctionOperator`
### core/operators/value/xcheck.ts

→ `buildFunctionOperator`
### core/state/block.ts

<span style="color: red;"><code>export</code></span> `function blockCycle (1)`
### core/state/call.ts

<span style="color: red;"><code>export</code></span> `function callCycle (1)`
### core/state/operator.ts

<span style="color: red;"><code>export</code></span> `function operatorPop (2)`

`function handleFunctionOperatorTypeCheck `

  → `assert` (2)

`function handleFunctionOperator `

  → `assert`

  → `handleFunctionOperatorTypeCheck`

<span style="color: red;"><code>export</code></span> `function operatorCycle (1)`

  → `operatorPop`

  → `handleFunctionOperator`
### core/state/parse.ts

`function getToken `

  → `parse` (2)

`function enqueueToken `

  → `valuesOf`

<span style="color: red;"><code>export</code></span> `function parseCycle (1)`

  → `getToken`

  → `enqueueToken`
### core/state/State.ts

<span style="color: red;"><code>export</code></span> `class State`

`State::_checkIfDestroyed`

  → `assert`

`State::destroy`

  → `assert`

`State::raiseException`

  → `assert` (4)

`State::cycle`

  → `operatorPop`

  → `operatorCycle`

  → `callCycle`

  → `blockCycle`

  → `parseCycle`

  → `assert`
### sdk/assert.ts

`class AssertionFailed`

<span style="color: red;"><code>export</code></span> `function assert (83)`
### sdk/checkPos.ts

<span style="color: red;"><code>export</code></span> `function checkPos (4)`
### sdk/checks/isObject.ts

<span style="color: red;"><code>export</code></span> `function isObject (1)`
### sdk/checks/isValue.ts

`function is `

  → `isObject`

  → `hasInvalidFlag`

  → `checkFlags`

  → `check`

<span style="color: red;"><code>export</code></span> `function isIntegerValue `

  → `is`

  → `isInteger`

<span style="color: red;"><code>export</code></span> `function isStringValue `

  → `is`

<span style="color: red;"><code>export</code></span> `function isNameValue `

  → `is`

<span style="color: red;"><code>export</code></span> `function isOperatorValue `

  → `is`

`function isPositiveInteger `

  → `isInteger`

<span style="color: red;"><code>export</code></span> `function isArrayValue (1)`

  → `is`

  → `isPositiveInteger`

  → `isFunction` (2)

<span style="color: red;"><code>export</code></span> `function isDictionaryValue `

  → `is`

  → `isFunction` (2)
### sdk/findMarkPos.ts

<span style="color: red;"><code>export</code></span> `function findMarkPos (4)`
### sdk/interfaces/ICallStack.ts
### sdk/interfaces/IDictionaryStack.ts
### sdk/interfaces/IInternalState.ts
### sdk/interfaces/IOperandStack.ts
### sdk/interfaces/IOperator.ts
### sdk/interfaces/IStack.ts
### sdk/toString.ts

`function fitToMaxWidth `

  → `minimizeAt`

  → `centerValue`

`function decorate `

  → `convertPosToLineAndCol`

  → `fitToMaxWidth`

`function (anonymous arrow) `

  → `decorate`

`function (anonymous arrow) `

  → `decorate`

`function (anonymous arrow) `

  → `decorate`

`function (anonymous arrow) `

  → `parse`

  → `decorate`

`function (anonymous arrow) `

  → `decorate`

`function (anonymous arrow) `

  → `decorate`

`function (anonymous arrow) `

  → `decorate`

`function (anonymous arrow) `

  → `decorate`

`function (anonymous arrow) `

  → `decorate`

<span style="color: red;"><code>export</code></span> `function toString (1)`

<span style="color: red;"><code>export</code></span> `function callStackToString `

  → `toString`
### sdk/toValue.ts

<span style="color: red;"><code>export</code></span> `function toIntegerValue (16)`

<span style="color: red;"><code>export</code></span> `function toStringValue (5)`

<span style="color: red;"><code>export</code></span> `function toNameValue (2)`
### sdk/valuesOf.ts

<span style="color: red;"><code>export</code></span> `function valuesOf (6)`

  → `getValueOf`
## Grap
```mermaid
graph LR
  subgraph api/Exception.ts
    func_2("getExceptionMessage");
  end
  subgraph api/interfaces/IReadOnlyArray.ts
    export_11("enumIArrayValues");
  end
  subgraph api/interfaces/IReadOnlyDictionary.ts
    export_14("enumIDictionaryValues");
    export_15("convertIDictionaryToObject");
    export_15 --> export_14("enumIDictionaryValues");
  end
  subgraph api/parser.ts
    func_19("parseString");
    func_20("parseNumber");
    func_20 --> export_230("assert");
    func_21("parseName");
    func_21 --> export_230("assert");
    export_22("parse");
    export_22 --> export_230("assert");
    export_22 --> parseString;
    export_22 --> parseNumber;
    export_22 --> parseName;
  end
  subgraph api/run.ts
    export_24("run");
    export_24 --> export_275("toStringValue");
  end
  subgraph core/MemoryTracker.ts
    func_37("stringSizer");
    export_38("addMemorySize");
    export_39("memorySizeToBytes");
  end
  subgraph core/objects/AbstractValueContainer.ts
  end
  subgraph core/objects/dictionaries/Dictionary.ts
  end
  subgraph core/objects/dictionaries/Empty.ts
  end
  subgraph core/objects/dictionaries/System.ts
  end
  subgraph core/objects/ShareableObject.ts
    func_42("getShareableObject");
    func_42 --> export_230("assert");
  end
  subgraph core/objects/stacks/CallStack.ts
  end
  subgraph core/objects/stacks/DictionaryStack.ts
  end
  subgraph core/objects/stacks/ValueStack.ts
  end
  subgraph core/objects/ValueArray.ts
  end
  subgraph core/operators/array/aload.ts
    main_50("main") --> export_133("buildFunctionOperator");
    func_51("(anonymous arrow)");
    func_51 --> export_230("assert");
  end
  subgraph core/operators/array/closeArray.ts
    main_52("main") --> export_133("buildFunctionOperator");
    func_53("(anonymous arrow)");
    func_53 --> export_131("closeToMark");
  end
  subgraph core/operators/array/openArray.ts
    main_54("main") --> export_133("buildFunctionOperator");
  end
  subgraph core/operators/boolean/and.ts
    main_55("main") --> export_133("buildFunctionOperator");
    func_56("(anonymous arrow)");
  end
  subgraph core/operators/boolean/or.ts
    main_57("main") --> export_133("buildFunctionOperator");
    func_58("(anonymous arrow)");
  end
  subgraph core/operators/boolean/xor.ts
    main_59("main") --> export_133("buildFunctionOperator");
    func_60("(anonymous arrow)");
  end
  subgraph core/operators/dictionary/closeDictionary.ts
    main_61("main") --> export_133("buildFunctionOperator");
    func_62("(anonymous arrow)");
    func_62 --> export_249("findMarkPos");
    func_62 --> export_288("valuesOf");
    func_62 --> export_130("pushOpenClosedValueWithDebugInfo");
  end
  subgraph core/operators/dictionary/openDictionary.ts
    main_63("main") --> export_133("buildFunctionOperator");
    func_64("(anonymous arrow)");
    func_64 --> export_129("openWithMark");
  end
  subgraph core/operators/exceptions/dictStackUnderflow.ts
    main_65("main") --> export_133("buildFunctionOperator");
    func_66("(anonymous arrow)");
  end
  subgraph core/operators/exceptions/invalidAccess.ts
    main_67("main") --> export_133("buildFunctionOperator");
    func_68("(anonymous arrow)");
  end
  subgraph core/operators/exceptions/limitcheck.ts
    main_69("main") --> export_133("buildFunctionOperator");
    func_70("(anonymous arrow)");
  end
  subgraph core/operators/exceptions/rangeCheck.ts
    main_71("main") --> export_133("buildFunctionOperator");
    func_72("(anonymous arrow)");
  end
  subgraph core/operators/exceptions/stackUnderflow.ts
    main_73("main") --> export_133("buildFunctionOperator");
    func_74("(anonymous arrow)");
  end
  subgraph core/operators/exceptions/stop.ts
    main_75("main") --> export_133("buildFunctionOperator");
    func_76("(anonymous arrow)");
  end
  subgraph core/operators/exceptions/typeCheck.ts
    main_77("main") --> export_133("buildFunctionOperator");
    func_78("(anonymous arrow)");
  end
  subgraph core/operators/exceptions/undefined.ts
    main_79("main") --> export_133("buildFunctionOperator");
    func_80("(anonymous arrow)");
  end
  subgraph core/operators/exceptions/undefinedResult.ts
    main_81("main") --> export_133("buildFunctionOperator");
    func_82("(anonymous arrow)");
  end
  subgraph core/operators/exceptions/unmatchedMark.ts
    main_83("main") --> export_133("buildFunctionOperator");
    func_84("(anonymous arrow)");
  end
  subgraph core/operators/exceptions/vmOverflow.ts
    main_85("main") --> export_133("buildFunctionOperator");
    func_86("(anonymous arrow)");
  end
  subgraph core/operators/flow/closeBlock.ts
    main_87("main") --> export_133("buildFunctionOperator");
    func_88("(anonymous arrow)");
    func_88 --> export_131("closeToMark");
  end
  subgraph core/operators/flow/finally.ts
    main_89("main") --> export_133("buildFunctionOperator");
    func_90("firstCall");
    func_90 --> export_230("assert");
    func_91("callBeforePop");
    func_91 --> export_275("toStringValue");
    func_91 --> export_230("assert");
    func_92("popping");
    func_92 --> export_230("assert");
    func_93("(anonymous arrow)");
    func_93 --> firstCall;
    func_93 --> callBeforePop;
    func_93 --> export_230("assert");
    func_93 --> popping;
  end
  subgraph core/operators/flow/gc.ts
    main_94("main") --> export_133("buildFunctionOperator");
    func_95("(anonymous arrow)");
    func_95 --> export_230("assert");
  end
  subgraph core/operators/flow/if.ts
    main_96("main") --> export_133("buildFunctionOperator");
    func_97("(anonymous arrow)");
  end
  subgraph core/operators/flow/ifelse.ts
    main_98("main") --> export_133("buildFunctionOperator");
    func_99("(anonymous arrow)");
  end
  subgraph core/operators/flow/loop.ts
    main_100("main") --> export_133("buildFunctionOperator");
    func_101("(anonymous arrow)");
    func_101 --> export_230("assert");
  end
  subgraph core/operators/flow/openBlock.ts
    main_102("main") --> export_133("buildFunctionOperator");
    func_103("(anonymous arrow)");
    func_103 --> export_129("openWithMark");
  end
  subgraph core/operators/flow/repeat.ts
    main_104("main") --> export_133("buildFunctionOperator");
    func_105("firstCall");
    func_106("repeat");
    func_107("(anonymous arrow)");
    func_107 --> firstCall;
    func_107 --> repeat;
  end
  subgraph core/operators/flow/stopped.ts
    main_108("main") --> export_133("buildFunctionOperator");
    func_109("(anonymous arrow)");
    func_109 --> export_230("assert");
  end
  subgraph core/operators/integer/abs.ts
    main_110("main") --> export_133("buildFunctionOperator");
    func_111("(anonymous arrow)");
    func_111 --> export_274("toIntegerValue");
  end
  subgraph core/operators/integer/add.ts
    main_112("main") --> export_133("buildFunctionOperator");
    func_113("(anonymous arrow)");
    func_113 --> export_274("toIntegerValue");
  end
  subgraph core/operators/integer/div.ts
    main_114("main") --> export_133("buildFunctionOperator");
    func_115("(anonymous arrow)");
    func_115 --> export_274("toIntegerValue");
  end
  subgraph core/operators/integer/gt.ts
    main_116("main") --> export_133("buildFunctionOperator");
    func_117("(anonymous arrow)");
  end
  subgraph core/operators/integer/gte.ts
    main_118("main") --> export_133("buildFunctionOperator");
    func_119("(anonymous arrow)");
  end
  subgraph core/operators/integer/lt.ts
    main_120("main") --> export_133("buildFunctionOperator");
    func_121("(anonymous arrow)");
  end
  subgraph core/operators/integer/lte.ts
    main_122("main") --> export_133("buildFunctionOperator");
    func_123("(anonymous arrow)");
  end
  subgraph core/operators/integer/mul.ts
    main_124("main") --> export_133("buildFunctionOperator");
    func_125("(anonymous arrow)");
    func_125 --> export_274("toIntegerValue");
  end
  subgraph core/operators/integer/sub.ts
    main_126("main") --> export_133("buildFunctionOperator");
    func_127("(anonymous arrow)");
    func_127 --> export_274("toIntegerValue");
  end
  subgraph core/operators/openClose.ts
    export_129("openWithMark");
    export_130("pushOpenClosedValueWithDebugInfo");
    export_131("closeToMark");
    export_131 --> export_249("findMarkPos");
    export_131 --> export_274("toIntegerValue");
    export_131 --> export_230("assert");
    export_131 --> export_130("pushOpenClosedValueWithDebugInfo");
  end
  subgraph core/operators/operators.ts
    export_133("buildFunctionOperator");
    export_133 --> export_230("assert");
    export_134("buildConstantOperator");
  end
  subgraph core/operators/stacks/call/countexecstack.ts
    main_135("main") --> export_133("buildFunctionOperator");
    func_136("(anonymous arrow)");
    func_136 --> export_274("toIntegerValue");
    func_136 --> export_230("assert");
  end
  subgraph core/operators/stacks/dictionary/begin.ts
    main_137("main") --> export_133("buildFunctionOperator");
    func_138("(anonymous arrow)");
  end
  subgraph core/operators/stacks/dictionary/bind.ts
    main_139("main") --> export_133("buildFunctionOperator");
    func_140("bindName");
    func_141("bindArray");
    func_142("bindValue");
    func_142 --> bindName;
    func_142 --> export_230("assert");
    func_142 --> bindArray;
    func_143("(anonymous arrow)");
    func_143 --> export_230("assert");
    func_143 --> export_246("isArrayValue");
    func_143 --> bindValue;
  end
  subgraph core/operators/stacks/dictionary/countdictstack.ts
    main_144("main") --> export_133("buildFunctionOperator");
    func_145("(anonymous arrow)");
    func_145 --> export_274("toIntegerValue");
    func_145 --> export_230("assert");
  end
  subgraph core/operators/stacks/dictionary/currentdict.ts
    main_146("main") --> export_133("buildFunctionOperator");
    func_147("(anonymous arrow)");
  end
  subgraph core/operators/stacks/dictionary/def.ts
    main_148("main") --> export_133("buildFunctionOperator");
    func_149("(anonymous arrow)");
  end
  subgraph core/operators/stacks/dictionary/end.ts
    main_150("main") --> export_133("buildFunctionOperator");
    func_151("(anonymous arrow)");
  end
  subgraph core/operators/stacks/dictionary/globaldict.ts
    main_152("main") --> export_133("buildFunctionOperator");
    func_153("(anonymous arrow)");
  end
  subgraph core/operators/stacks/dictionary/hostdict.ts
    main_154("main") --> export_133("buildFunctionOperator");
    func_155("(anonymous arrow)");
  end
  subgraph core/operators/stacks/dictionary/systemdict.ts
    main_156("main") --> export_133("buildFunctionOperator");
    func_157("(anonymous arrow)");
  end
  subgraph core/operators/stacks/dictionary/userdict.ts
    main_158("main") --> export_133("buildFunctionOperator");
    func_159("(anonymous arrow)");
  end
  subgraph core/operators/stacks/operand/clear.ts
    main_160("main") --> export_133("buildFunctionOperator");
    func_161("(anonymous arrow)");
  end
  subgraph core/operators/stacks/operand/cleartomark.ts
    main_162("main") --> export_133("buildFunctionOperator");
    func_163("(anonymous arrow)");
    func_163 --> export_249("findMarkPos");
  end
  subgraph core/operators/stacks/operand/count.ts
    main_164("main") --> export_133("buildFunctionOperator");
    func_165("(anonymous arrow)");
    func_165 --> export_274("toIntegerValue");
    func_165 --> export_230("assert");
  end
  subgraph core/operators/stacks/operand/counttomark.ts
    main_166("main") --> export_133("buildFunctionOperator");
    func_167("(anonymous arrow)");
    func_167 --> export_249("findMarkPos");
    func_167 --> export_274("toIntegerValue");
    func_167 --> export_230("assert");
  end
  subgraph core/operators/stacks/operand/dup.ts
    main_168("main") --> export_133("buildFunctionOperator");
    func_169("(anonymous arrow)");
  end
  subgraph core/operators/stacks/operand/exch.ts
    main_170("main") --> export_133("buildFunctionOperator");
    func_171("(anonymous arrow)");
  end
  subgraph core/operators/stacks/operand/indexOp.ts
    main_172("main") --> export_133("buildFunctionOperator");
    func_173("(anonymous arrow)");
  end
  subgraph core/operators/stacks/operand/pop.ts
    main_174("main") --> export_133("buildFunctionOperator");
    func_175("(anonymous arrow)");
  end
  subgraph core/operators/stacks/operand/roll.ts
    main_176("main") --> export_133("buildFunctionOperator");
    func_177("initialize");
    func_177 --> export_274("toIntegerValue");
    func_177 --> export_230("assert");
    func_178("roll");
    func_178 --> export_230("assert");
    func_178 --> export_274("toIntegerValue");
    func_179("(anonymous arrow)");
    func_179 --> initialize;
    func_179 --> roll;
  end
  subgraph core/operators/value/convert/cvi.ts
    main_180("main") --> export_133("buildFunctionOperator");
    func_181("(anonymous arrow)");
    func_181 --> export_274("toIntegerValue");
  end
  subgraph core/operators/value/convert/cvlit.ts
    main_182("main") --> export_133("buildFunctionOperator");
    func_183("(anonymous arrow)");
  end
  subgraph core/operators/value/convert/cvn.ts
    main_184("main") --> export_133("buildFunctionOperator");
    func_185("(anonymous arrow)");
    func_185 --> export_230("assert");
    func_185 --> export_276("toNameValue");
  end
  subgraph core/operators/value/eq.ts
    main_186("main") --> export_133("buildFunctionOperator");
    func_187("(anonymous arrow)");
    func_187 --> export_288("valuesOf");
  end
  subgraph core/operators/value/false.ts
    main_188("main") --> export_134("buildConstantOperator");
  end
  subgraph core/operators/value/get.ts
    main_189("main") --> export_133("buildFunctionOperator");
    func_190("(anonymous arrow)");
    func_190 --> export_230("assert");
    func_190 --> export_232("checkPos");
    func_190 --> export_275("toStringValue");
    func_191("(anonymous arrow)");
    func_191 --> export_232("checkPos");
    func_192("(anonymous arrow)");
    func_193("(anonymous arrow)");
    func_193 --> implementation;
  end
  subgraph core/operators/value/length.ts
    main_194("main") --> export_133("buildFunctionOperator");
    func_195("(anonymous arrow)");
    func_196("(anonymous arrow)");
    func_197("(anonymous arrow)");
    func_198("(anonymous arrow)");
    func_198 --> export_274("toIntegerValue");
    func_198 --> implementation;
    func_198 --> export_230("assert");
  end
  subgraph core/operators/value/mark.ts
    main_199("main") --> export_134("buildConstantOperator");
  end
  subgraph core/operators/value/neq.ts
    main_200("main") --> export_133("buildFunctionOperator");
    func_201("(anonymous arrow)");
    func_201 --> export_288("valuesOf");
  end
  subgraph core/operators/value/put.ts
    main_202("main") --> export_133("buildFunctionOperator");
    func_203("(anonymous arrow)");
    func_203 --> export_230("assert");
    func_203 --> export_232("checkPos");
    func_203 --> export_275("toStringValue");
    func_204("(anonymous arrow)");
    func_204 --> export_232("checkPos");
    func_205("(anonymous arrow)");
    func_206("(anonymous arrow)");
    func_206 --> implementation;
  end
  subgraph core/operators/value/true.ts
    main_207("main") --> export_134("buildConstantOperator");
  end
  subgraph core/operators/value/type.ts
    main_208("main") --> export_133("buildFunctionOperator");
    func_209("(anonymous arrow)");
    func_209 --> export_276("toNameValue");
  end
  subgraph core/operators/value/version.ts
    main_210("main") --> export_134("buildConstantOperator");
    main_210("main") --> export_275("toStringValue");
  end
  subgraph core/operators/value/wcheck.ts
    main_211("main") --> export_133("buildFunctionOperator");
    func_212("(anonymous arrow)");
  end
  subgraph core/operators/value/xcheck.ts
    main_213("main") --> export_133("buildFunctionOperator");
    func_214("(anonymous arrow)");
  end
  subgraph core/state/block.ts
    export_217("blockCycle");
  end
  subgraph core/state/call.ts
    export_219("callCycle");
  end
  subgraph core/state/operator.ts
    export_221("operatorPop");
    func_222("handleFunctionOperatorTypeCheck");
    func_222 --> export_230("assert");
    func_223("handleFunctionOperator");
    func_223 --> export_230("assert");
    func_223 --> handleFunctionOperatorTypeCheck;
    export_224("operatorCycle");
    export_224 --> export_221("operatorPop");
    export_224 --> handleFunctionOperator;
  end
  subgraph core/state/parse.ts
    func_226("getToken");
    func_226 --> export_22("parse");
    func_227("enqueueToken");
    func_227 --> export_288("valuesOf");
    export_228("parseCycle");
    export_228 --> getToken;
    export_228 --> enqueueToken;
  end
  subgraph core/state/State.ts
  end
  subgraph sdk/assert.ts
    export_230("assert");
  end
  subgraph sdk/checkPos.ts
    export_232("checkPos");
  end
  subgraph sdk/checks/isObject.ts
    export_234("isObject");
  end
  subgraph sdk/checks/isValue.ts
    func_236("hasInvalidFlag");
    func_237("checkFlags");
    func_238("is");
    func_238 --> export_234("isObject");
    func_238 --> hasInvalidFlag;
    func_238 --> checkFlags;
    func_238 --> check;
    func_239("isInteger");
    export_240("isIntegerValue");
    export_240 --> is;
    export_240 --> isInteger;
    export_241("isStringValue");
    export_241 --> is;
    export_242("isNameValue");
    export_242 --> is;
    export_243("isOperatorValue");
    export_243 --> is;
    func_244("isFunction");
    func_245("isPositiveInteger");
    func_245 --> isInteger;
    export_246("isArrayValue");
    export_246 --> is;
    export_246 --> isPositiveInteger;
    export_246 --> isFunction;
    export_247("isDictionaryValue");
    export_247 --> is;
    export_247 --> isFunction;
  end
  subgraph sdk/findMarkPos.ts
    export_249("findMarkPos");
  end
  subgraph sdk/toString.ts
    func_257("convertPosToLineAndCol");
    func_258("minimizeAt");
    func_259("centerValue");
    func_260("fitToMaxWidth");
    func_260 --> minimizeAt;
    func_260 --> centerValue;
    func_261("decorate");
    func_261 --> convertPosToLineAndCol;
    func_261 --> fitToMaxWidth;
    func_262("(anonymous arrow)");
    func_262 --> decorate;
    func_263("(anonymous arrow)");
    func_263 --> decorate;
    func_264("(anonymous arrow)");
    func_264 --> decorate;
    func_265("(anonymous arrow)");
    func_265 --> export_22("parse");
    func_265 --> decorate;
    func_266("(anonymous arrow)");
    func_266 --> decorate;
    func_267("(anonymous arrow)");
    func_267 --> decorate;
    func_268("(anonymous arrow)");
    func_268 --> decorate;
    func_269("(anonymous arrow)");
    func_269 --> decorate;
    func_270("(anonymous arrow)");
    func_270 --> decorate;
    export_271("toString");
    export_272("callStackToString");
    export_272 --> export_271("toString");
  end
  subgraph sdk/toValue.ts
    export_274("toIntegerValue");
    export_275("toStringValue");
    export_276("toNameValue");
  end
  subgraph sdk/valuesOf.ts
    func_278("(anonymous arrow)");
    func_279("(anonymous arrow)");
    func_280("(anonymous arrow)");
    func_281("(anonymous arrow)");
    func_282("(anonymous arrow)");
    func_283("(anonymous arrow)");
    func_284("(anonymous arrow)");
    func_285("(anonymous arrow)");
    func_286("(anonymous arrow)");
    func_287("getValueOf");
    export_288("valuesOf");
    export_288 --> getValueOf;
  end
```