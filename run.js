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

// fibonacci
/*var input = `+++++++++++
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
var input = `##########################
###
### Severely updated version!
### (now says "1 bottle" and
### contains no extra "0" verse)
###
##########################
### 99 Bottles of Beer ###
### coded in Brainfuck ###
### with explanations  ###
##########################
#
# This Bottles of Beer program
# was written by Andrew Paczkowski
# Coder Alias: thepacz
# three_halves_plus_one@yahoo.com
#####

>                            0 in the zeroth cell
+++++++>++++++++++[<+++++>-] 57 in the first cell or "9"
+++++++>++++++++++[<+++++>-] 57 in second cell or "9"
++++++++++                   10 in third cell
>+++++++++                    9 in fourth cell

##########################################
### create ASCII chars in higher cells ###
##########################################

>>++++++++[<++++>-]               " "
>++++++++++++++[<+++++++>-]        b
+>+++++++++++[<++++++++++>-]       o
++>+++++++++++++++++++[<++++++>-]  t
++>+++++++++++++++++++[<++++++>-]  t
>++++++++++++[<+++++++++>-]        l
+>++++++++++[<++++++++++>-]        e
+>+++++++++++++++++++[<++++++>-]   s
>++++++++[<++++>-]                " "
+>+++++++++++[<++++++++++>-]       o
++>++++++++++[<++++++++++>-]       f
>++++++++[<++++>-]                " "
>++++++++++++++[<+++++++>-]        b
+>++++++++++[<++++++++++>-]        e
+>++++++++++[<++++++++++>-]        e
>+++++++++++++++++++[<++++++>-]    r
>++++++++[<++++>-]                " "
+>+++++++++++[<++++++++++>-]       o
>+++++++++++[<++++++++++>-]        n
>++++++++[<++++>-]                " "
++>+++++++++++++++++++[<++++++>-]  t
++++>++++++++++[<++++++++++>-]     h
+>++++++++++[<++++++++++>-]        e
>++++++++[<++++>-]                " "
++>+++++++++++++[<+++++++++>-]     w
+>++++++++++++[<++++++++>-]        a
>++++++++++++[<+++++++++>-]        l
>++++++++++++[<+++++++++>-]        l
>+++++[<++>-]                      LF
++>+++++++++++++++++++[<++++++>-]  t
+>++++++++++++[<++++++++>-]        a
+++>+++++++++++++[<++++++++>-]     k
+>++++++++++[<++++++++++>-]        e
>++++++++[<++++>-]                " "
+>+++++++++++[<++++++++++>-]       o
>+++++++++++[<++++++++++>-]        n
+>++++++++++[<++++++++++>-]        e
>++++++++[<++++>-]                " "
>++++++++++[<++++++++++>-]         d
+>+++++++++++[<++++++++++>-]       o
++>+++++++++++++[<+++++++++>-]     w
>+++++++++++[<++++++++++>-]        n
>++++++++[<++++>-]                " "
+>++++++++++++[<++++++++>-]        a
>+++++++++++[<++++++++++>-]        n
>++++++++++[<++++++++++>-]         d
>++++++++[<++++>-]                " "
++>+++++++++++[<++++++++++>-]      p
+>++++++++++++[<++++++++>-]        a
+>+++++++++++++++++++[<++++++>-]   s
+>+++++++++++++++++++[<++++++>-]   s
>++++++++[<++++>-]                " "
+>+++++++++++++[<++++++++>-]       i
++>+++++++++++++++++++[<++++++>-]  t
>++++++++[<++++>-]                " "
+>++++++++++++[<++++++++>-]        a
>+++++++++++++++++++[<++++++>-]    r
+>+++++++++++[<++++++++++>-]       o
>+++++++++++++[<+++++++++>-]       u
>+++++++++++[<++++++++++>-]        n
>++++++++++[<++++++++++>-]         d
>+++++[<++>-]                      LF
+++++++++++++                      CR

[<]>>>>      go back to fourth cell

#################################
### initiate the display loop ###
#################################

[            loop
 <           back to cell 3
 [            loop
  [>]<<       go to last cell and back to LF
  ..          output 2 newlines
  [<]>        go to first cell

 ###################################
 #### begin display of characters###
 ###################################
 #
 #.>.>>>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>
 #X X     b o t t l e s   o f   b e e r  
 #.>.>.>.>.>.>.>.>.>.>.>.
 #o n   t h e   w a l l N
 #[<]>    go to first cell
 #.>.>>>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>>>>>>>>>>>>>.>
 #X X     b o t t l e s   o f   b e e r             N
 #.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>
 #t a k e   o n e   d o w n   a n d   p a s s   
 #.>.>.>.>.>.>.>.>.>.
 #i t   a r o u n d N
 #####

  [<]>>      go to cell 2
  -          subtract 1 from cell 2
  <          go to cell 1

 ########################
 ### display last line ##
 ########################
 #
 #.>.>>>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>
 #X X     b o t t l e s   o f   b e e r  
 #.>.>.>.>.>.>.>.>.>.>.
 #o n   t h e   w a l l
 #####

  [<]>>>-      go to cell 3/subtract 1
 ]            end loop when cell 3 is 0
 ++++++++++   add 10 to cell 3
 <++++++++++  back to cell 2/add 10
 <-           back to cell 1/subtract 1
 [>]<.        go to last line/carriage return
 [<]>         go to first line

########################
### correct last line ##
########################
#
#.>.>>>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>
#X X     b o t t l e s   o f   b e e r  
#.>.>.>.>.>.>.>.>.>.>.
#o n   t h e   w a l l
#####

 [<]>>>>-    go to cell 4/subtract 1
]           end loop when cell 4 is 0

##############################################################
### By this point verses 99/10 are displayed but to work   ###
### with the lower numbered verses in a more readable way  ###
### we initiate a new loop for verses 9{CODE} that will not    ###
### use the fourth cell at all                             ###
##############################################################

+           add 1 to cell four (to keep it non\zero)
<--         back to cell 3/subtract 2

[            loop
 [>]<<       go to last cell and back to LF
 ..          output 2 newlines
 [<]>        go to first cell

 ###################################
 #### begin display of characters###
 ###################################
 #
 #>.>>>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>
 # X     b o t t l e s   o f   b e e r  
 #.>.>.>.>.>.>.>.>.>.>.>.
 #o n   t h e   w a l l N
 #[<]>    go to first cell
 #>.>>>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>>>>>>>>>>>>>.>
 # X     b o t t l e s   o f   b e e r             N
 #.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>
 #t a k e   o n e   d o w n   a n d   p a s s   
 #.>.>.>.>.>.>.>.>.>.
 #i t   a r o u n d N
 #####

 [<]>>       go to cell 2
 -           subtract 1 from cell 2

 ########################
 ### display last line ##
 ########################
 #
 #.>>>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>
 #X     b o t t l e s   o f   b e e r  
 #.>.>.>.>.>.>.>.>.>.>.
 #o n   t h e   w a l l
 #####

 [<]>>>-     go to cell 3/subtract 1
]            end loop when cell 3 is 0
+            add 1 to cell 3 to keep it non\zero

[>]<.        go to last line/carriage return
[<]>         go to first line

########################
### correct last line ##
########################
#
#>.>>>.>.>.>.>.>.>.>>.>.>.>.>.>.>.>.>.>
# X     b o t t l e    o f   b e e r  
#.>.>.>.>.>.>.>.>.>.>.<<<<.
#o n   t h e   w a l l
#####

[>]<<       go to last cell and back to LF
..          output 2 newlines
[<]>        go to first line

#########################
### the final verse    ##
#########################
#
#>.>>>.>.>.>.>.>.>.>>.>.>.>.>.>.>.>.>.>
# X     b o t t l e    o f   b e e r  
#.>.>.>.>.>.>.>.>.>.>.>.
#o n   t h e   w a l l N
#[<]>        go to first cell
#>.>>>.>.>.>.>.>.>.>>.>.>.>.>.>.>.>.>>>>>>>>>>>>>.>
# X     b o t t l e    o f   b e e r             N
#.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>
#t a k e   o n e   d o w n   a n d   p a s s   
#.>.>.>.>.>.>.>.>.>.
#i t   a r o u n d N
#[>]<        go to last line
#<<<.<<.<<<.
#   n  o    
#[<]>>>>     go to fourth cell
#>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>.>
#   b o t t l e s   o f   b e e r  
#.>.>.>.>.>.>.>.>.>.>.>.
#o n   t h e   w a l l N
#####fin##` + '\0'

/*var input = `Calculate the value 256 and test if it's zero
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
[[-]<]` + '\0' + ''*/
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
cpu.provide(0xC, c => currentBackground = bgColorFns[c.registers.x])
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