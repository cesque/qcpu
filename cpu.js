"use strict"

class CPU {
  constructor() {
    this.debugEnabled = false;

    this.pc = 0
    this.registers = {
      a: 0,
      b: 0,
      c: 0,
      d: 0,
      x: 0,
      y: 0,
    }
    this.regMap = {
      0: 'a',
      1: 'b',
      2: 'c',
      3: 'd',
      4: 'x',
      5: 'y',
    }

    this.addressingModesMap = {
      0: 'imm',
      1: 'abs',
      2: 'ind',
      3: 'reg',
    }

    this.memory = new Uint16Array(2 ** 16 - 1).fill(0)
    this.stack = []

    this.callStack = []

    this.sysCalls = {}

    this.ops = {
      0: {
        name: 'nop',
        fn: this.nop,
        arity: 0
      },
      1: {
        name: 'ext',
        fn: this.ext,
        arity: 1
      },
      2: {
        name: 'sys',
        fn: this.sys,
        arity: 1
      },
      3: {
        name: 'mov',
        fn: this.mov,
        arity: 2
      },
      4: {
        name: 'jmp',
        fn: this.jmp,
        arity: 1
      },
      5: {
        name: 'jeq',
        fn: this.jeq,
        arity: 3
      },
      6: {
        name: 'jne',
        fn: this.jne,
        arity: 3
      },
      7: {
        name: 'jgt',
        fn: this.jgt,
        arity: 3
      },
      8: {
        name: 'jge',
        fn: this.jge,
        arity: 3
      },
      9: {
        name: 'jlt',
        fn: this.jlt,
        arity: 3
      },
      10: {
        name: 'jle',
        fn: this.jle,
        arity: 3
      },
      11: {
        name: 'jsr',
        fn: this.jsr,
        arity: 1
      },
      12: {
        name: 'ret',
        fn: this.ret,
        arity: 0
      },
      13: {
        name: 'add',
        fn: this.add,
        arity: 2
      },
      14: {
        name: 'sub',
        fn: this.sub,
        arity: 2
      },
      15: {
        name: 'mul',
        fn: this.mul,
        arity: 2
      },
      16: {
        name: 'mod',
        fn: this.mod,
        arity: 2
      },
      17: {
        name: 'and',
        fn: this.and,
        arity: 2
      },
      18: {
        name: 'orr',
        fn: this.orr,
        arity: 2
      },
      19: {
        name: 'not',
        fn: this.not,
        arity: 1
      },
      20: {
        name: 'xor',
        fn: this.xor,
        arity: 2
      },
      21: {
        name: 'lsl',
        fn: this.lsl,
        arity: 2
      },
      22: {
        name: 'lsr',
        fn: this.lsr,
        arity: 2
      },
      23: {
        name: 'psh',
        fn: this.psh,
        arity: 1
      },
      24: {
        name: 'pop',
        fn: this.pop,
        arity: 1
      },
    }

    this.lastCycleData = {}
    this.cycleCount = 0

    this.hooks = []

    this.doneHooks = []
    this.timer = undefined
  }

  load(mem) {
    this.reset()
    if (mem.length % 2 != 0) throw 'malformed memory length (byte count should be divisible by 2 because each memory address is 2 bytes'
    for (var i = 0; i < mem.length; i += 2) {
      var low = mem[i]
      var high = mem[i + 1]
      var n = (high << 8) + low
      this.memory[i / 2] = n
    }
  }

  reset() {
    this.memory = new Uint16Array(2 ** 16 - 1).fill(0)
    this.pc = 0
    this.registers.a = 0
    this.registers.b = 0
    this.registers.c = 0
    this.registers.d = 0
    this.registers.x = 0
    this.registers.y = 0
    this.callStack = []
    this.stack = []

    this.lastCycleData = {}
    this.cycleCount = 0
  }

  hook(fn) {
    this.hooks.push(this.wrap(fn))
  }

  done(fn) {
    this.doneHooks.push((cpu, ret) => fn.call(this, cpu, ret))
  }

  provide(syscall, fn) {
    this.sysCalls[syscall] = this.wrap(fn)
  }

  wrap(fn) {
    return (cpu) => fn.call(this, cpu)
  }

  immWriteError(addr) {
    throw 'can\'t write to immediate value: ' + addr.toString()
  }

  cycle() {
    if (this.pc > this.memory.length || this.pc < 0) throw 'program counter outside of memory: ' + this.pc
    var opcode = this.memory[this.pc]
    var op = this.ops[opcode & 0x00ff]
    var modeNum = opcode & 0xff00
    var modes = [
      (modeNum & 0b1100000000000000) >> 14,
      (modeNum & 0b0011000000000000) >> 12,
      (modeNum & 0b0000110000000000) >> 10,
      (modeNum & 0b0000001100000000) >> 8,
    ]

    if (!op) throw 'unrecognised opcode ' + this.memory[this.pc]

    var argNums = this.memory.slice((this.pc + 1), (this.pc + 1) + op.arity)
    var args = []
    for (var i = 0; i < op.arity; i++) {
      args.push({
        value: argNums[i],
        mode: this.addressingModesMap[modes[i]]
      })
    }

    //console.log(this.pc.toString().padStart(4) + ':' + op.name + ' -> ' + JSON.stringify(this.registers).padEnd(50) + this.callStack)

    if (this.debugEnabled) {
      this.lastCycleData.pc = this.pc
      this.lastCycleData.registers = Object.assign({}, this.registers)
      this.lastCycleData.memory = new Uint16Array(2 ** 16 - 1)
      this.lastCycleData.memory.set(this.memory)
      this.lastCycleData.memory = this.memory.slice()
      this.lastCycleData.callStack = this.callStack.slice()
      this.lastCycleData.stack = this.stack.slice()
      this.lastCycleData.cycleCount = this.cycleCount
    }  

    this.pc += op.arity
    this.cycleCount++
    op.fn.apply(this, args)

    this.pc++

    this.hooks.forEach(fn => fn(this))
  }

  exit(result) {
    if(this.timer) clearTimeout(this.timer)
    this.hooks.forEach(fn => fn(this))
    this.doneHooks.forEach(fn => fn(this, result))
  }

  run(timeout) {
    timeout = timeout || 0
    var run = true

    var runHelper = () => {
      try {
        this.cycle()
      } catch (e) {
        run = false
        // reset colours
        if (e.isExit) {
          this.exit({
            type: 'cpu ext',
            data: e.exitCode,
          })

        } else {
          //console.log('-- ERROR -- '.bold.red.inverse + ' \u001B[0m' + (' ' + e.toString() + ' ').inverse)
          this.exit({
            type: 'error',
            data: e,
          })
        }
      }
    }

    if (timeout > 0) {
      this.timer = setInterval(runHelper, timeout)
    } else {
      while(run) runHelper()
    }
  }

  write(to, val) {
    while (val < 0) val += 0x10000
    while (val > 0xffff) val -= 0x10000
    if (!to.mode) throw 'must give an addressing mode'
    switch (to.mode) {
      case 'imm': throw 'cannot write to immediate value ' + to.value + ' (value: ' + val + ')'
      case 'abs':
        this.memory[to.value] = val
        return
      case 'ind':
        this.memory[this.read({ value: to.value, mode: 'reg' })] = val
        return
      case 'reg':
        if (!this.regMap[to.value]) throw 'attempted to write to unknown register ' + to.value
        this.registers[this.regMap[to.value]] = val
        return
    }
    throw 'invalid read value: ' + to
  }

  read(from) {
    if (!from.mode) throw 'must give an addressing mode'
    switch (from.mode) {
      case 'imm': return from.value
      case 'abs': return this.memory[from.value]
      case 'ind': return this.memory[this.read({ value: from.value, mode: 'reg' })]
      case 'reg':
        if (!this.regMap[from.value]) throw 'attempted to get unknown register ' + from.value
        return this.registers[this.regMap[from.value]]
    }
    throw 'invalid read value: ' + from
  }

  nop() {

  }

  ext(code) {
    this.pc--
    throw {
      isExit: true,
      exitCode: code.value
    }
  }

  sys(val) {
    var v = this.read(val)
    if (!this.sysCalls[v]) throw 'syscall ' + v + ' not provided'
    this.sysCalls[v](this)
  }

  mov(to, from) {
    this.write(to, this.read(from))
  }

  jmp(addr) {
    this.pc = this.read(addr) - 1
  }

  jeq(addr, b, c) {
    if (this.read(b) == this.read(c)) this.jmp(addr)
  }

  jne(addr, b, c) {
    if (this.read(b) != this.read(c)) this.jmp(addr)
  }

  jgt(addr, b, c) {
    if (this.read(b) > this.read(c)) this.jmp(addr)
  }

  jge(addr, b, c) {
    if (this.read(b) >= this.read(c)) this.jmp(addr)
  }

  jlt(addr, b, c) {
    if (this.read(b) < this.read(c)) this.jmp(addr)
  }

  jle(addr, b, c) {
    if (this.read(b) <= this.read(c)) this.jmp(addr)
  }

  jsr(addr) {
    this.callStack.push(this.pc)
    this.jmp(addr)
  }

  ret() {
    if (this.callStack.length == 0) throw 'tried to return with empty callstack!'
    this.pc = this.callStack.pop()
  }

  add(a, b) {
    this.write(a, this.read(a) + this.read(b))
  }

  sub(a, b) {
    this.write(a, this.read(a) - this.read(b))
  }

  mul(a, b) {
    this.write(a, this.read(a) * this.read(b))
  }

  mod(a, b) {
    this.write(a, this.read(a) % this.read(b))
  }

  and(a, b) {
    this.write(a, this.read(a) & this.read(b))
  }

  orr(a, b) {
    this.write(a, this.read(a) | this.read(b))
  }

  not(a) {
    this.write(a, ~this.read(a))
  }

  xor(a, b) {
    this.write(a, this.read(a) ^ this.read(b))
  }

  lsl(a, b) {
    this.write(a, this.read(a) << this.read(b))
  }

  lsr(a, b) {
    this.write(a, this.read(a) >> this.read(b))
  }

  psh(a) {
    this.stack.push(this.read(a))
  }

  pop(a) {
    if (this.stack.length == 0) throw 'tried to pop empty stack'
    this.write(a, this.stack.pop())
  }
}

module.exports = CPU

/*if (typeof exports !== 'undefined') {
  if (typeof module !== 'undefined' && module.exports) {
    exports = module.exports = CPU;
  }
  exports.CPU = CPU;
} else {
  document['CPU'] = CPU;
}*/