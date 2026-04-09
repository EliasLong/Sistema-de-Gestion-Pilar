
const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\ilongstaff\\Documents\\Sistema-de-Gestion-Pilar\\src\\components\\tracking\\B2BTable.tsx', 'utf8');
const lines = content.split('\n');

let balance = 0;
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const open = (line.match(/{/g) || []).length;
    const close = (line.match(/}/g) || []).length;
    balance += open;
    balance -= close;
    if (i >= 106 && i <= 878) {
        console.log(`${i+1}: Balance: ${balance} | ${line.trim()}`);
    }
}
