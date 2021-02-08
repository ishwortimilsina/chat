const { contacts } = require("./contacts");

const app = require("express")();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const PORT = process.env.PORT || 3001;

/**
 * returns are array of the userids that are connected in the chat room
 */
function getAllConnectedChatUserIds() {
    const ids = [];
    const allClientsInChatRoom = io.sockets.adapter.rooms.get('text-chat-room');
    const allConnectedSockets = io.sockets.sockets
    allClientsInChatRoom.forEach((sockId) => {
        const sock = allConnectedSockets.get(sockId);
        sock && ids.push(sock.handshake.query.id);
    });
    return ids;
}

io.on('connection', (socket) => {
    const clientId = socket.handshake.query.id;
    console.log(`Client ${clientId} with socket id ${socket.id} connected.`);
    
    // join my own room. All other users will send messages to this
    // room if they are sending it to me
    socket.join(clientId);
    socket.join('text-chat-room');
    
    // send the contacts list to this client
    function getAndEmitAvailableUsers() {
        const userIds = getAllConnectedChatUserIds();
        const allContacts = contacts.filter(cont => cont.id !== clientId);
        allContacts.forEach(cont => cont.isActive = userIds.includes(cont.id));

        socket && socket.emit('contacts-list', { contacts: allContacts });
    }
    getAndEmitAvailableUsers();
    const connectedIdsChecker = setInterval(getAndEmitAvailableUsers, 10000); // try every 10 seconds
    
    // every time the client sends a message
    socket.on('send-message', (data) => {
        data.recipients.forEach(recipient => {
            socket.to(recipient).emit('receive-message', {
                recipients: data.recipients.filter(r => r !== recipient),
                sender: clientId,
                msg: data.msg,
                time: data.time || Date.now()
            });
        });
    });

    socket.on('disconnect', () => {
        console.log(`Client ${clientId} with socket id ${socket.id} disconnected.`);
        if (connectedIdsChecker) clearInterval(connectedIdsChecker);
    });
});

server.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});