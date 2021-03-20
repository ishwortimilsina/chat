const _ = require('lodash');
const { activeUsers, meetStrangerRoom, strangerPairs } = require('./data');

function deletePairAndLetPartnerKnow(userId, io) {
    const partner = strangerPairs.get(userId);
    strangerPairs.delete(userId);
    if (partner) {
        strangerPairs.delete(partner);
        // tell the other user (stranger) to remove this user and get another one
        if (activeUsers[partner]) {
            io.to(activeUsers[partner].socketId).emit('stranger-left', { strangerId: userId });
        }
    }
}

function handleMeetStrangerRemoval(userId, socket, io) {
    // remove from meet-stranger room
    socket.leave('meet-stranger');
    meetStrangerRoom.delete(userId)
    deletePairAndLetPartnerKnow(userId, io);
}

function handleMeetStranger(userId, socket, io) {
    async function sendNewStrangerToThisClient() {
        const getRandomIndex = () => Math.floor(Math.random() * meetStrangerRoom.size);

        if (meetStrangerRoom.size > 1) {
            let randomIndex = getRandomIndex();
            let triesToFindStranger = 0;
            const meetStrangerRoomArr = Array.from(meetStrangerRoom);

            while (
                triesToFindStranger < 100 &&
                meetStrangerRoomArr[randomIndex] === userId &&
                activeUsers[meetStrangerRoomArr[randomIndex]] &&
                !strangerPairs.has(meetStrangerRoomArr[randomIndex])
            ) {
                randomIndex = getRandomIndex();
            }

            if (
                meetStrangerRoomArr[randomIndex] !== userId &&
                activeUsers[meetStrangerRoomArr[randomIndex]] &&
                !strangerPairs.has(meetStrangerRoomArr[randomIndex])
            ) {
                const chosenContact =  _.omit(activeUsers[meetStrangerRoomArr[randomIndex]], ['socketId', 'rooms']);
                if (chosenContact) {
                    // send this new stranger's contact to self
                    strangerPairs.set(userId, chosenContact.userId);
                    socket.emit('new-contact', {
                        roomId: "meet-stranger",
                        contact: chosenContact,
                        connInitiator: true // so that one, not both, sends an 'offer' to the other
                    });

                    // send self's contact to this stranger
                    strangerPairs.set(chosenContact.userId, userId);
                    io.to(activeUsers[meetStrangerRoomArr[randomIndex]].socketId).emit('new-contact', {
                        roomId: "meet-stranger",
                        contact: _.omit(activeUsers[userId], ['socketId', 'rooms'])
                    });
                    return meetStrangerRoomArr[randomIndex];
                }
            }
        }
        // if no stranger is found to connect self too, delete it from the strangerPairs Map
        strangerPairs.delete(userId);
    }

    socket.on('join-meet-stranger-room', () => {
        socket.join('meet-stranger');
        meetStrangerRoom.add(userId);
        socket.emit('join-meet-stranger-room', { success: true });
        sendNewStrangerToThisClient();
    });

    socket.on('leave-meet-stranger-room', () => {
        socket.leave('meet-stranger');
        meetStrangerRoom.delete(userId);
        deletePairAndLetPartnerKnow();
    });

    socket.on('get-next-stranger', () => {
        deletePairAndLetPartnerKnow();
        sendNewStrangerToThisClient();
    });

}

exports.handleMeetStrangerRemoval = handleMeetStrangerRemoval;
exports.handleMeetStranger = handleMeetStranger;