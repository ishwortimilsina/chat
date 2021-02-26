import io from 'socket.io-client';
import * as streamSaver from 'streamsaver';

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

export const REQUEST_SHARE_FILE = 'share-file:request';
export const INCOMING_SHARE_FILE_REQUEST = 'share-file:incoming';
export const ACCEPT_SHARE_FILE_REQUEST = 'share-file:accept';
export const REJECT_SHARE_FILE_REQUEST = 'share-file:reject';
export const START_SHARE_FILE = 'share-file:start';
export const END_SHARE_FILE = 'share-file:end';
export const SHARE_FILE_METADATA = 'share-file:metadata';
export const SHARE_FILE_RECEIVE_DATA = 'share-file:receive-data';
export const SHARE_FILE_SEND_DATA = 'share-file:send-data'

/**
 * 
 * @param {number} duration // in milliseconds 
 */
function delay(duration) {
    return new Promise((resolve) => {
        setTimeout(() => resolve(), duration);
    });
};

let newSocket = null;
let dataChannelPeerConnections = {};
export let audioVideoPeerConnections = {};

export function establishConnection(id, name) {
    return async (dispatch, store) => {
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
                data.type === 'audio' ? audioCallUser(data.accepterId) : videoCallUser(data.accepterId);
            });

            newSocket.on('receive-call-reject', data => {
                dispatch({
                    type: data.type === 'audio' ? END_AUDIO_CALL : END_VIDEO_CALL,
                    otherUser: data.rejecterId
                });
            });

            newSocket.on('receive-share-file-request', data => {
                dispatch({
                    type: INCOMING_SHARE_FILE_REQUEST,
                    otherUser: data.senderId
                });
            });

            newSocket.on('receive-share-file-accept', data => {
                startFileSharing(data.accepterId);
            });

            newSocket.on('receive-share-file-reject', data => {
                dispatch({
                    type: END_SHARE_FILE,
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
                        dataChannelPeerConnections[offererId].dataChannel.onmessage = (msg) => handleChannelMessage(msg, offererId);
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

            newSocket.on('receive-share-file-leave', ({ leaverId }) => {
                console.log(`Received a file-sharing leave message from ${leaverId}.`);
                endFileSharing(leaverId);
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
                dataChannel.send(JSON.stringify({ type: "text-message", text }));
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

/**
 * Converts an array buffer to string 
 * @param {ArrayBuffer} buff 
 */
function arrBuffToStr(buff) {
    return String.fromCharCode.apply(null, new Uint8Array(buff));
}

/**
 * Converts an string to an array buffer
 * @param {string} str 
 */
function strToArrBuff(str) {
    const buff = new ArrayBuffer(str.length);
    const buffView = new Uint8Array(buff);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
        buffView[i] = str.charCodeAt(i);
    }
    return buff;
}

let downloadStream, downloadWriter;
function handleChannelMessage(msg, sender) {
    try {
        const data = JSON.parse(msg.data);

        if (data.type === "text-message") {
            appStore.dispatch({
                type: RECEIVE_MESSAGE,
                sender,
                time: Date.now(),
                text: data.text
            });
        } else if (data.type === "file-metadata") {
            appStore.dispatch({
                type: SHARE_FILE_METADATA,
                otherUser: sender,
                fileName: data.fileName,
                fileSize: data.fileSize,
                downloadStartTime: Date.now()
            });

            downloadStream = streamSaver.createWriteStream(data.fileName);
            downloadWriter = downloadStream.getWriter();
        } else if (data.type === "file-data" && data.fileData) {
            // array buffer cannot be transmitted as a stringified json
            // so it's sent as encoded to string which we convert back here
            const fileData = strToArrBuff(data.fileData);

            const shareFileState = appStore.getState().shareFile;

            let { bytesReceived, downloadProgress, downloadStartTime, shareFileMetadata } = shareFileState;
            bytesReceived += fileData.byteLength;
            downloadProgress = (bytesReceived * 100 / shareFileMetadata.fileSize).toFixed(2);

            // ******update the store so that the receiver can update the UI accordingly
            appStore.dispatch({
                type: SHARE_FILE_RECEIVE_DATA,
                bytesReceived,
                downloadProgress,
                downloadSpeed: (bytesReceived * 1000 / ((Date.now() - downloadStartTime) * 1024 * 1024)).toFixed(2)
            });

            if (downloadStream && downloadWriter) {
                downloadWriter.write(new Uint8Array(fileData))
                if (bytesReceived === shareFileMetadata.fileSize) {
                    downloadWriter.close();
                    downloadStream = undefined;
                    downloadWriter = undefined;
                }
            }
        }
    } catch (err) {
        console.log(err);
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
    dataChannel.onmessage = (msg) => handleChannelMessage(msg, recipientId)
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

export function openFileSharingWidget(recipientId) {
    return (dispatch) => {
        if (newSocket) {
            newSocket.emit('request-share-file', { recipientId });
            dispatch({
                type: REQUEST_SHARE_FILE,
                otherUser: recipientId
            });
        }
    }
}

export function acceptShareFile(senderId) {
    return (dispatch) => {
        if (newSocket) {
            newSocket.emit('accept-share-file-request', { senderId });
            dispatch({
                type: ACCEPT_SHARE_FILE_REQUEST,
                otherUser: senderId
            });
        }
    }
}

export function rejectShareFile(senderId) {
    return async (dispatch) => {
        if (newSocket) {
            await newSocket.emit('reject-share-file-request', { senderId });
            dispatch({
                type: REJECT_SHARE_FILE_REQUEST,
                otherUser: senderId
            });
        }
    }
}

const BYTES_PER_CHUNK = 16000;
let fileReader;
export async function sendFile(recipientId, file) {
    let currentChunk = 0;
    fileReader = new FileReader();
    const fileSize = file.size;
    const fileName = file.name;
    let bytesSent = 0, uploadProgress = 0, uploadStartTime = Date.now();

    const { dataChannel } = dataChannelPeerConnections[recipientId] || {};
    if (dataChannel && dataChannel.readyState === 'open') {
        dataChannel.send(JSON.stringify({
            type: "file-metadata",
            fileName,
            fileSize
        }));

        function readNextChunk() {
            const start = BYTES_PER_CHUNK * currentChunk;
            const end = Math.min(fileSize, start + BYTES_PER_CHUNK);
            fileReader.readAsArrayBuffer(file.slice(start, end));
        }
    
        fileReader.onload = async function() {
            // we are reading the file as array buffer, it cannot be directly sent as stringified json
            // need to be decoded/encoded. This is not reliable for all kinds of files
            // so we will directly send the array buffer chunks
            dataChannel.send(JSON.stringify({
                type: "file-data",
                // array buffer cannot be transmitted as a stringified json
                // so encode it as a string and transmit
                fileData: arrBuffToStr(fileReader.result)
            }));

            // ******update the store so that the sender can update the UI accordingly
            bytesSent += fileReader.result.byteLength;
            uploadProgress = (bytesSent * 100 / fileSize).toFixed(2);
            appStore.dispatch({
                type: SHARE_FILE_SEND_DATA,
                bytesSent,
                uploadProgress,
                uploadSpeed: (bytesSent * 1000 / ((Date.now() - uploadStartTime) * 1024 * 1024)).toFixed(2)
            });
            // ********

            currentChunk++;
        
            if( BYTES_PER_CHUNK * currentChunk < fileSize ) {
                readNextChunk();
            }
        };

        readNextChunk();
    }
}

function startFileSharing(recipientId) {
    appStore.dispatch({ type: START_SHARE_FILE, otherUser: recipientId });
}

export function endFileSharing(recipientId) {
    appStore.dispatch({ type: END_SHARE_FILE });
    if (fileReader) {
        fileReader.abort();
        fileReader = undefined;
    }
    if (downloadWriter) {
        downloadWriter.abort();
        downloadWriter = undefined;
        downloadStream = undefined;
    }
}

export function leaveFileSharing(recipientId) {
    newSocket && newSocket.emit('leave-file-sharing', { recipientId });
}