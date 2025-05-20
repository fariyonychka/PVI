const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost', // Дозволяє запити з XAMPP (Apache)
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Підключення до MongoDB
mongoose.connect('mongodb://localhost:27017/chat_app', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB підключено'))
  .catch(err => console.error('Помилка підключення до MongoDB:', err));

// Схеми MongoDB
const userSchema = new mongoose.Schema({
  id: String,
  login: String,
  status: { type: String, enum: ['active', 'inactive'], default: 'inactive' }
});

const messageSchema = new mongoose.Schema({
  chatRoomId: String,
  senderId: String,
  senderLogin: String,
  content: String,
  timestamp: { type: Date, default: Date.now }
});

const chatRoomSchema = new mongoose.Schema({
  name: String,
  members: [{ type: String }], // ID користувачів
  createdBy: String
});

const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);
const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);

// API для створення чат-кімнати
app.post('/api/chatrooms', async (req, res) => {
  const { name, members, createdBy } = req.body;
  const chatRoom = new ChatRoom({ name, members, createdBy });
  await chatRoom.save();
  res.json({ success: true, chatRoom });
});

// API для отримання чат-кімнат користувача
app.get('/api/chatrooms', async (req, res) => {
  const userId = req.query.userId;
  const chatRooms = await ChatRoom.find({ members: userId });
  res.json(chatRooms);
});

// API для додавання учасника до чат-кімнати
app.post('/api/chatrooms/:id/members', async (req, res) => {
  const { id } = req.params;
  const { memberId } = req.body;
  const chatRoom = await ChatRoom.findById(id);
  if (chatRoom && !chatRoom.members.includes(memberId)) {
    chatRoom.members.push(memberId);
    await chatRoom.save();
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Невірний запит' });
  }
});

// API для отримання повідомлень чат-кімнати
app.get('/api/messages/:chatRoomId', async (req, res) => {
  const { chatRoomId } = req.params;
  const messages = await Message.find({ chatRoomId }).sort({ timestamp: 1 });
  res.json(messages);
});

// API для оновлення статусу користувача
app.post('/api/user/status', async (req, res) => {
  const { userId, status } = req.body;
  await User.findOneAndUpdate({ id: userId }, { status });
  res.json({ success: true });
});

// Socket.IO для реального часу
io.on('connection', (socket) => {
  console.log('Користувач підключений:', socket.id);

  socket.on('joinRoom', ({ chatRoomId, userId }) => {
    socket.join(chatRoomId);
    socket.userId = userId || socket.id;
    console.log(`Користувач ${socket.userId} приєднався до кімнати ${chatRoomId}`);
  });

  socket.on('sendMessage', async ({ chatRoomId, userId, userLogin, content }) => {
    if (!userId) {
      userId = socket.id;
      userLogin = userLogin || 'Гість';
    }
    const message = new Message({ chatRoomId, senderId: userId, senderLogin, content });
    await message.save();
    io.to(chatRoomId).emit('message', message);
    const chatRoom = await ChatRoom.findById(chatRoomId);
    chatRoom.members.forEach(memberId => {
      if (memberId !== userId) {
        io.to(memberId).emit('notification', { chatRoomId, message });
      }
    });
  });

  socket.on('disconnect', () => {
    console.log('Користувач відключений:', socket.id);
  });
});

const PORT = 3000;
server.listen(PORT, () => console.log(`Сервер запущено на порту ${PORT}`));