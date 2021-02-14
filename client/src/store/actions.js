import io from 'socket.io-client';

import { appStore } from '../';

export const SET_CONTACTS = 'contacts:set';
export const ADD_CONTACT = 'contact:add';
export const REMOVE_CONTACT = 'contact:remove';

export const SEND_MESSAGE = 'message:send';
export const RECEIVE_MESSAGE = 'message:receive';

export const REQUEST_AUDIO_CALL = 'audio:request-call';
export const INCOMING_AUDIO_CALL = 'audio:call-incoming';
export const ACCEPT_AUDIO_CALL = 'audio:accept-call';
export const REJECT_AUDIO_CALL = 'audio:reject-call';
export const START_AUDIO_CALL = 'audio:start-call';
export const END_AUDIO_CALL = 'audio:end-call';
export const LOCAL_AUDIO_READY = 'audio:local-stream-ready';
export const REMOTE_AUDIO_READY = 'audio:remote-stream-ready';

export const REQUEST_VIDEO_CALL = 'video:request-call';
export const INCOMING_VIDEO_CALL = 'video:call-incoming';
export const ACCEPT_VIDEO_CALL = 'video:accept-call';
export const REJECT_VIDEO_CALL = 'video:reject-call';
export const START_VIDEO_CALL = 'video:start-call';
export const END_VIDEO_CALL = 'video:end-call';
export const LOCAL_VIDEO_READY = 'video:local-stream-ready';
export const REMOTE_VIDEO_READY = 'video:remote-stream-ready';

let newSocket = null;
let dataChannelPeerConnections = {};
export let audioVideoPeerConnections = {};

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

            newSocket.on('new-contact', data => {
                setupDataConnection(data.contact.userId);
                dispatch({
                    type: ADD_CONTACT,
                    contact: data.contact
                });
            });

            newSocket.on('remove-contact', data => {
                dispatch({
                    type: REMOVE_CONTACT,
                    contact: data.contact
                });
                closePeerConnection(data.contact.userId);
            });

            newSocket.on('receive-call-request', data => {
                dispatch({
                    type: data.type === 'audio' ? INCOMING_AUDIO_CALL : INCOMING_VIDEO_CALL,
                    otherUser: data.senderId
                });
            });

            newSocket.on('receive-call-accept', data => {
                console.log(`${data.accepterId} has accepted the call request.`);
                data.type === 'audio' ? audioCallUser(data.accepterId) : videoCallUser(data.accepterId);
            });

            newSocket.on('receive-call-reject', data => {
                dispatch({
                    type: data.type === 'audio' ? END_AUDIO_CALL : END_VIDEO_CALL,
                    otherUser: data.rejecterId
                });
            });

            // ********************************************************************************
            // When this user recieves an offer, create an answer and reply to the offerer
            newSocket.on('receive-offer', async ({ offererId, offer, type }) => {
                console.log(`A ${type} offer received from ${offererId}`);

                createPeerConnection(offererId, type);
                const { peerConnection } = type === "datachannel"
                    ? dataChannelPeerConnections[offererId]
                    : audioVideoPeerConnections[offererId];

                if (type !== 'datachannel') {
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
                } else {
                    peerConnection.ondatachannel = function handleOnDataChannel(event) {
                        dataChannelPeerConnections[offererId].dataChannel = event.channel;
                        dataChannelPeerConnections[offererId].dataChannel.onmessage = (msg) => {
                            appStore.dispatch({
                                type: RECEIVE_MESSAGE,
                                sender: offererId,
                                time: Date.now(),
                                text: msg.data
                            });
                        }
                    }
                }

                // take the SDP (session description protocol) offer and create a new 
                // RTCSessionDescription object representing the offerer's session description.
                const sessDesc = new RTCSessionDescription(offer);

                // use the session description to now establish the received offer as the 
                // description of the remote (caller/offerer's) end of the connection
                peerConnection.setRemoteDescription(sessDesc)
                    .then(() => {
                        if (type !== 'datachannel') {
                            const stream = audioVideoPeerConnections[offererId][type === 'audio' ? 'localAudioStream' : 'localVideoStream'];
                            stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));
                        }
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
            });

            // ********************************************************************************
            // when this user receives an answer to the offer made
            newSocket.on('receive-answer', ({ answererId, answer, type }) => {
                console.log(`Received an answer from ${answererId} to the ${type} offer made.`);
                const { peerConnection } = (
                    type === "datachannel"
                        ? dataChannelPeerConnections[answererId]
                        : audioVideoPeerConnections[answererId]
                ) || {};
                if (peerConnection && peerConnection.localDescription) {
                    peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
                        .catch(error => console.log(error));
                }
            });

            // ********************************************************************************
            // when this user receives an ICE candidate
            newSocket.on('receive-candidate', ({ senderId, candidate, type }) => {
                console.log(`Received an ICE candidate from ${senderId} for ${type}.`);
                const { peerConnection } = (
                    type === "datachannel"
                        ? dataChannelPeerConnections[senderId]
                        : audioVideoPeerConnections[senderId]
                ) || {};
                // deliver the candidate to the local ICE layer
                if (peerConnection && peerConnection.localDescription) {
                    peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
                        .catch(error => console.log(error));
                }
            });

            // ********************************************************************************
            // when this user receives a leave message
            newSocket.on('receive-leave', ({ leaverId, type }) => {
                console.log(`Received a leave message from ${leaverId} for ${type}.`);
                if (type === 'audio' || type === 'video') {
                    endAudioVideoCall(leaverId, type);
                }
                closePeerConnection(leaverId, type);
            });

        } catch (ex) {
            console.log(ex);
        }
    };
}

export function sendMessage({ recipient, text, sender }) {
    return async (dispatch) => {
        try {
            const { dataChannel } = dataChannelPeerConnections[recipient] || {};
            if (dataChannel && dataChannel.readyState === 'open') {
                dataChannel.send(text);
                dispatch({
                    type: SEND_MESSAGE,
                    recipient,
                    text,
                    sender,
                    time: Date.now()
                });
            }
        } catch (ex) {
            console.log(ex);
        }
    }
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

function closePeerConnection(userId, type) {
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

function createPeerConnection(recipientId, type) {
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
            newSocket.emit('send-candidate', { recipientId, candidate: event.candidate, type });
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

function setupDataConnection(recipientId) {
    createPeerConnection(recipientId, "datachannel");

    // create a dataChannel and handle the channel events
    const { peerConnection } = dataChannelPeerConnections[recipientId];
    const dataChannel = peerConnection.createDataChannel('text-channel', { reliable: true });
    dataChannelPeerConnections[recipientId].dataChannel = dataChannel;

    dataChannel.onopen = (event) => console.log('Data channel is ready.');
    dataChannel.onerror = (error) => console.log(error);
    dataChannel.onmessage = (msg) => {
        appStore.dispatch({
            type: RECEIVE_MESSAGE,
            sender: recipientId,
            time: Date.now(),
            text: msg.data
        });
    }
    dataChannel.onclose = (event) => console.log('Data channel is closed');
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

export function sendCallRequest(recipientId, callType) {
    return (dispatch) => {
        if (newSocket) {
            newSocket.emit('request-call', { recipientId, type: callType });
            dispatch({
                type: callType === 'audio' ? REQUEST_AUDIO_CALL : REQUEST_VIDEO_CALL,
                otherUser: recipientId
            });
        }
    }
}

export function acceptAudioVideoCall(senderId, type) {
    return (dispatch) => {
        if (newSocket) {
            newSocket.emit('accept-call', { senderId, type });
            dispatch({
                type: type === 'audio' ? ACCEPT_AUDIO_CALL : ACCEPT_VIDEO_CALL,
                otherUser: senderId
            });
        }
    }
}

export function rejectAudioVideoCall(senderId, type) {
    return async (dispatch) => {
        if (newSocket) {
            await newSocket.emit('reject-call', { senderId, type });
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
    newSocket && newSocket.emit('leave-chat', { recipientId, type });
}