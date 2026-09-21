const fs = require('fs');
let s = fs.readFileSync('d:/WEB/Keuangan/siswa.html', 'utf8');
let sc = fs.readFileSync('d:/WEB/Keuangan/script.js', 'utf8');

const regex = /[^\\x00-\\x7F]+/g;

let sm = [...new Set(s.match(regex))];
console.log('siswa.html mojibakes:');
console.log(sm);

let scm = [...new Set(sc.match(regex))];
console.log('script.js mojibakes:');
console.log(scm);
