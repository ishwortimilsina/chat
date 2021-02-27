import { appStore } from '../..';
import {
    ACCEPT_SHARE_FILE_REQUEST, END_SHARE_FILE, INCOMING_SHARE_FILE_REQUEST,
    OPEN_FILE_SHARE_WIDGET,
    REJECT_SHARE_FILE_REQUEST, REQUEST_SHARE_FILE,
    SHARE_FILE_METADATA,
    SHARE_FILE_RECEIVE_DATA, SHARE_FILE_SEND_DATA, START_SHARE_FILE
} from './actionTypes';

import * as streamSaver from 'streamsaver';
import { dataChannelPeerConnections } from './connections';

const BYTES_PER_CHUNK = 16000;
let fileReader = {}, downloadStream = {}, downloadWriter = {};
const fileShareEvents = {
    onrequestaccept: {},
    onrequestreject: {}
};

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

function clearUserFileShareEvents(otherUserId, abortOrClose) {
    fileShareEvents.onrequestaccept[otherUserId] = undefined;
    fileShareEvents.onrequestreject[otherUserId] = undefined;

    if (fileReader[otherUserId]) {
        abortOrClose === "close" ? fileReader[otherUserId].close() : fileReader[otherUserId].abort();
        fileReader[otherUserId] = undefined;
    }
    if (downloadWriter[otherUserId]) {
        abortOrClose === "close" ? downloadWriter[otherUserId].close() : downloadWriter[otherUserId].abort();
        downloadWriter[otherUserId] = undefined;
        downloadStream[otherUserId] = undefined;
    }
}

export function createDownloadStream(fileName, otherUserId) {
    downloadStream[otherUserId] = streamSaver.createWriteStream(fileName);
    downloadWriter[otherUserId] = downloadStream[otherUserId].getWriter();
}

export function processDownloadStream(data, otherUserId) {
    // array buffer cannot be transmitted as a stringified json
    // so it's sent as encoded to string which we convert back here
    const fileData = strToArrBuff(data);

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

    if (downloadStream[otherUserId] && downloadWriter[otherUserId]) {
        downloadWriter[otherUserId].write(new Uint8Array(fileData))
        if (bytesReceived === shareFileMetadata.fileSize) {
            clearUserFileShareEvents(otherUserId, "close");
        }
    }
}

async function sendFile(recipientId, file) {
    let currentChunk = 0;
    fileReader[recipientId] = new FileReader();
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
        appStore.dispatch({
            type: SHARE_FILE_METADATA,
            otherUser: recipientId,
            fileName: fileName,
            fileSize: fileSize
        });

        function readNextChunk() {
            const start = BYTES_PER_CHUNK * currentChunk;
            const end = Math.min(fileSize, start + BYTES_PER_CHUNK);
            fileReader[recipientId].readAsArrayBuffer(file.slice(start, end));
        }
    
        fileReader[recipientId].onload = async function handleFileRead() {
            dataChannel.send(JSON.stringify({
                type: "file-data",
                // array buffer cannot be transmitted as a stringified json
                // so encode it as a string and transmit
                fileData: arrBuffToStr(fileReader[recipientId].result)
            }));

            // ******update the store so that the sender can update the UI accordingly
            bytesSent += fileReader[recipientId].result.byteLength;
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

export function processFileShareNegotiation(data) {
    switch (data.type) {
        case 'request-share-file':
            appStore.dispatch({
                type: INCOMING_SHARE_FILE_REQUEST,
                otherUser: data.senderId
            });
            break;
        case 'accept-share-file-request':
            appStore.dispatch({
                type: START_SHARE_FILE,
                otherUser: data.accepterId
            });
            if (fileShareEvents.onrequestaccept[data.accepterId]) {
                fileShareEvents.onrequestaccept[data.accepterId]();
            }
            break;
        case 'reject-share-file-request':
            appStore.dispatch({
                type: END_SHARE_FILE,
                otherUser: data.rejecterId
            });
            if (fileShareEvents.onrequestreject[data.accepterId]) {
                fileShareEvents.onrequestreject[data.accepterId]();
            }
            break;
        case 'leave-file-sharing':
            endFileSharing(data.leaverId);
            break;
        default:
            break;
    }
}

export function openFileSharingWidget(recipientId) {
    return (dispatch) => {
        dispatch({
            type: OPEN_FILE_SHARE_WIDGET,
            otherUser: recipientId
        });
    }
}

export function requestShareFile(recipientId, senderId, file) {
    return (dispatch) => {
        const { dataChannel } = dataChannelPeerConnections[recipientId] || {};
        if (dataChannel && dataChannel.readyState === 'open') {
            dataChannel.send(JSON.stringify({
                type: 'file-share-negotiation',
                msg: {
                    type: 'request-share-file',
                    senderId
                }
            }));
            dispatch({
                type: REQUEST_SHARE_FILE,
                otherUser: recipientId
            });

            fileShareEvents.onrequestaccept[recipientId] = function handleRequestAccept() {
                sendFile(recipientId, file);
            }
        }
    }
}

export function acceptShareFile(recipientId, accepterId) {
    return (dispatch) => {
        const { dataChannel } = dataChannelPeerConnections[recipientId] || {};
        if (dataChannel && dataChannel.readyState === 'open') {
            dataChannel.send(JSON.stringify({
                type: 'file-share-negotiation',
                msg: {
                    type: 'accept-share-file-request',
                    accepterId
                }
            }));
            dispatch({
                type: ACCEPT_SHARE_FILE_REQUEST,
                otherUser: recipientId
            });
        }
    }
}

export function rejectShareFile(recipientId, rejecterId) {
    return async (dispatch) => {
        const { dataChannel } = dataChannelPeerConnections[recipientId] || {};
        if (dataChannel && dataChannel.readyState === 'open') {
            dataChannel.send(JSON.stringify({
                type: 'file-share-negotiation',
                msg: {
                    type: 'reject-share-file-request',
                    rejecterId
                }
            }));
            dispatch({
                type: REJECT_SHARE_FILE_REQUEST,
                otherUser: recipientId
            });
        }
    }
}

export function endFileSharing(otherUserId) {
    appStore.dispatch({ type: END_SHARE_FILE });
    clearUserFileShareEvents(otherUserId, 'abort');
}

export function leaveFileSharing(recipientId, leaverId) {
    const { dataChannel } = dataChannelPeerConnections[recipientId] || {};
    if (dataChannel && dataChannel.readyState === 'open') {
        dataChannel.send(JSON.stringify({
            type: 'file-share-negotiation',
            msg: {
                type: 'leave-file-sharing',
                leaverId
            }
        }));
    }
}