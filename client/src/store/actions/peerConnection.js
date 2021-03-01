import { peerConnections } from './connections';

let newSocket;
export function initializeSocketForPeerConnection(currentSocket) {
    newSocket = currentSocket;
    
    newSocket.on('remove-contact', data => {
        closePeerConnection(data.contact.userId);
    });
}

async function makeOffer(userId, type) {
    try {
        const { peerConnection } = peerConnections[userId] || {};

        if (peerConnection && newSocket) {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            newSocket.emit('send-offer', {
                recipientId: userId,
                offer: peerConnection.localDescription,
                type
            });
        }
    } catch(error) {
        console.log('Error while create an offer: ' + error);
    }
}

export function closePeerConnection(userId) {
    const { peerConnection } = peerConnections[userId] || {};

    if (peerConnection) {
        peerConnection.onicecandidate = null;
        peerConnection.onnegotiationneeded = null;
        peerConnection.oniceconnectionstatechange = null;

        peerConnection.close();
        peerConnections[userId] = null;
    }
}

export function createPeerConnection(recipientId, type) {
    const peerConnection = new RTCPeerConnection({
        iceServers: [
            {
                urls: "stun:stun.stunprotocol.org"
            }
        ]
    });

    peerConnections[recipientId] = { peerConnection };

    peerConnection.onicecandidate = function handleICECandidateEvent(event) {
        if (event.candidate) {
            newSocket.emit('send-candidate', { recipientId, candidate: event.candidate, type });
        }
    };
    peerConnection.onnegotiationneeded = () => makeOffer(recipientId, type);
    peerConnection.oniceconnectionstatechange = function handleICEConnectionStateChangeEvent() {
        if (peerConnection.iceConnectionState === "closed" || peerConnection.iceConnectionState === "failed") {
            closePeerConnection(recipientId, type);
        }
    };
}