var log = require('log-update')
var colors = require('colors')
var boxen = require('boxen')
var stripAnsi = require('strip-ansi')
var fs = require('fs')

var colorFns = [
  colors.white.bold,
  colors.green.bold,
  colors.red.bold,
  colors.yellow.bold,
  colors.blue.bold,
  colors.magenta.bold,
  colors.cyan.bold,
  colors.black.bold,
  colors.gray.bold,
]

var Assembler = require('./assembler.js')
var assembler = new Assembler()

class Visualiser {
  constructor(cpu, file) {
    this.cpu = cpu

    var f = fs.readFileSync(file, 'utf8')
    this.lines = f.replace(/\r/g, '').split('\n')
    this.tokens = assembler.tokenize(f)

    this.breadcrumbs = ['*']

    this.currentColor = colorFns[0]

    this.output = ['']
    this.outputHeight = 5
    this.outputWidth = process.stdout.columns / 2 - 3
    this.outputMargin = 2

    cpu.provide(0x6, (c) => {
      var char = String.fromCharCode(c.registers.x)
      var s = this.currentColor(char) + '\u001B[0m'
      if (char == '\n') {
        if (this.output.length >= this.outputHeight) {
          this.output.shift()
          this.output.push('')
        } else {
          this.output.push('')
        }
      } else {
        this.output[this.output.length - 1] += s
        if (stripAnsi(this.output[this.output.length - 1]).length >= this.outputWidth - this.outputMargin * 2) {
          this.output.shift()
          this.output.push('')
        }
      }
    })
    cpu.provide(0xB, (c) => this.currentColor = colorFns[c.registers.x])
  }

  zip(...boxes) {
    var s = ''
    var maxHeight = Math.max(...boxes.map(x => x.length))
    for (var i = 0; i <= maxHeight; i++) {
      boxes.forEach(box => {
        s += box[i] ? box[i].trim() : ''.padEnd(box[0].length - 1)
      })
      s += '\n'
    }

    return s
  }

  update(cpu) {
    var display = new Array(15)
    display[0] = 'PC: ' + cpu.lastCycleData.pc
    display[1] = ''
    display[2] = 'registers:'.padEnd(12)
    display[3] = '  a: ' + cpu.registers.a
    display[4] = '  b: ' + cpu.registers.b
    display[5] = '  c: ' + cpu.registers.c
    display[6] = '  d: ' + cpu.registers.d
    display[7] = '  x: ' + cpu.registers.x
    display[8] = '  y: ' + cpu.registers.y
    display[9] = ''
    display[10] = 'stack size: '
    display[11] = '  ' + cpu.stack.length
    display[12] = 'c/s size: '
    display[13] = '  ' + cpu.callStack.length
    display[14] = cpu.memory[4660]//cpu.memory[8508]

    var codeWidth = process.stdout.columns / 2 - 12 - 3
    var code = new Array(15).fill(''.padEnd(codeWidth))
    var currentTokenIndex = this.tokens.findIndex(x => x.address == cpu.lastCycleData.pc)
    if (this.tokens[currentTokenIndex].type == 'label') currentTokenIndex++
    var currentToken = this.tokens[currentTokenIndex] // this won't work when pc is in data which wasn't in the file


    if (currentToken.data == 'jsr') {
      var jumpto = this.tokens.find(x => x.address == currentToken.address + 1).data
      this.breadcrumbs.push(jumpto)
    } else if (currentToken.data == 'ret') {
      this.breadcrumbs.pop()
    }

    var line = currentToken.line
    var offset = 7
    for (var i = 0; i < 15; i++) {
      var n = line + i - offset
      if (n >= 0 && n < this.lines.length) {
        var s = this.lines[n].substring(0, codeWidth - this.lines.length.toString().length).padEnd(codeWidth - this.lines.length.toString().length)
        if (i == offset) s = s.inverse
        var lineNumberString = n.toString().padStart(this.lines.length.toString().length)
        lineNumberString = i == offset ? lineNumberString.red.bold + '\u001B[0m' : lineNumberString.gray
        code[i] = lineNumberString + ' ' + s
      }
    }

    /*if (currentToken.data == 'jsr') {
      this.breadcrumbs.push(this.tokens[currentTokenIndex+1].data)
    } else if (currentToken.data == 'ret') {
      console.log('returning')
      this.breadcrumbs.pop()
    }*/

    //console.log(currentToken.data)

    var displayBox = boxen(display.join('\n'), {
      //borderColor: 'red'
    }).replace(/\r/g, '').split('\n').map(x => x.replace(/\n\r/g, '').trim())
    var codeBox = boxen(code.join('\n'), {
      //borderColor: 'white',
      borderStyle: 'double',
    }).replace(/\r/g, '').split('\n').map(x => x.replace(/\n\r/g, '').trim())

    log(
      ' ' + this.breadcrumbs.join(' > '.gray) + '\n' +
      this.zip(displayBox, codeBox).trim() + '\n' +
      boxen('output:'.padEnd(this.outputWidth)
        + '\n' + this.output.map(x => x.padStart(x.length + this.outputMargin)).join('\n')
        + (''.padEnd(this.outputHeight - this.output.length, '\n')), {
          borderColor: 'green',
        }
      ).split('\n').map(x => ' ' + x).join('\n')
    )
  }
}

module.exports = Visualiser