const mongoose = require('mongoose');

const unreadMessageSchema = new mongoose.Schema({
  chatRoomId: mongoose.Schema.Types.ObjectId,
  receiverId: Number, 
  authorName: String,
  text: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UnreadMessage', unreadMessageSchema);
