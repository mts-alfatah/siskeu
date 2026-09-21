const fs = require('fs');
const path = require('path');

const dir = 'd:/WEB/Keuangan/';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html') || f.endsWith('.js'));

const replacements = {
  // Double mojibake
  '🏫': '🏫',
  '👨‍🎓': '👨‍🎓',
  '💰': '💰',
  '🔄': '🔄',
  '⚙️': '⚙️',
  '🔑': '🔑',
  '📊': '📊',
  '🚪': '🚪',
  '🔍': '🔍',
  '🖨️': '🖨️',
  '✏️': '✏️',
  '🗑️': '🗑️',
  
  // Single mojibake
  '🛡️': '🛡️',
  '👨‍🏫': '👨‍🏫',
  '🎓': '🎓',
  '🍔': '🍔',
  '📸': '📸',
  '🔍': '🔍',
  '🖨️': '🖨️',
  '✏️': '✏️',
  '🗑️': '🗑️',
  '💰': '💰',
  '🔄': '🔄'
};

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  let modified = false;
  for (const [bad, good] of Object.entries(replacements)) {
    if (content.includes(bad)) {
      content = content.split(bad).join(good);
      modified = true;
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed ${file}`);
  }
});
