;; Memory layout (1 page = 64KB):
;;
;; Operand stack: offset 0, grows upward, max 64 values
;;   each value = 8 bytes: i32 type+flags | i32 payload
;;   flags byte: bits 0-3 = type, bit 4 = isExecutable
;;   types: 0=null 1=boolean 2=integer 3=string 4=name 5=mark 6=operator 7=array
;;
;; Call stack: offset 512, grows upward, max 32 frames
;;   each frame = 12 bytes: i32 type+flags | i32 payload | i32 operator_state
;;
;; Stack pointers (i32 each):
;;   offset 1024 = operand stack depth (number of values)
;;   offset 1028 = call stack depth (number of frames)
;;
;; Operator state constants (matching engine/src/sdk):
;;   UNKNOWN       = 0x7FFFFFFF  (i.e. +Infinity mapped to max i32)
;;   FIRST_CALL    = 0
;;   POP           = 0x80000000  (i.e. -Infinity mapped to min i32)

(module
  ;; JS imports: operators & name resolution
  (import "env" "js_operator_call" (func $js_operator_call (param i32) (result i32)))
  ;; param: operator id (payload of operator value)
  ;; result: 0 = success, non-zero = exception code

  (import "env" "js_lookup" (func $js_lookup (param i32) (result i32)))
  ;; param: name id (payload of name value)
  ;; result: encoded value (type<<28 | flags<<24 | payload) or -1 = undefined

  (memory (export "memory") 1)

  ;; Layout constants
  (global $OPERAND_BASE i32 (i32.const 0))
  (global $CALL_BASE    i32 (i32.const 512))
  (global $SP_OPERAND   i32 (i32.const 1024))  ;; operand depth pointer
  (global $SP_CALL      i32 (i32.const 1028))  ;; call depth pointer

  ;; Value size in bytes
  (global $VALUE_SIZE   i32 (i32.const 8))
  ;; Frame size in bytes (value + operator_state)
  (global $FRAME_SIZE   i32 (i32.const 12))

  ;; Type constants
  (global $TYPE_NULL     i32 (i32.const 0))
  (global $TYPE_INTEGER  i32 (i32.const 2))
  (global $TYPE_NAME     i32 (i32.const 4))
  (global $TYPE_OPERATOR i32 (i32.const 6))

  ;; Executable flag (bit 4 of type byte)
  (global $FLAG_EXEC     i32 (i32.const 16))

  ;; Operator state constants
  (global $STATE_UNKNOWN     i32 (i32.const 0x7fffffff))
  (global $STATE_FIRST_CALL  i32 (i32.const 0))
  (global $STATE_POP         i32 (i32.const 0x80000000))

  ;; Exception codes
  (global $EX_NONE           i32 (i32.const 0))
  (global $EX_UNDEFINED      i32 (i32.const 1))
  (global $EX_TYPE_CHECK     i32 (i32.const 2))
  (global $EX_STACK_UNDERFLOW i32 (i32.const 3))

  ;; --- Operand stack ---

  (func $operand_depth (result i32)
    (i32.load (i32.const 1024)))

  (func $operand_push (param $type_flags i32) (param $payload i32)
    (local $depth i32)
    (local $addr i32)
    (local.set $depth (call $operand_depth))
    (local.set $addr (i32.add (global.get $OPERAND_BASE)
                              (i32.mul (local.get $depth) (global.get $VALUE_SIZE))))
    (i32.store (local.get $addr) (local.get $type_flags))
    (i32.store (i32.add (local.get $addr) (i32.const 4)) (local.get $payload))
    (i32.store (i32.const 1024) (i32.add (local.get $depth) (i32.const 1))))

  (func $operand_pop
    (local $depth i32)
    (local.set $depth (call $operand_depth))
    (i32.store (i32.const 1024) (i32.sub (local.get $depth) (i32.const 1))))

  (func $operand_top_type (result i32)
    (local $depth i32)
    (local.set $depth (call $operand_depth))
    (i32.load (i32.add (global.get $OPERAND_BASE)
                       (i32.mul (i32.sub (local.get $depth) (i32.const 1))
                                (global.get $VALUE_SIZE)))))

  (func $operand_top_payload (result i32)
    (local $depth i32)
    (local.set $depth (call $operand_depth))
    (i32.load (i32.add (i32.add (global.get $OPERAND_BASE)
                                (i32.mul (i32.sub (local.get $depth) (i32.const 1))
                                         (global.get $VALUE_SIZE)))
                       (i32.const 4))))

  (func $operand_at_type (param $index i32) (result i32)
    ;; index 0 = top
    (local $depth i32)
    (local.set $depth (call $operand_depth))
    (i32.load (i32.add (global.get $OPERAND_BASE)
                       (i32.mul (i32.sub (i32.sub (local.get $depth) (i32.const 1))
                                         (local.get $index))
                                (global.get $VALUE_SIZE)))))

  (func $operand_at_payload (param $index i32) (result i32)
    ;; index 0 = top
    (local $depth i32)
    (local.set $depth (call $operand_depth))
    (i32.load (i32.add (i32.add (global.get $OPERAND_BASE)
                                (i32.mul (i32.sub (i32.sub (local.get $depth) (i32.const 1))
                                                  (local.get $index))
                                         (global.get $VALUE_SIZE)))
                       (i32.const 4))))

  ;; --- Call stack ---

  (func $call_depth (result i32)
    (i32.load (i32.const 1028)))

  (func $call_push (param $type_flags i32) (param $payload i32)
    (local $depth i32)
    (local $addr i32)
    (local.set $depth (call $call_depth))
    (local.set $addr (i32.add (global.get $CALL_BASE)
                              (i32.mul (local.get $depth) (global.get $FRAME_SIZE))))
    (i32.store (local.get $addr) (local.get $type_flags))
    (i32.store (i32.add (local.get $addr) (i32.const 4)) (local.get $payload))
    (i32.store (i32.add (local.get $addr) (i32.const 8)) (global.get $STATE_UNKNOWN))
    (i32.store (i32.const 1028) (i32.add (local.get $depth) (i32.const 1))))

  (func $call_pop
    (local $depth i32)
    (local.set $depth (call $call_depth))
    (i32.store (i32.const 1028) (i32.sub (local.get $depth) (i32.const 1))))

  (func $call_top_addr (result i32)
    (local $depth i32)
    (local.set $depth (call $call_depth))
    (i32.add (global.get $CALL_BASE)
             (i32.mul (i32.sub (local.get $depth) (i32.const 1))
                      (global.get $FRAME_SIZE))))

  (func $call_top_type (result i32)
    (i32.load (call $call_top_addr)))

  (func $call_top_payload (result i32)
    (i32.load (i32.add (call $call_top_addr) (i32.const 4))))

  (func $call_top_state (result i32)
    (i32.load (i32.add (call $call_top_addr) (i32.const 8))))

  (func $call_set_top_state (param $state i32)
    (i32.store (i32.add (call $call_top_addr) (i32.const 8)) (local.get $state)))

  ;; --- cycle() ---
  ;; Returns exception code (0 = ok, non-zero = exception)

  (func $cycle (result i32)
    (local $top_type i32)
    (local $top_payload i32)
    (local $top_exec i32)
    (local $state i32)
    (local $lookup_result i32)
    (local $encoded_type i32)
    (local $encoded_payload i32)

    (local.set $top_type    (call $call_top_type))
    (local.set $top_payload (call $call_top_payload))
    ;; isExecutable = bit 4 set
    (local.set $top_exec (i32.and (local.get $top_type) (global.get $FLAG_EXEC)))

    (if (i32.eqz (local.get $top_exec))
      (then
        ;; Non-executable: move to operand stack
        (call $operand_push (local.get $top_type) (local.get $top_payload))
        (call $call_pop)
        (return (global.get $EX_NONE))))

    ;; Executable — dispatch on type (low 4 bits)
    (local.set $top_type (i32.and (local.get $top_type) (i32.const 0x0f)))

    ;; --- NAME: dictionary lookup ---
    (if (i32.eq (local.get $top_type) (global.get $TYPE_NAME))
      (then
        (local.set $state (call $call_top_state))
        (if (i32.eq (local.get $state) (global.get $STATE_FIRST_CALL))
          (then
            ;; second visit: pop the name frame
            (call $call_pop)
            (return (global.get $EX_NONE))))
        ;; first visit: lookup and push resolved value
        (call $call_set_top_state (global.get $STATE_FIRST_CALL))
        (local.set $lookup_result (call $js_lookup (local.get $top_payload)))
        (if (i32.eq (local.get $lookup_result) (i32.const -1))
          (then (return (global.get $EX_UNDEFINED))))
        ;; decode result: high 4 bits = type, bit 24 = exec flag, low 24 = payload
        (local.set $encoded_type
          (i32.or
            (i32.and (i32.shr_u (local.get $lookup_result) (i32.const 28)) (i32.const 0x0f))
            (i32.and (i32.shr_u (local.get $lookup_result) (i32.const 20)) (i32.const 0x10))))
        (local.set $encoded_payload
          (i32.and (local.get $lookup_result) (i32.const 0x00ffffff)))
        (call $call_push (local.get $encoded_type) (local.get $encoded_payload))
        (return (global.get $EX_NONE))))

    ;; --- OPERATOR ---
    (if (i32.eq (local.get $top_type) (global.get $TYPE_OPERATOR))
      (then
        (local.set $state (call $call_top_state))
        ;; if state <= FIRST_CALL (i.e. 0 or POP sentinel), pop
        (if (i32.le_s (local.get $state) (global.get $STATE_FIRST_CALL))
          (then
            (call $call_pop)
            (return (global.get $EX_NONE))))
        ;; first call: set state, dispatch to JS
        (call $call_set_top_state (global.get $STATE_FIRST_CALL))
        (return (call $js_operator_call (local.get $top_payload)))))

    ;; Unsupported executable type (string/array parsing not in this experiment)
    (global.get $EX_TYPE_CHECK))

  ;; --- Public API ---

  ;; Push an integer literal directly onto the operand stack (pre-tokenized)
  (func $push_integer (export "push_integer") (param $value i32)
    (call $operand_push (global.get $TYPE_INTEGER) (local.get $value)))

  ;; Push an executable name onto the call stack (pre-tokenized)
  ;; name_id is an index into the JS-side name table
  (func $push_name (export "push_name") (param $name_id i32)
    ;; type = name (4) | executable flag (16)
    (call $call_push (i32.or (global.get $TYPE_NAME) (global.get $FLAG_EXEC)) (local.get $name_id)))

  ;; Run until call stack is empty; returns exception code or 0
  (func $run (export "run") (result i32)
    (local $ex i32)
    (block $break
      (loop $loop
        (br_if $break (i32.eqz (call $call_depth)))
        (local.set $ex (call $cycle))
        (br_if $break (i32.ne (local.get $ex) (global.get $EX_NONE)))
        (br $loop)))
    (local.get $ex))

  ;; Read top of operand stack (integer payload)
  (func $top_integer (export "top_integer") (result i32)
    (call $operand_top_payload))

  ;; Read operand stack depth
  (func $stack_depth (export "stack_depth") (result i32)
    (call $operand_depth))

  ;; Reset both stacks (for benchmarking)
  (func $reset (export "reset")
    (i32.store (i32.const 1024) (i32.const 0))
    (i32.store (i32.const 1028) (i32.const 0)))
)
