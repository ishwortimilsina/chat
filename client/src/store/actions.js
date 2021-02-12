import io from 'socket.io-client';

export const SET_CONTACTS = 'contacts:set';
export const SEND_MESSAGE = 'message:send';
export const RECEIVE_MESSAGE = 'message:receive'; 

let newSocket = null;
let peerConnections = {};
let dataChannels = {};

export function establishConnection(id, name) {
    return async (dispatch) => {
        try {
            newSocket = await io(
                'http://localhost:3001',
                {
                    query: { id, name },
                    transports: ["websocket"]
                },
            );

            newSocket.on('contacts-list', data => {
                dispatch({
                    type: SET_CONTACTS,
                    contacts: data.contacts
                });
            });

            // ********************************************************************************
            // When this user recieves an offer, create an answer and reply to the offerer
            newSocket.on('receive-offer', ({ offererId, offer }) => {
                console.log(`An offer received from ${offererId}`);

                if (!peerConnections[offererId]) createPeerConnection(offererId);
                const peerConnection = peerConnections[offererId];

                peerConnection.ondatachannel = function handleOnDataChannel(event) {
                    dataChannels[offererId] = event.channel;
                    dataChannels[offererId].onmessage = (msg) => {
                        window.reduxStore.dispatch({
                            type: RECEIVE_MESSAGE,
                            sender: offererId,
                            time: Date.now(),
                            text: msg.data
                        });
                    }
                }

                // take the SDP (session description protocol) offer and create a new 
                // RTCSessionDescription object representing the offerer's session description.
                const sessDesc = new RTCSessionDescription(offer);

                // use the session description to now establish the received offer as the 
                // description of the remote (caller/offerer's) end of the connection
                peerConnection.setRemoteDescription(sessDesc)
                    // the description of the local end of the connection is set to the answer's
                    // SDP, and then send the answer to the remote through the server
                    .then(() => peerConnection.createAnswer())
                    .then((answer) => peerConnection.setLocalDescription(answer))
                    .then(() => {
                        newSocket.emit('answer-offer', {
                            offererId,
                            answer: peerConnection.localDescription
                        });
                    })
                    .catch((error) => console.log(error));
            });

            // ********************************************************************************
            // when this user receives an answer to the offer made
            newSocket.on('receive-answer', ({ answererId, answer }) => {
                console.log(`Received an answer from ${answererId} to the offer made.`);
                const peerConnection = peerConnections[answererId];
                if (peerConnection) {
                    peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
                        .catch(error => console.log(error));
                }
            });

            // ********************************************************************************
            // when this user receives an ICE candidate
            newSocket.on('receive-candidate', ({ senderId, candidate }) => {
                console.log(`Received an ICE candidate from ${senderId}.`);
                const peerConnection = peerConnections[senderId];
                // deliver the candidate to the local ICE layer
                if (peerConnection) {
                    peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
                        .catch(error => console.log(error));
                }
            });

        } catch (ex) {
            console.log(ex);
        }
    };
}

export function sendMessage({ recipient, text, sender }) {
    return async (dispatch) => {
        try {
            const dataChannel = dataChannels[recipient];
            if (dataChannel && dataChannel.readyState === 'open') {
                dataChannels[recipient].send(text);
            }
            dispatch({
                type: SEND_MESSAGE,
                recipient,
                text,
                sender,
                time: Date.now()
            });
        } catch (ex) {
            console.log(ex);
        }
    }
}

export async function makeOffer(userId) {
    try {
        const peerConnection = peerConnections[userId];

        if (peerConnection) {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            newSocket.emit('send-offer', {
                recipientId: userId,
                offer: peerConnection.localDescription
            });
        }
    } catch(error) {
        console.log('Error while create an offer: ' + error);
    }
}

function closePeerConnection(userId) {
    const peerConnection = peerConnections[userId];

    if (peerConnection) {
        peerConnection.onicecandidate = null;
        peerConnection.onnegotiationneeded = null;
        peerConnection.oniceconnectionstatechange = null;

        peerConnection.close();
        peerConnections[userId] = null;
    }
}

export function createPeerConnection(recipientId) {
    const peerConnection = new RTCPeerConnection({
        iceServers: [
            {
                urls: "stun:stun.stunprotocol.org"
            }
        ]
    });
    peerConnections[recipientId] = peerConnection;

    peerConnection.onicecandidate = function handleICECandidateEvent(event) {
        if (event.candidate && newSocket) {
            newSocket.emit('send-candidate', { recipientId, candidate: event.candidate });
        }
    };

    peerConnection.onnegotiationneeded = () => makeOffer(recipientId);
    peerConnection.oniceconnectionstatechange = function handleICEConnectionStateChangeEvent() {
        if (peerConnection.iceConnectionState === "closed" || peerConnection.iceConnectionState === "failed") {
            closePeerConnection(recipientId);
        }
    };
}

export function callUser(recipientId) {
    createPeerConnection(recipientId);

    // makeOffer(recipientId);

    // create a dataChannel and handle the channel events
    const peerConnection = peerConnections[recipientId];
    const dataChannel = peerConnection.createDataChannel('text-channel', { reliable: true });
    dataChannels[recipientId] = dataChannel;

    dataChannel.onopen = (event) => console.log('Data channel is ready.');
    dataChannel.onerror = (error) => console.log(error);
    dataChannel.onmessage = (msg) => {
        window.reduxStore.dispatch({
            type: RECEIVE_MESSAGE,
            sender: recipientId,
            time: Date.now(),
            text: msg.data
        });
    }
    dataChannel.onclose = (event) => console.log('Data channel is closed');
}

export function leaveChat({ recipientId }) {
    closePeerConnection(recipientId);
    newSocket && newSocket.emit('leave-chat', ({ recipientId }));
}