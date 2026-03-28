const fs = require('fs');
const content = fs.readFileSync('d:\\Dinamalar\\screens\\CommonSectionScreen.js', 'utf8');

let openCount = 0;
let closeCount = 0;

for (let char of content) {
  if (char === '{') openCount++;
  else if (char === '}') closeCount++;
}

console.log('Open braces:', openCount);
console.log('Close braces:', closeCount);
console.log('Difference:', openCount - closeCount);

if (openCount !== closeCount) {
  console.log('Brace mismatch detected!');
} else {
  console.log('Braces are balanced');
}
