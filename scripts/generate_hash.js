const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync('god25', salt);
console.log('Password: god25');
console.log('Hash:', hash);