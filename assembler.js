var ops = [
  { name: 'nop', value: 0x00, arity: 0 },
  { name: 'ext', value: 0x01, arity: 1 },
  { name: 'sys', value: 0x02, arity: 1 },
  { name: 'mov', value: 0x03, arity: 2 },
  { name: 'jmp', value: 0x04, arity: 1 },
  { name: 'jeq', value: 0x05, arity: 3 },
  { name: 'jne', value: 0x06, arity: 3 },
  { name: 'jgt', value: 0x07, arity: 3 },
  { name: 'jge', value: 0x08, arity: 3 },
  { name: 'jlt', value: 0x09, arity: 3 },
  { name: 'jle', value: 0x0A, arity: 3 },
  { name: 'jsr', value: 0x0B, arity: 1 },
  { name: 'ret', value: 0x0C, arity: 0 },
  { name: 'add', value: 0x0D, arity: 2 },
  { name: 'sub', value: 0x0E, arity: 2 },
  { name: 'mul', value: 0x0F, arity: 2 },
  { name: 'mod', value: 0x10, arity: 2 },
  { name: 'and', value: 0x11, arity: 2 },
  { name: 'orr', value: 0x12, arity: 2 },
  { name: 'not', value: 0x13, arity: 1 },
  { name: 'xor', value: 0x14, arity: 2 },
  { name: 'lsl', value: 0x15, arity: 2 },
  { name: 'lsr', value: 0x16, arity: 2 },
  { name: 'psh', value: 0x17, arity: 1 },
  { name: 'pop', value: 0x18, arity: 1 },
]

var registers = [
  { name: 'a', value: 0x00 },
  { name: 'b', value: 0x01 },
  { name: 'c', value: 0x02 },
  { name: 'd', value: 0x03 },
  { name: 'x', value: 0x04 },
  { name: 'y', value: 0x05 },
]

class Assembler {
    
  parseNumber(s) {
    switch (true) {
      case /^\d+$/.test(s): return parseInt(s)
      case /^0x[0-9a-f]+$/i.test(s): return parseInt(/^0x([0-9a-f]+)$/i.exec(s)[1], 16)
      case /^0b[01]+$/i.test(s): return parseInt(/^0b([01]+)$/i.exec(s)[1], 2)
      default: throw 'can\t parse number: ' + s
    }
  }
  
  isNumber(s) {
    switch (true) {
      case /^\d+$/.test(s): return true
      case /^0x[0-9a-f]+$/i.test(s): return true
      case /^0b[01]+$/i.test(s): return true
      default: return false
    }
  }
  
  tokenize(text) {
    text = text.replace(/\r/g,'')
    if (text.indexOf('\0') == -1) text += '\0'
    
    var line = 0
  
    var opTestRegex = new RegExp('^(?:' + ops.map(x => x.name).join('|') + ')$', 'i')
    var registerTestRegex = new RegExp('^[' + registers.map(x => x.name).join('') + ']$', 'i')
  
    var tokens = []
    var labels = []
  
    var addr = 0
    var index = 0
    var temp = ''
    var orgDepth = 0
  
    while (index < text.length) {
      var c = text[index]
      if (c == ';' || c == '#') {
        while (!(text[index] == '\n' || text[index] == '\0')) index++
        continue
      }
      if (orgDepth == 0 && c == '(') orgDepth++
      if (orgDepth > 0) {
        temp += c
        if (c == ')') orgDepth--
        if (c == '\n') line++
      } else if (/\s|\0/.test(c)) {
        if(c == '\n') line++
        // string is whitespace or end of file. token done
        if (temp != '') {
          var type = ''
          switch (true) {
            case opTestRegex.test(temp): type = 'op'; break
            case registerTestRegex.test(temp): type = 'register'; break
            case /^\+|-$/i.test(temp): type = 'immediate label reference'; break  
            case /^[a-z]\w+$/i.test(temp): type = 'immediate label reference'; break
            case this.isNumber(temp): type = 'immediate'; break
            case /^\.\w+(?:\(.*\))$/i.test(temp): type = 'directive'; break
            case /^\$\w+$/i.test(temp) && this.isNumber(/^\$(\w+)$/.exec(temp)[1]): type = 'absolute'; break
            case /^\[\w*\]$/i.test(temp) && registerTestRegex.test(/^\[(\w*)\]$/i.exec(temp)[1]): type = 'indirect'; break
            case /^\$(:\+|-)$/i.test(temp): type = 'immediate label reference'; break    
            case /^\$[a-z]\w+$/i.test(temp): type = 'absolute label reference'; break  
            default:
              console.log(('unrecognised token: ' + '[' + temp.split('') + '] on line ' + line).red)
              process.exit(1)
          }
  
          if (type == 'directive') {
            //directives are handles by assembler
            var t = /^[\.](\w+)(?:\((.*)\))$/i.exec(temp)
            var directive = t[1].toLowerCase()
            var argument = t[2]
  
            switch (directive) {
              case 'org':
                if (!this.isNumber(argument)) {
                  console.log('the argument for .org directive must be a numeric literal'.red)
                  process.exit(1)
                }
                addr = this.parseNumber(argument)
                break
              case 'text':
                if (!/^'.*'$/.test(argument)) {
                  console.log('the argument for .text directive must be a string surrounded by \'quote marks\''.red)
                  process.exit(1)
                }
                var str = /^'(.*)'$/.exec(argument)[1]
                str = str.replace(/\\n/g,'\n')
                for (var i = 0; i < str.length; i++) {
                  var byte = '' + str.charCodeAt(i)
                  tokens.push({ type: 'immediate', data: byte, address: addr, line: line })
                  addr++
                }
                break
              case 'ds':
                if (!this.isNumber(argument)) {
                  console.log('the argument for .ds directive must be a numeric literal'.red)
                  process.exit(1)
                }
                addr += this.parseNumber(argument)
                break
              default:
                console.log(('unrecognised directive: ' + directive).red)
                process.exit(1) 
            }
            temp = ''
  
          } else {
            tokens.push({ type: type, data: temp, address: addr, line: line })
            temp = ''
            addr++
          }
        }
      } else if (/:/.test(c)) {
        // string is colon. token done (and its a label definition)
        tokens.push({ type: 'label', data: temp, address: addr, line: line })
        temp = ''
      } else {
        // still building a token...
        temp += c
      }
      index++
    }
  
    return tokens
  }
  
  buildLabelTable(tokens) {
    var table = {}
    tokens.forEach(function (token) {
      if (token.type == 'label' && !(token.data == '+' || token.data == '-')) {
        table[token.data] = token.address
      }
    });
  
    return table
  }
  
  convert(tokens, labelTable) {
    var addressingModeMap = {
      'immediate': 0b00,
      'immediate label reference': 0b00,
      'absolute': 0b01,
      'absolute label reference': 0b01,
      'indirect': 0b10,
      'register': 0b11,
    }
  
    var maxAddress = tokens.map(x => x.address).reduce((max, current) => current > max ? current : max, 0)
    var array = new Uint16Array(maxAddress + 1)
  
    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i]
      var address = token.address
      var type = token.type
      var data = token.data
      var word = 0
      switch (type) {
        case 'op':
          var op = ops.find(x => x.name == data)
          var val = op.value
          var arity = op.arity
          var args = tokens.slice(i + 1, i + 1 + arity)
          var types = args.map(x => x.type).map(x => addressingModeMap[x])
          while (types.length < 4) types.push(0b00)
          word = types[0] << 14
            | types[1] << 12
            | types[2] << 10
            | types[3] << 8
            | val
          break
        case 'register':
          word = registers.find(x => x.name == data).value
          break
        case 'immediate label reference':
        case 'absolute label reference':  
          if (data == '-') {
            for (var j = i-1; j >= 0; j--) {
              var t = tokens[j]
              if (t.type == 'label' && t.data == '-') {
                word = t.address
                break
              }
            }
          } else if (data == '+') {
            for (var j = i+1; j < tokens.length; j++) {
              var t = tokens[j]
              if (t.type == 'label' && t.data == '+') {
                word = t.address
                break
              }
            }
          } else {
            var labelName = data.replace(/^\$/,'')
            if(!labelTable[labelName]) throw 'couldn\'t find label: ' + labelName
            word = labelTable[labelName]
          }  
          break
        case 'immediate':
          word = this.parseNumber(data)
          break
        case 'absolute':
          var a = /\$(\w+)/.exec(data)[1]
          word = this.parseNumber(a)
          break
        case 'indirect':
          var reg = /\[(a|b|c|d|x|y)\]/i.exec(data)[1]
          word = registers.find(x => x.name == reg.toLowerCase()).value
          break
        case 'label':
          break
        default: throw 'unexpected value type: ' + type
      }
  
      array[address] = word
    }
  
    return array
  }
  
  write(array) {
    var buffer = Buffer.alloc(2 * array.length)
  
    for (var i = 0; i < array.length; i++) {
      var n = array[i]
      var high = 0xFF00 & n
      var low = 0x00FF & n
      buffer[i * 2] = low
      buffer[(i * 2) + 1] = high >> 8
    }

    return buffer
  }

  assemble(file) {
    var tokenized = this.tokenize(file)
    var labelTable = this.buildLabelTable(tokenized)
    var converted = this.convert(tokenized, labelTable)
    var bytes = this.write(converted)

    return {
      file: file,
      tokens: tokenized,
      labels: labelTable,
      memory: converted,
      fileBytes: bytes
    }
  }
}

module.exports = Assembler

/*if (typeof exports !== 'undefined') {
  if (typeof module !== 'undefined' && module.exports) {
    exports = module.exports = Assembler;
  }
  exports.Assembler = Assembler;
} else {
  document['Assembler'] = Assembler;
}*/