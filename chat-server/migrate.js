const mysql = require('mysql2/promise');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: String,
  login: String,
  status: String
});

const User = mongoose.model('User', userSchema);

async function migrateUsers() {
  const mysqlConn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'register-bg'
  });

  await mongoose.connect('mongodb://localhost:27017/chat_app', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  const [users] = await mysqlConn.execute('SELECT * FROM users');
  for (const user of users) {
    await User.create({
      id: user.id.toString(),
      login: user.login,
      status: 'inactive'
    });
  }

  console.log('Міграція користувачів завершена');
  await mysqlConn.end();
  mongoose.connection.close();
  process.exit();
}

migrateUsers();