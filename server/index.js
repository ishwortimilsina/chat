const { contacts } = require("./contacts");

const app = require("express")();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const PORT = process.env.PORT || 3001;

io.on('connection', (socket) => {
    const clientId = socket.handshake.query.id;
    console.log(`Client ${clientId} with socket id ${socket.id} connected.`);
    
    // join my own room. All other users will send messages to this
    // room if they are sending it to me
    socket.join(clientId);

    // send the contacts list to this client
    socket.emit('contacts-list', { contacts: contacts.filter(cont => cont.id !== clientId) });
    
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
});

server.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});