///////////////////////////
//       view data       //
///////////////////////////

var output = {
  el: '#wrapper',
  data: {
    pc: 0,
    text: [],
    registers: {},
  }
}

///////////////////////////

let CPU = require('../cpu.js')
let Assembler = require('../assembler.js')

let cpu = new CPU()
cpu.debugEnabled = true

let currentColor = '#ffffff'
let currentBackground = '#2c3e50'
let colors = [
  '#ffffff',
  '#2ecc71',
  '#e74c3c',
  '#f1c40f',
  '#3498db',
  '#9b59b6',
  '#1abc9c',
  '#2c3e50',
  '#7f8c8d',
  '#ecf0f1',
]

cpu.provide(0x6, c => {
  output.text.push({
    character: String.fromCharCode(c.registers.x),
    color: currentColor,
    background: currentBackground,
  })
  let elem = document.querySelector('#output-window')
  elem.scrollTop = elem.scrollHeight;
})

cpu.provide(0xB, c => {
  currentColor = colors[c.registers.x]
})
cpu.provide(0xC, c => {
  currentBackground = colors[c.registers.x]
})

let asm = new Assembler()

let samples = []

loadSamples: ((callback) => {
  let sampleNames = [
    'bf.qasm',
    'testbench.asm',
    'printnum.asm',
    'bitcount.asm',
    'colortest.qasm',
  ]

  for (let name of sampleNames) {
    let oReq = new XMLHttpRequest()
    oReq.addEventListener('load', function () {
      console.log('loaded ' + name)
      samples.push({
        name: name,
        code: this.responseText,
      })

      if(samples.length == sampleNames.length) callback()
    })
    oReq.open('GET', '../files/' + name)
    oReq.send()
  }
})(() => {
  console.log('loaded all samples')
  let editor = document.querySelector("#editor")
  editor.textContent = samples.find(x => x.name == 'colortest.qasm').code
})

document.addEventListener("DOMContentLoaded", function (event) { 
  output = new Vue(output)
  document.querySelector("#run-button").addEventListener("click", run)
})

function reset() {
  output.text = []
  currentColor = '#ffffff'
  currentBackground = '#2c3e50'
}

function run() {
  reset()
  var text = document.querySelector("#editor").value
  console.log(text)
  let assembled = asm.assemble(text)
  cpu.load(assembled.fileBytes)
  cpu.hook(c => {
    output.pc = c.pc
    output.registers.a = c.registers.a
    output.registers.b = c.registers.b
    output.registers.c = c.registers.c
    output.registers.d = c.registers.d
    output.registers.x = c.registers.x
    output.registers.y = c.registers.y
  })
  cpu.run(1)
}

