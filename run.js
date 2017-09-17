var hrtime = require('process.hrtime');

var fs = require('fs')
var filename = require('file-name');
var colors = require('colors')

var CPU = require('./cpu.js')

//var Visualiser = require('./visualiser')

var args = process.argv.slice(2)
if (args.length == 0) {
  console.log('please supply a file'.red)
  process.exit(1)
}

var file = fs.readFileSync(args[0])
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

var bgColorFns = [
  colors.bgWhite,
  colors.bgGreen,
  colors.bgRed,
  colors.bgYellow,
  colors.bgBlue,
  colors.bgMagenta,
  colors.bgCyan,
  colors.bgBlack,
  colors.bgGray,
]

var currentColor = colorFns[0]
var currentBackground = bgColorFns[7]

var cpu = new CPU()
cpu.debugEnabled = true
/*
// fibonacci
var input = `+++++++++++
>+>>>>++++++++++++++++++++++++++++++++++++++++++++
>++++++++++++++++++++++++++++++++<<<<<<[>[>>>>>>+>
+<<<<<<<-]>>>>>>>[<<<<<<<+>>>>>>>-]<[>++++++++++[-
<-[>>+>+<<<-]>>>[<<<+>>>-]+<[>[-]<[-]]>[<<[>>>+<<<
-]>>[-]]<<]>>>[>>+>+<<<-]>>>[<<<+>>>-]+<[>[-]<[-]]
>[<<+>>[-]]<<<<<<<]>>>>>[+++++++++++++++++++++++++
+++++++++++++++++++++++.[-]]++++++++++<[->-<]>++++
++++++++++++++++++++++++++++++++++++++++++++.[-]<<
<<<<<<<<<<[>>>+>+<<<<-]>>>>[<<<<+>>>>-]<-[>>.>.<<<
[-]]<<[>>+>+<<<-]>>>[<<<+>>>-]<<[<+>-]>[<+>-]<<<-]` + '\0'*/

var input = `Calculate the value 256 and test if it's zero
If the interpreter errors on overflow this is where it'll happen
++++++++[>++++++++<-]>[<++++>-]
+<[>-<
    Not zero so multiply by 256 again to get 65536
    [>++++<-]>[<++++++++>-]<[>++++++++<-]
    +>[>
        # Print "32"
        ++++++++++[>+++++<-]>+.-.[-]<
    <[-]<->] <[>>
        # Print "16"
        +++++++[>+++++++<-]>.+++++.[-]<
<<-]] >[>
    # Print "8"
    ++++++++[>+++++++<-]>.[-]<
<-]<
# Print " bit cells\n"
+++++++++++[>+++>+++++++++>+++++++++>+<<<<-]>-.>-.+++++++.+++++++++++.<.
>>.++.+++++++..<-.>>-
Clean up used cells.
[[-]<]` + '\0' + ''
//var input = '++++++++++[>+++++++>++++++++++>+++>+<<<<-]>++.>+.+++++++..+++.>++.<<+++++++++++++++.>.+++.------.--------.>+.>.\0'
var inputIndex = 0

cpu.load(file)
cpu.provide(0x6, c => process.stdout.write(currentBackground(currentColor(String.fromCharCode(c.registers.x)))))
cpu.provide(0x7, c => {
  if (inputIndex >= input.length) throw 'ran out of input!'
  c.registers.x = input.charCodeAt(inputIndex)
  inputIndex++
})
cpu.provide(0xB, c => currentColor = colorFns[c.registers.x])
cpu.provide(0xC, c => {currentBackground = bgColorFns[c.registers.x]})
cpu.provide(0xF, c => {
  var offset = 0
  var s = ''
  var slice = c.memory.slice()
  for (var i = 0; i < slice.length; i += 16) {
    var line = i.toString().padStart(6) + ': '
    for (var j = 0; j < 16 && (i+j) < slice.length; j++) {
      line += slice[i+j].toString(16).padStart(4,'.') + ' '
    }
    
    s += line +'\r\n'
  }
  fs.writeFileSync('./' + filename(args[0]) + '_debug.txt', s)
})


//visualiser = new Visualiser(cpu, './files/' + filename(args[0]) + '.qasm', 'utf8')

//cpu.hook(c => visualiser.update(c))
var hrstart = undefined
cpu.done((c, r) => {
  if (r.type == 'cpu ext') {
    var hrend = hrtime(hrstart,'ms');
    console.log()
    console.log('\u001B[0m' + (' exited with code ' + r.data + ' ').inverse)
    console.log((' cycle count: ' + c.cycleCount).gray)
    console.log((' execution time: ' + hrend.toFixed(3) + 'ms').gray)
    console.log((' ms/cycle: ' + (hrend/c.cycleCount).toFixed(3) + 'ms').gray)

  } else if (r.type == 'error') {
    console.log('-- ERROR -- '.bold.red.inverse + ' \u001B[0m' + (' ' + r.data + ' ').inverse)
  } else {
    console.log('unknown error type: ' + r.type)
    console.log('data: ' + r.data)
  }
})

hrstart = hrtime();
cpu.run()