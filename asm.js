var fs = require('fs')
var filename = require('file-name');

var Assembler = require('./assembler.js')
var asm = new Assembler()

var colors = require('colors')

var args = process.argv.slice(2)
if (args.length == 0) {
  console.log('please supply a file'.red)
  process.exit(1)
}

var file = fs.readFileSync(args[0], 'utf8')

var result = asm.assemble(file)

fs.writeFileSync('./bin/' + filename(args[0]), result.fileBytes)
    
console.log('successfully assembled input file!'.green)
console.log(colors.gray('wrote ' + result.tokens.length + ' tokens'))
console.log(colors.gray('wrote ' + result.memory.length + ' memory addresses'))
console.log(colors.gray('    (size in bytes: ' + result.memory.length * 2 + ')'))
console.log(colors.white('\u001B[0m'))

//fs.writeFileSync('./' + filename(args[0]) + '_debug.json', '{' + result.tokens.map(JSON.stringify).join(',\r\n') + '}')