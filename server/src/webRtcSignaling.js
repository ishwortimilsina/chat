const { activeUsers } = require('./data');
function handleWebRtcSignaling(userId, socket, io) {
    socket.on('send-offer', (data) => {
        console.log(`Sending an offer from ${userId} to ${data.recipientId}.`);

        if (activeUsers[data.recipientId]) {
            io.to(activeUsers[data.recipientId].socketId).emit('receive-offer', {
                offererId: userId,
                offer: data.offer,
                type: data.type
            });
        } else {
            console.log(`User ${data.recipientId} is not connected.`);
        }
    });

    socket.on('answer-offer', (data) => {
        console.log(`${userId} answering the offer made by ${data.offererId}.`);

        if (activeUsers[data.offererId]) {
            io.to(activeUsers[data.offererId].socketId).emit('receive-answer', {
                answererId: userId,
                answer: data.answer,
                type: data.type
            });
        } else {
            console.log(`User ${data.offererId} is not connected.`);
        }
    });

    socket.on('send-candidate', (data) => {
        console.log(`Sending candidate from ${userId} to ${data.recipientId}.`);

        if (activeUsers[data.recipientId]) {
            io.to(activeUsers[data.recipientId].socketId).emit('receive-candidate', {
                senderId: userId,
                candidate: data.candidate,
                type: data.type
            });
        } else {
            console.log(`User id ${data.recipientId} is not connected.`);
        }
    });
}

exports.handleWebRtcSignaling = handleWebRtcSignaling;