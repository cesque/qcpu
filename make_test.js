var vals = [
  0xc003, 0x5, 0x11,
  0xe003, 0x4, 0x5,
  0x2, 0x6,
  0xc00d, 0x5, 0x1,
  0x2006, 0x3, 0x5, 0x0,
  0x1, 0x0, 
]

var message = 'hello world :)\nlets goooooo'

vals = vals.concat([...message].map(x => x.charCodeAt(0)))

var buffer = Buffer.alloc(2*vals.length);

var fs = require('fs')

for (var i = 0; i < vals.length; i++) {
  var n = vals[i];
  var high = 0xFF00 & n;
  var low = 0x00FF & n;
  buffer[i*2] = low;
  buffer[(i*2) + 1] = high >> 8;
}

fs.writeFile("test", buffer, function (err) { 
  console.log(err)
})