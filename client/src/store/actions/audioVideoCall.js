import { appStore } from '../..';

import {
    ACCEPT_AUDIO_CALL, ACCEPT_VIDEO_CALL, REQUEST_VIDEO_CALL,
    END_AUDIO_CALL, REJECT_VIDEO_CALL, REQUEST_AUDIO_CALL, INCOMING_AUDIO_CALL,
    END_VIDEO_CALL, START_AUDIO_CALL, START_VIDEO_CALL, INCOMING_VIDEO_CALL,
    LOCAL_AUDIO_READY, LOCAL_VIDEO_READY, REJECT_AUDIO_CALL
} from "./actionTypes";
import { closePeerConnection, createPeerConnection } from './peerConnection';
import { audioVideoPeerConnections } from './connections';

let currentSocket;

export function initializeSocketForAudioVideoCall(newSocket) {
    currentSocket = newSocket;

    newSocket.on('receive-call-request', data => {
        appStore.dispatch({
            type: data.type === 'audio' ? INCOMING_AUDIO_CALL : INCOMING_VIDEO_CALL,
            otherUser: data.senderId
        });
    });

    newSocket.on('receive-call-accept', data => {
        data.type === 'audio' ? audioCallUser(data.accepterId) : videoCallUser(data.accepterId);
    });

    newSocket.on('receive-call-reject', data => {
        appStore.dispatch({
            type: data.type === 'audio' ? END_AUDIO_CALL : END_VIDEO_CALL,
            otherUser: data.rejecterId
        });
    });

    // ********************************************************************************
    // When this user recieves an offer, create an answer and reply to the offerer
    newSocket.on('receive-offer', async ({ offererId, offer, type }) => {
        if (type !== 'datachannel') {
            console.log(`A ${type} offer received from ${offererId}`);

            createPeerConnection(offererId, type);
            const { peerConnection } = audioVideoPeerConnections[offererId];

                appStore.dispatch({
                    type: type === 'audio' ? START_AUDIO_CALL : START_VIDEO_CALL,
                    otherUser: offererId
                });

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: type !== 'audio',
                    audio: true
                });

                audioVideoPeerConnections[offererId][type === 'audio' ? 'localAudioStream' : 'localVideoStream'] = stream;
                appStore.dispatch({ type: type === 'audio' ? LOCAL_AUDIO_READY : LOCAL_VIDEO_READY });

            // take the SDP (session description protocol) offer and create a new 
            // RTCSessionDescription object representing the offerer's session description.
            const sessDesc = new RTCSessionDescription(offer);

            // use the session description to now establish the received offer as the 
            // description of the remote (caller/offerer's) end of the connection
            peerConnection.setRemoteDescription(sessDesc)
                .then(() => {
                    const stream = audioVideoPeerConnections[offererId][type === 'audio' ? 'localAudioStream' : 'localVideoStream'];
                    stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));
                })
                // the description of the local end of the connection is set to the answer's
                // SDP, and then send the answer to the remote through the server
                .then(() => peerConnection.createAnswer())
                .then((answer) => peerConnection.setLocalDescription(answer))
                .then(() => {
                    console.log(`Sending the answer to the offer made by ${offererId}`);
                    newSocket.emit('answer-offer', {
                        offererId,
                        answer: peerConnection.localDescription,
                        type
                    });
                })
                .catch((error) => console.log(error));
        }
    });

    // ********************************************************************************
    // when this user receives an answer to the offer made
    newSocket.on('receive-answer', ({ answererId, answer, type }) => {
        if (type !== 'datachannel') {
            console.log(`Received an answer from ${answererId} to the ${type} offer made.`);
            const { peerConnection } = audioVideoPeerConnections[answererId] || {};
            if (peerConnection && peerConnection.localDescription) {
                peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
                    .catch(error => console.log(error));
            }
        }
    });

    // ********************************************************************************
    // when this user receives an ICE candidate
    newSocket.on('receive-candidate', ({ senderId, candidate, type }) => {
        if (type !== 'datachannel') {
            console.log(`Received an ICE candidate from ${senderId} for ${type}.`);
            const { peerConnection } = audioVideoPeerConnections[senderId] || {};
            // deliver the candidate to the local ICE layer
            if (peerConnection && peerConnection.localDescription) {
                peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
                    .catch(error => console.log(error));
            }
        }
    });

    // ********************************************************************************
    // when this user receives a leave message
    newSocket.on('receive-leave', ({ leaverId, type }) => {
        if (type !== 'datachannel') {
            console.log(`Received a leave message from ${leaverId} for ${type}.`);
            if (type === 'audio' || type === 'video') {
                endAudioVideoCall(leaverId, type);
            }
            closePeerConnection(leaverId, type);
        }
    });
}

export async function videoCallUser(recipientId) {
    try {
        console.log('Initiating the video call session.');
        appStore.dispatch({ type: START_VIDEO_CALL, otherUser: recipientId });

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

        createPeerConnection(recipientId, "video");

        const { peerConnection } = audioVideoPeerConnections[recipientId];
        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

        audioVideoPeerConnections[recipientId].localVideoStream = stream;
        appStore.dispatch({ type: LOCAL_VIDEO_READY });
    } catch (err) {
        console.log(err);
    }
}

export async function audioCallUser(recipientId) {
    try {
        console.log('Initiating the audio call session.');
        appStore.dispatch({ type: START_AUDIO_CALL, otherUser: recipientId });

        const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });

        createPeerConnection(recipientId, "audio");

        const { peerConnection } = audioVideoPeerConnections[recipientId];
        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

        audioVideoPeerConnections[recipientId].localAudioStream = stream;
        appStore.dispatch({ type: LOCAL_AUDIO_READY });
    } catch (err) {
        console.log(err);
    }
}

export function sendCallRequest(recipientId, callType) {
    return (dispatch) => {
        if (currentSocket) {
            currentSocket.emit('request-call', { recipientId, type: callType });
            dispatch({
                type: callType === 'audio' ? REQUEST_AUDIO_CALL : REQUEST_VIDEO_CALL,
                otherUser: recipientId
            });
        }
    }
}

export function acceptAudioVideoCall(senderId, type) {
    return (dispatch) => {
        if (currentSocket) {
            currentSocket.emit('accept-call', { senderId, type });
            dispatch({
                type: type === 'audio' ? ACCEPT_AUDIO_CALL : ACCEPT_VIDEO_CALL,
                otherUser: senderId
            });
        }
    }
}

export function rejectAudioVideoCall(senderId, type) {
    return async (dispatch) => {
        if (currentSocket) {
            await currentSocket.emit('reject-call', { senderId, type });
            dispatch({
                type: type === 'audio' ? REJECT_AUDIO_CALL : REJECT_VIDEO_CALL,
                otherUser: senderId
            });
        }
    }
}

export function endAudioVideoCall(recipientId, type) {
    const { localAudioStream, localVideoStream } = audioVideoPeerConnections[recipientId] || {};
    if (type === 'audio') {
        localAudioStream && localAudioStream.getTracks().forEach(track => track.stop());
        appStore.dispatch({ type: END_AUDIO_CALL });
    } else if (type === 'video') {
        localVideoStream && localVideoStream.getTracks().forEach(track => track.stop());
        appStore.dispatch({ type: END_VIDEO_CALL });
    }
}

export function leaveChat(recipientId, type) {
    closePeerConnection(recipientId, type);
    currentSocket && currentSocket.emit('leave-chat', { recipientId, type });
}