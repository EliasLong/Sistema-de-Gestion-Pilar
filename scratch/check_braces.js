
const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\ilongstaff\\Documents\\Sistema-de-Gestion-Pilar\\src\\components\\tracking\\B2BTable.tsx', 'utf8');

let openBraces = 0;
let closeBraces = 0;
let lineNum = 1;

for (let i = 0; i < content.length; i++) {
    if (content[i] === '{') openBraces++;
    if (content[i] === '}') closeBraces++;
    if (content[i] === '\n') lineNum++;
}

console.log(`Lines: ${lineNum}`);
console.log(`Open braces: ${openBraces}`);
console.log(`Close braces: ${closeBraces}`);
console.log(`Difference: ${openBraces - closeBraces}`);
