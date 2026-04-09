
const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\ilongstaff\\Documents\\Sistema-de-Gestion-Pilar\\src\\components\\tracking\\B2BTable.tsx', 'utf8');
const lines = content.split('\n');

for (let i = 875; i < 890; i++) {
    const line = lines[i];
    if (!line) continue;
    let hex = '';
    for (let j = 0; j < line.length; j++) {
        hex += line.charCodeAt(j).toString(16) + ' ';
    }
    console.log(`${i+1}: ${hex} | ${line}`);
}
