import { appStore } from '../..';
import { delay } from '../../utils/utils';

import {
    ACCEPT_AUDIO_CALL, ACCEPT_VIDEO_CALL, REQUEST_VIDEO_CALL, REJECT_AUDIO_CALL,
    END_AUDIO_CALL, REJECT_VIDEO_CALL, REQUEST_AUDIO_CALL, INCOMING_AUDIO_CALL,
    END_VIDEO_CALL, START_AUDIO_CALL, START_VIDEO_CALL, INCOMING_VIDEO_CALL, LOCAL_AUDIO_READY, LOCAL_VIDEO_READY
} from "./actionTypes";
import { peerConnections } from './connections';
import { createPeerConnection } from './peerConnection';

export function processAudioVideoNegotiation(data, otherUserId) {
    switch (data.msgType) {
        case 'request-call':
            appStore.dispatch({
                type: data.callType === 'audio' ? INCOMING_AUDIO_CALL : INCOMING_VIDEO_CALL,
                otherUser: otherUserId
            });
            break;
        case 'accept-call':
            data.callType === 'audio' ? audioCallUser(otherUserId) : videoCallUser(otherUserId);
            break;
        case 'reject-call':
            appStore.dispatch({
                type: data.callType === 'audio' ? END_AUDIO_CALL : END_VIDEO_CALL,
                otherUser: otherUserId
            });
            break;
        case 'leave-chat':
            if (data.callType === 'audio' || data.callType === 'video') {
                endAudioVideoCall(otherUserId, data.callType);
            }
            break;
        case 'send-offer':
            handleOffer(data.offer, data.callType, otherUserId);
            break;
        case 'answer-offer':
            handleAnswer(data.answer, data.callType, otherUserId);
            break;
        case 'send-candidate':
            handleCandidate(data.candidate, data.callType, otherUserId);
            break;
        default:
            break;
    }
}

function handleAnswer( answer, type, answererId) {
    console.log(`Received an answer from ${answererId} to the ${type} offer made.`);
    const { peerConnection } = peerConnections[answererId] || {};
    if (peerConnection && peerConnection.localDescription) {
        peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
            .catch(error => console.log(error));
    }
}

async function handleCandidate(candidate, type, senderId) {
    console.log(`Received an ICE candidate from ${senderId} for ${type}.`);
    const { peerConnection } = peerConnections[senderId] || {};
    // deliver the candidate to the local ICE layer
    await delay(100);
    if (peerConnection && peerConnection.localDescription) {
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
            .catch(error => console.log(error));
    }
}

async function handleOffer(offer, type, offererId) {
    console.log(`A ${type} offer received from ${offererId}`);

    createPeerConnection(offererId, type);

    const { peerConnection } = peerConnections[offererId];

    appStore.dispatch({
        type: type === 'audio' ? START_AUDIO_CALL : START_VIDEO_CALL,
        otherUser: offererId
    });

    const stream = await navigator.mediaDevices.getUserMedia({
        video: type !== 'audio',
        audio: true
    });

    peerConnections[offererId][type === 'audio' ? 'localAudioStream' : 'localVideoStream'] = stream;
    appStore.dispatch({ type: type === 'audio' ? LOCAL_AUDIO_READY : LOCAL_VIDEO_READY });

    // take the SDP (session description protocol) offer and create a new 
    // RTCSessionDescription object representing the offerer's session description.
    const sessDesc = new RTCSessionDescription(offer);

    // use the session description to now establish the received offer as the 
    // description of the remote (caller/offerer's) end of the connection
    peerConnection.setRemoteDescription(sessDesc)
        .then(() => {
            const stream = peerConnections[offererId][type === 'audio' ? 'localAudioStream' : 'localVideoStream'];
            stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));
        })
        // the description of the local end of the connection is set to the answer's
        // SDP, and then send the answer to the remote through the server
        .then(() => peerConnection.createAnswer())
        .then((answer) => peerConnection.setLocalDescription(answer))
        .then(() => {
            console.log(`Sending the answer to the offer made by ${offererId}`);
            const { dataChannel } = peerConnections[offererId] || {};
            if (dataChannel && dataChannel.readyState === 'open') {
                dataChannel.send(JSON.stringify({
                    type: 'audio-video-negotiation',
                    msg: {
                        msgType: 'answer-offer',
                        answer: peerConnection.localDescription,
                        callType: type
                    }
                }));
            }
        })
        .catch((error) => console.log(error));
}

export async function videoCallUser(recipientId) {
    try {
        console.log('Initiating the video call session with ' + recipientId);
        appStore.dispatch({ type: START_VIDEO_CALL, otherUser: recipientId });

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

        createPeerConnection(recipientId, 'video');
        const { peerConnection } = peerConnections[recipientId];
        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

        peerConnections[recipientId].localVideoStream = stream;
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

        createPeerConnection(recipientId, 'audio');
        const { peerConnection } = peerConnections[recipientId];
        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

        peerConnections[recipientId].localAudioStream = stream;
        appStore.dispatch({ type: LOCAL_AUDIO_READY });
    } catch (err) {
        console.log(err);
    }
}

export function sendCallRequest(recipientId, callType) {
    return (dispatch) => {
        const { dataChannel } = peerConnections[recipientId] || {};
        if (dataChannel && dataChannel.readyState === 'open') {
            dataChannel.send(JSON.stringify({
                type: 'audio-video-negotiation',
                msg: {
                    msgType: 'request-call',
                    callType
                }
            }));
            dispatch({
                type: callType === 'audio' ? REQUEST_AUDIO_CALL : REQUEST_VIDEO_CALL,
                otherUser: recipientId
            });
        }     
    }
}

export function acceptAudioVideoCall(senderId, callType) {
    return (dispatch) => {
        const { dataChannel } = peerConnections[senderId] || {};
        if (dataChannel && dataChannel.readyState === 'open') {
            dataChannel.send(JSON.stringify({
                type: 'audio-video-negotiation',
                msg: {
                    msgType: 'accept-call',
                    callType
                }
            }));
            dispatch({
                type: callType === 'audio' ? ACCEPT_AUDIO_CALL : ACCEPT_VIDEO_CALL,
                otherUser: senderId
            });
        }
    }
}

export function rejectAudioVideoCall(senderId, callType) {
    return async (dispatch) => {
        const { dataChannel } = peerConnections[senderId] || {};
        if (dataChannel && dataChannel.readyState === 'open') {
            dataChannel.send(JSON.stringify({
                type: 'audio-video-negotiation',
                msg: {
                    msgType: 'reject-call',
                    callType
                }
            }));
            dispatch({
                type: callType === 'audio' ? REJECT_AUDIO_CALL : REJECT_VIDEO_CALL,
                otherUser: senderId
            });
        }
    }
}

export function endAudioVideoCall(recipientId, type) {
    const { localAudioStream, localVideoStream } = peerConnections[recipientId] || {};
    if (type === 'audio') {
        localAudioStream && localAudioStream.getTracks().forEach(track => track.stop());
        if (peerConnections[recipientId]) {
            peerConnections[recipientId].localAudioStream = null;
            peerConnections[recipientId].remoteAudioStream = null;
        }
        appStore.dispatch({ type: END_AUDIO_CALL });
    } else if (type === 'video') {
        localVideoStream && localVideoStream.getTracks().forEach(track => track.stop());
        if (peerConnections[recipientId]) {
            peerConnections[recipientId].localVideoStream = null;
            peerConnections[recipientId].remoteVideoStream = null;
        }
        appStore.dispatch({ type: END_VIDEO_CALL });
    }
}

export function leaveChat(recipientId, callType) {
    const { dataChannel } = peerConnections[recipientId] || {};
    if (dataChannel && dataChannel.readyState === 'open') {
        dataChannel.send(JSON.stringify({
            type: 'audio-video-negotiation',
            msg: {
                msgType: 'leave-chat',
                callType
            }
        }));
    }
}