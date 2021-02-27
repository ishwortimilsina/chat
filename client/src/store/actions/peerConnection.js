import { appStore } from "../..";
import { REMOTE_AUDIO_READY, REMOTE_VIDEO_READY } from "./actionTypes";
import { dataChannelPeerConnections, audioVideoPeerConnections } from './connections';

let newSocket;
export function initializeSocketForPeerConnection(currentSocket) {
    newSocket = currentSocket;
    
    newSocket.on('remove-contact', data => {
        closePeerConnection(data.contact.userId);
    });
}

async function makeOffer(userId, type) {
    try {
        const { peerConnection } = (
            type === "datachannel"
                ? dataChannelPeerConnections[userId]
                : audioVideoPeerConnections[userId]
        ) || {};

        if (peerConnection) {
            console.log(`Sending an offer to ${userId}`);
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            newSocket && newSocket.emit('send-offer', {
                recipientId: userId,
                offer: peerConnection.localDescription,
                type
            });
        }
    } catch(error) {
        console.log('Error while create an offer: ' + error);
    }
}

export function closePeerConnection(userId, type) {
    const { peerConnection } = (
        type === "datachannel"
            ? dataChannelPeerConnections[userId]
            : audioVideoPeerConnections[userId]
    ) || {};

    if (peerConnection) {
        peerConnection.onicecandidate = null;
        peerConnection.onnegotiationneeded = null;
        peerConnection.oniceconnectionstatechange = null;
        peerConnection.onaddstream = null;

        peerConnection.close();
        if (type === "datachannel") {
            dataChannelPeerConnections[userId] = null;
        } else {
            audioVideoPeerConnections[userId] = null;
        }
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

    if (type === "datachannel") {
        dataChannelPeerConnections[recipientId] = { peerConnection };
    } else {
        audioVideoPeerConnections[recipientId] = { peerConnection };
    }

    peerConnection.onicecandidate = function handleICECandidateEvent(event) {
        if (event.candidate && newSocket) {
            console.log(`Sending ICE candidate to ${recipientId}`);
            newSocket && newSocket.emit('send-candidate', { recipientId, candidate: event.candidate, type });
        }
    };
    peerConnection.onnegotiationneeded = () => makeOffer(recipientId, type);
    peerConnection.oniceconnectionstatechange = function handleICEConnectionStateChangeEvent() {
        if (peerConnection.iceConnectionState === "closed" || peerConnection.iceConnectionState === "failed") {
            closePeerConnection(recipientId, type);
        }
    };
    peerConnection.ontrack = function handleOnAddStream(event) {
        audioVideoPeerConnections[recipientId][type === 'audio' ? 'remoteAudioStream' : 'remoteVideoStream'] = event.streams[0];
        appStore.dispatch({ type: type === 'audio' ? REMOTE_AUDIO_READY : REMOTE_VIDEO_READY });
    }
}