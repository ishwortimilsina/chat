const { activeUsers, rooms } = require('./data');
const { sendAllActiveContactsToThisClient, sendThisContactActivenessToAllOtherClients } = require('../utils/contactUtils');
const { generateRandomString } = require('../utils/utils');

function removeUserFromAllRooms(userId, io) {
    // remove this user from all rooms
    activeUsers[userId].rooms.forEach((roomId) => {
        rooms[roomId].roomies = rooms[roomId].roomies.filter(id => id !== userId);
    });

    // send to all contacts in all rooms that this client was connected
    // that this client is now disconnected
    activeUsers[userId].rooms.forEach((roomId) => {
        sendThisContactActivenessToAllOtherClients(false, roomId, userId, io);
    });
}

function handleRooms(userId, socket, io) {
    socket.on('create-room', ({ roomName, roomType  }) => {
        let roomId = generateRandomString().toLowerCase();
        while (rooms[roomId]) {
            roomId = generateRandomString();
        }

        rooms[roomId] = {
            roomId,
            roomName,
            roomType: roomType || 'meet',
            roomies: [],
            isActive: false
        };
        io.to(socket.id).emit('create-room', {
            roomId,
            success: true
        });
    });

    function checkRoomAvailability(roomId, roomType) {
        if (rooms[roomId] && rooms[roomId].roomType === roomType) {
            if (roomType === "share-files") {
                if (rooms[roomId].roomies.length < 2) return true;
                return false;
            } else {
                return true;
            }
        }
    }

    socket.on('check-room-availability', ({ roomId, roomType }) => {
        io.to(socket.id).emit('room-availability', {
            roomId,
            isAvailable: checkRoomAvailability(roomId, roomType)
        });
    });

    socket.on('join-room', ({ roomId, roomType }) => {
        if (!checkRoomAvailability(roomId, roomType)) {
            io.to(socket.id).emit('join-room', {
                roomId,
                success: false,
                msg: 'Room does not exist.'
            });
        } else {
            if (!activeUsers[userId].rooms.includes(roomId)) {
                activeUsers[userId].rooms.push(roomId);
            }
            rooms[roomId].roomies.push(userId);
            rooms[roomId].isActive = true;
            io.to(socket.id).emit('join-room', {
                roomId,
                roomName: rooms[roomId].roomName,
                success: true
            });
            sendAllActiveContactsToThisClient(roomId, userId, socket);
            sendThisContactActivenessToAllOtherClients(true, roomId, userId, io);
        }
    });

    socket.on('leave-room', ({ roomId }) => {
        if (rooms[roomId]) {
            if (!activeUsers[userId].rooms.includes(roomId)) {
                activeUsers[userId].rooms = activeUsers[userId].rooms.filter(id => roomId !== id);
            }
            rooms[roomId].roomies = rooms[roomId].roomies.filter(id => id !== userId);
            if (!rooms[roomId].roomies.length) {
                rooms[roomId].isActive = false;
            }

            sendThisContactActivenessToAllOtherClients(false, roomId, userId, io);
        }
        io.to(socket.id).emit('leave-room', {
            roomId,
            success: true
        });
    });
}

exports.removeUserFromAllRooms = removeUserFromAllRooms;
exports.handleRooms = handleRooms;