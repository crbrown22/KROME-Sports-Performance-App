const fs = require('fs');
const path = './src/data/exerciseLibrary.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/(\{[^}]*equipment:\s*\[[^\]]*\])(?!\s*,\s*videoUrl)(?=\s*\})/g, "$1, videoUrl: 'https://www.youtube.com/embed/bEv6CCg2BC8'");

fs.writeFileSync(path, content);
console.log('Done');
