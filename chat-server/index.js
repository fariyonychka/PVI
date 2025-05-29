require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const mysql = require('mysql2/promise');
const http = require('http');
const cors = require('cors');
const { Server } = require("socket.io");

const ChatRoom = require('./models/ChatRoom');
const Message = require('./models/Message');
const UnreadMessage = require('./models/UnreadMessage');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

app.use(cors());
app.use(express.json());

const PORT = 3000;

// MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// MySQL
let mysqlPool;
(async () => {
  mysqlPool = await mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE
  });
})();

app.get('/chatrooms/:studentId', async (req, res) => {
    res.set('Cache-Control', 'no-store');
  try {
    const studentId = parseInt(req.params.studentId);

    const rooms = await ChatRoom.find({ participants: studentId });

    const allParticipantIds = [
      ...new Set(rooms.flatMap(room => room.participants))
    ];

    const [students] = await mysqlPool.query(
      `SELECT id, first_name, last_name, status FROM students WHERE id IN (?)`,
      [allParticipantIds]
    );

    const studentMap = {};
    students.forEach(st => {
      studentMap[st.id] = st;
    });

    const enrichedRooms = rooms.map(room => ({
      id: room._id,
      participants: room.participants.map(pid => studentMap[pid]).filter(Boolean)
    }));

    res.json(enrichedRooms);
  } catch (err) {
    console.error("❌ Помилка при отриманні чатів:", err);
    res.status(500).json({ error: "Помилка сервера" });
  }
});



app.get('/students', async (req, res) => {
    res.set('Cache-Control', 'no-store');
  try {
    const [students] = await mysqlPool.query(`
      SELECT id, first_name, last_name, status FROM students
    `);
    res.json(students);
  } catch (err) {
    console.error("❌ Помилка при отриманні студентів:", err);
    res.status(500).json({ error: "Помилка сервера" });
  }
});

app.post('/chatrooms', async (req, res) => {
    res.set('Cache-Control', 'no-store');
  try {
    let { participants } = req.body;

    if (!Array.isArray(participants) || participants.length < 2) {
      return res.status(400).json({ error: "Має бути мінімум 2 учасники" });
    }

    participants = participants.sort((a, b) => a - b);

    const existingRoom = await ChatRoom.findOne({
      participants: { $all: participants, $size: participants.length }
    });

    if (existingRoom) {
      return res.json({ message: "Чат вже існує", room: existingRoom });
    }

    const newRoom = new ChatRoom({ participants });
    const saveRoom = await newRoom.save();
    console.log('Чати перезавантажено');
    res.status(201).json({ message: "Чат створено", room: newRoom });
  } catch (err) {
    console.error("❌ Помилка при створенні чату:", err);
    res.status(500).json({ error: "Серверна помилка" });
  }
});

app.get('/messages/:chatRoomId', async (req, res) => {
    res.set('Cache-Control', 'no-store');
  const messages = await Message.find({ chatRoomId: req.params.chatRoomId }).sort({ timestamp: 1 });
  res.json(messages);
});

app.post('/messages', async (req, res) => {
  const { chatRoomId, authorId, authorName, text } = req.body;
  if (!chatRoomId || !authorId || !text) {
    return res.status(400).json({ message: 'Не всі дані передані' });
  }

  const message = new Message({
    chatRoomId,
    authorId,
    authorName,
    text
  });

  await message.save();
  res.status(201).json(message);
});


app.put('/chatrooms/:chatId', async (req, res) => {
  try {
    const chatId = req.params.chatId;
    const { participants } = req.body;

    if (!Array.isArray(participants) || participants.length < 2) {
      return res.status(400).json({ error: "Має бути мінімум 2 учасники" });
    }

    const updated = await ChatRoom.findByIdAndUpdate(
      chatId,
      { participants },
      { new: true }
    );

    res.json({ message: "Учасники оновлені", room: updated });
  } catch (err) {
    console.error("❌ Помилка при оновленні чату:", err);
    res.status(500).json({ error: "Серверна помилка" });
  }
});

app.get('/unread/:userId', async (req, res) => {
  const messages = await UnreadMessage.find({ receiverId: req.params.userId }).sort({ timestamp: -1 });
  res.json(messages);
});

app.delete('/unread/:userId/:chatRoomId', async (req, res) => {
   console.log('🧹 Видаляємо непрочитані:', req.params);
  await UnreadMessage.deleteMany({
    receiverId: req.params.userId,
    chatRoomId: req.params.chatRoomId
  });
  res.sendStatus(204);
});

app.use((req, res, next) => {
  console.log(`🧭 ${req.method} ${req.originalUrl}`);
  next();
});

const onlineUsers = new Map();
// Socket.IO логіка
io.on('connection', (socket) => {
  console.log("🔌 Client connected");

  socket.on('userConnected', async (userId) => {
        console.log(`👤 Користувач ${userId} підключився`);
        onlineUsers.set(userId.toString(), socket.id); 

        try {
            const chatRooms = await ChatRoom.find({ participants: userId });
            chatRooms.forEach((chat) => {
                io.to(chat._id.toString()).emit('userStatusUpdate', {
                    userId: userId.toString(),
                    status: 'active',
                });
            });
            socket.emit('onlineUsers', Array.from(onlineUsers.keys()));
        } catch (err) {
            console.error('❌ Помилка при отриманні чатів для userConnected:', err);
        }
    });

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`👥 Приєднався до кімнати ${roomId}`);

  });

socket.on('sendMessage', async ({ chatRoomId, authorId, authorName, text }) => {
  try {
    const message = await Message.create({
      chatRoomId,
      authorId,
      authorName,
      text
    });

    io.to(chatRoomId).emit('newMessage', message);
    console.log(`📨 ${authorName} (${authorId}) => чат ${chatRoomId}: "${text}"`);
     const chatRoom = await ChatRoom.findById(chatRoomId);
if (!chatRoom) {
  console.error(`❌ Чат кімната з ID ${chatRoomId} не знайдена`);
  return;
}
const chatUsers = chatRoom.participants;
      for (const userId of chatUsers) {
        if (userId !== authorId) {
          await UnreadMessage.create({
            chatRoomId,
            receiverId: userId,
            authorName,
            text
          });
        }
      }
} catch (err) {
    console.error('❌ Помилка при надсиланні повідомлення:', err);
  }
});


  socket.on('disconnect', async () => {
        console.log('🔌 Client disconnected:', socket.id);
        let disconnectedUserId = null;

        for (const [userId, socketId] of onlineUsers) {
            if (socketId === socket.id) {
                disconnectedUserId = userId;
                onlineUsers.delete(userId);
                break;
            }
        }

        if (disconnectedUserId) {
            console.log(`👤 Користувач ${disconnectedUserId} від'єднався`);
            try {
                const chatRooms = await ChatRoom.find({ participants: disconnectedUserId });
                chatRooms.forEach((chat) => {
                    io.to(chat._id.toString()).emit('userStatusUpdate', {
                        userId: disconnectedUserId,
                        status: 'inactive',
                    });
                });
            } catch (err) {
                console.error('❌ Помилка при отриманні чатів для disconnect:', err);
            }
        }
    });
});



server.listen(PORT, () => {
  console.log(`✅ Chat server running on http://localhost:${PORT}`);
});
