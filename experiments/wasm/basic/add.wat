(module
  (func $add (param $a i32) (param $b i32) (result i32)
    local.get $a
    local.get $b
    i32.add)

  ;; runs add(3, 4) in a loop n times, returns last result
  (func $add_loop (param $n i32) (result i32)
    (local $i i32)
    (local $result i32)
    (local.set $i (i32.const 0))
    (block $break
      (loop $loop
        (br_if $break (i32.ge_u (local.get $i) (local.get $n)))
        (local.set $result (call $add (i32.const 3) (i32.const 4)))
        (local.set $i (i32.add (local.get $i) (i32.const 1)))
        (br $loop)))
    local.get $result)

  ;; simulates an operator doing n additions worth of work, called once per instruction
  (func $work (param $n i32) (result i32)
    (local $i i32)
    (local $acc i32)
    (local.set $i (i32.const 0))
    (local.set $acc (i32.const 0))
    (block $break
      (loop $loop
        (br_if $break (i32.ge_u (local.get $i) (local.get $n)))
        (local.set $acc (i32.add (local.get $acc) (i32.const 1)))
        (local.set $i (i32.add (local.get $i) (i32.const 1)))
        (br $loop)))
    local.get $acc)

  (export "add" (func $add))
  (export "add_loop" (func $add_loop))
  (export "work" (func $work)))
