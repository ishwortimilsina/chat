import { appStore } from "../..";
import { REMOTE_AUDIO_READY, REMOTE_VIDEO_READY } from "./actionTypes";
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
        const { peerConnection, dataChannel } = peerConnections[userId] || {};

        if (peerConnection) {
            console.log(`Sending an offer to ${userId}`);
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            if (dataChannel && dataChannel.readyState === 'open') {
                dataChannel.send(JSON.stringify({
                    type: 'audio-video-negotiation',
                    msg: {
                        msgType: 'send-offer',
                        offer: peerConnection.localDescription,
                        callType: type
                    }
                }));
            } else if (newSocket) {
                newSocket.emit('send-offer', {
                    recipientId: userId,
                    offer: peerConnection.localDescription,
                    type
                });
            }
        }
    } catch(error) {
        console.log('Error while create an offer: ' + error);
    }
}

export function closePeerConnection(userId, type) {
    const { peerConnection } = peerConnections[userId] || {};

    if (peerConnection) {
        peerConnection.onicecandidate = null;
        peerConnection.onnegotiationneeded = null;
        peerConnection.oniceconnectionstatechange = null;
        peerConnection.onaddstream = null;

        peerConnection.close();
        peerConnections[userId] = null;
    }
}

export function createPeerConnection(recipientId, type) {
    let peerConnection;
    if (!peerConnections[recipientId] || !peerConnections[recipientId].peerConnection) {
        peerConnection = new RTCPeerConnection({
            iceServers: [
                {
                    urls: "stun:stun.stunprotocol.org"
                }
            ]
        });

        peerConnections[recipientId] = { peerConnection };
    } else {
        ({ peerConnection } = peerConnections[recipientId]);
    }

    peerConnection.onicecandidate = function handleICECandidateEvent(event) {
        if (event.candidate) {
            console.log(`Sending ICE candidate to ${recipientId}`);
            const { dataChannel } = peerConnections[recipientId];
            if (dataChannel && dataChannel.readyState === 'open') {
                dataChannel.send(JSON.stringify({
                    type: 'audio-video-negotiation',
                    msg: {
                        msgType: 'send-candidate',
                        candidate: event.candidate,
                        callType: type
                    }
                }));
            } else if (newSocket) {
                newSocket.emit('send-candidate', { recipientId, candidate: event.candidate, type });
            }
        }
    };
    peerConnection.onnegotiationneeded = () => makeOffer(recipientId, type);
    peerConnection.oniceconnectionstatechange = function handleICEConnectionStateChangeEvent() {
        if (peerConnection.iceConnectionState === "closed" || peerConnection.iceConnectionState === "failed") {
            closePeerConnection(recipientId, type);
        }
    };
    peerConnection.ontrack = function handleOnAddStream(event) {
        peerConnections[recipientId][type === 'audio' ? 'remoteAudioStream' : 'remoteVideoStream'] = event.streams[0];
        appStore.dispatch({ type: type === 'audio' ? REMOTE_AUDIO_READY : REMOTE_VIDEO_READY });
    }
}