const _ = require('lodash');
const { activeUsers, rooms } = require('../src/data');

// send all currently active contacts in the room to this user
function sendAllActiveContactsToThisClient(roomId, userId, socket) {
    const otherUsers = [];
    _.forEach(activeUsers, (cont) => {
        if (cont.userId !== userId && rooms[roomId].roomies.includes(cont.userId)) {
            otherUsers.push({ userId: cont.userId, userName: cont.userName, isActive: cont.isActive });
        }
    });
    socket.emit('contacts-list', { roomId, contacts: otherUsers });
}

// send this client to all other clients in the room
function sendThisContactActivenessToAllOtherClients(isActive, roomId, userId, io) {
    const currUser = _.omit(activeUsers[userId], ['socketId', 'rooms']);
    _.forEach(activeUsers, (cont) => {
        if (cont.userId !== userId && rooms[roomId].roomies.includes(cont.userId)) {
            io.to(cont.socketId).emit(
                isActive ? 'new-contact' : 'remove-contact',
                {
                    roomId,
                    contact: currUser
                }
            );
        }
    });
}

exports.sendAllActiveContactsToThisClient = sendAllActiveContactsToThisClient;
exports.sendThisContactActivenessToAllOtherClients = sendThisContactActivenessToAllOtherClients;