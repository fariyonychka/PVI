const mongoose = require('mongoose');
const chatRoomSchema = new mongoose.Schema({
  participants: [Number] // ID студентів з MySQL
});
module.exports = mongoose.model('ChatRoom', chatRoomSchema);
