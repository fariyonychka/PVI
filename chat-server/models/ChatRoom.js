const mongoose = require('mongoose');
const chatRoomSchema = new mongoose.Schema({
  participants: [Number] 
});
module.exports = mongoose.model('ChatRoom', chatRoomSchema);
