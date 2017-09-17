mov y data
loop:
  mov x [y]
  sys 6
  add y 1
  jne loop [y] 0
ext 0

.org(0x20) data: .text('hello marvin it works pogchampion') 0xa