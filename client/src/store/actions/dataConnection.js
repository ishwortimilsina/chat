import { appStore } from '../..';
import { createPeerConnection } from './peerConnection';
import { peerConnections } from './connections';
import { RECEIVE_MESSAGE, SEND_MESSAGE, SHARE_FILE_METADATA } from './actionTypes';
import { createDownloadStream, processDownloadStream, processFileShareNegotiation } from './shareFile';
import { processAudioVideoNegotiation } from './audioVideoCall';

export function sendMessage({ recipient, text, sender, roomId }) {
    return async (dispatch) => {
        try {
            const { dataChannel } = peerConnections[recipient] || {};
            if (dataChannel && dataChannel.readyState === 'open') {
                dataChannel.send(JSON.stringify({ type: "text-message", body: { text, roomId } }));
                dispatch({
                    type: SEND_MESSAGE,
                    roomId,
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

function handleChannelMessage(msg, sender) {
    try {
        const data = JSON.parse(msg.data);

        if (data.type === "text-message") {
            appStore.dispatch({
                type: RECEIVE_MESSAGE,
                sender,
                roomId: data.body.roomId,
                time: Date.now(),
                text: data.body.text
            });
        } else if (data.type === "file-metadata") {
            appStore.dispatch({
                type: SHARE_FILE_METADATA,
                otherUser: sender,
                fileName: data.fileName,
                fileSize: data.fileSize,
                downloadStartTime: Date.now()
            });

            createDownloadStream(data.fileName, sender);
        } else if (data.type === "file-data" && data.fileData) {
            processDownloadStream(data.fileData, sender);
        } else if (data.type === 'file-share-negotiation') {
            processFileShareNegotiation(data.msg, sender);
        } else if (data.type === "audio-video-negotiation") {
            processAudioVideoNegotiation(data.msg, sender);
        }
    } catch (err) {
        console.log(err);
    }
}

function setupDataConnection(recipientId) {
    createPeerConnection(recipientId, "datachannel");

    // create a dataChannel and handle the channel events
    const { peerConnection } = peerConnections[recipientId];
    const dataChannel = peerConnection.createDataChannel('text-channel', { reliable: true });
    peerConnections[recipientId].dataChannel = dataChannel;

    dataChannel.onerror = (error) => console.log(error);
    dataChannel.onmessage = (msg) => handleChannelMessage(msg, recipientId);
}

export function initializeSocketForDataConnection(newSocket) {
    newSocket.on('new-contact', data => {
        setupDataConnection(data.contact.userId);
    });

    // ********************************************************************************
    // When this user recieves an offer, create an answer and reply to the offerer
    newSocket.on('receive-offer', async ({ offererId, offer, type }) => {
        if (type === 'datachannel') {
            createPeerConnection(offererId, type);
            const { peerConnection } = peerConnections[offererId];
            peerConnection.ondatachannel = function handleOnDataChannel(event) {
                peerConnections[offererId].dataChannel = event.channel;
                peerConnections[offererId].dataChannel.onmessage = (msg) => handleChannelMessage(msg, offererId);
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
        if (type === 'datachannel') {
            const { peerConnection } = peerConnections[answererId] || {};
            if (peerConnection && peerConnection.localDescription) {
                peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
                    .catch(error => console.log(error));
            }
        }
    });

    // ********************************************************************************
    // when this user receives an ICE candidate
    newSocket.on('receive-candidate', ({ senderId, candidate, type }) => {
        if (type === 'datachannel') {
            const { peerConnection } = peerConnections[senderId] || {};
            // deliver the candidate to the local ICE layer
            if (peerConnection && peerConnection.localDescription) {
                peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
                    .catch(error => console.log(error));
            }
        }
    });
}