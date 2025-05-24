const mongoose = require('mongoose');
const messageSchema = new mongoose.Schema({
  chatRoomId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom' },
  authorId: Number,
  authorName: String,
  text: String,
  timestamp: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Message', messageSchema);
