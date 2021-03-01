import { appStore } from '../..';
import { arrBuffToStr, strToArrBuff } from '../../utils/utils';

import {
    ACCEPT_AUDIO_CALL, ACCEPT_VIDEO_CALL, REQUEST_VIDEO_CALL, REJECT_AUDIO_CALL,
    END_AUDIO_CALL, REJECT_VIDEO_CALL, REQUEST_AUDIO_CALL, INCOMING_AUDIO_CALL,
    END_VIDEO_CALL, START_AUDIO_CALL, START_VIDEO_CALL, INCOMING_VIDEO_CALL,
    LOCAL_AUDIO_READY, LOCAL_VIDEO_READY, REMOTE_AUDIO_READY, REMOTE_VIDEO_READY
} from "./actionTypes";
import { peerConnections } from './connections';

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
        default:
            break;
    }
}

const remoteStreams = {};

function createRemoteStreamMediaSource(callType, otherUserId) {
    const mediaSource = new MediaSource();
    remoteStreams[otherUserId] = {
        mediaSource,
        sourceBuffer: null,
        arrayOfArrayBuffers: [],
        url: URL.createObjectURL(mediaSource),
        appendToSourceBuffer: function() {
            if (this.mediaSource.readyState === "open" && this.sourceBuffer && this.sourceBuffer.updating === false) {
                this.sourceBuffer.appendBuffer(this.arrayOfArrayBuffers.shift());
            }

            // Limit the total buffer size to 20 minutes
            // This way we don't run out of RAM
            if (
                this.video &&
                this.video.buffered.length &&
                this.video.buffered.end(0) - this.video.buffered.start(0) > 1200
            )
            {
                this.sourceBuffer.remove(0, this.video.buffered.end(0) - 1200)
            }
        },
        sourceOpen: function() {
            remoteStreams[otherUserId].sourceBuffer = remoteStreams[otherUserId].mediaSource.addSourceBuffer(
                callType === 'audio' ? "audio/webm;codecs=opus" : "video/webm;codecs=vp9,opus"
            );

            remoteStreams[otherUserId].sourceBuffer.addEventListener("updateend", this.appendToSourceBuffer);
        }
    }

    remoteStreams[otherUserId].appendToSourceBuffer();

    remoteStreams[otherUserId].mediaSource.addEventListener('sourceopen', remoteStreams[otherUserId].sourceOpen);

    peerConnections[otherUserId][callType === 'audio' ? 'remoteAudioStream' : 'remoteVideoStream'] = remoteStreams[otherUserId];

    appStore.dispatch({ type: callType === 'audio' ? REMOTE_AUDIO_READY : REMOTE_VIDEO_READY });
}

export function processAudioVideoDownloadStream(data, callType, otherUserId) {
    // array buffer cannot be transmitted as a stringified json
    // so it's sent as encoded to string which we convert back here
    const audioVideoData = data && strToArrBuff(data);

    if (audioVideoData && remoteStreams[otherUserId] && remoteStreams[otherUserId].arrayOfArrayBuffers) {
        remoteStreams[otherUserId].arrayOfArrayBuffers.push(new Uint8Array(audioVideoData));
        remoteStreams[otherUserId].appendToSourceBuffer();
    }
}

export async function videoCallUser(recipientId) {
    try {
        console.log('Initiating the video call session.');
        appStore.dispatch({ type: START_VIDEO_CALL, otherUser: recipientId });

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

        peerConnections[recipientId].localVideoStream = stream;
        appStore.dispatch({ type: LOCAL_VIDEO_READY });

        createRemoteStreamMediaSource('video', recipientId);

        const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" });
        recorder.ondataavailable = async function(e) {
            const dataArrBuff = await e.data.arrayBuffer();
            const dataStr = arrBuffToStr(dataArrBuff);
            const { dataChannel } = peerConnections[recipientId] || {};
            if (dataChannel && dataChannel.readyState === 'open' && dataArrBuff) {
                dataChannel.send(JSON.stringify({
                    type: "audio-video-data",
                    callType: 'video',
                    // array buffer cannot be transmitted as a stringified json
                    // so encode it as a string and transmit
                    audioVideoData: dataStr
                }));
            }
        };
        recorder.start(30);
        recorder.onerror = function(e) {
            recorder.stop();
        }
    } catch (err) {
        console.log(err);
    }
}

export async function audioCallUser(recipientId) {
    try {
        console.log('Initiating the audio call session.');
        appStore.dispatch({ type: START_AUDIO_CALL, otherUser: recipientId });

        const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });

        peerConnections[recipientId].localAudioStream = stream;
        appStore.dispatch({ type: LOCAL_AUDIO_READY });

        createRemoteStreamMediaSource('audio', recipientId);

        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = async function(e) {
            const dataArrBuff = await e.data.arrayBuffer();
            const dataStr = arrBuffToStr(dataArrBuff);
            const { dataChannel } = peerConnections[recipientId] || {};
            if (dataChannel && dataChannel.readyState === 'open') {
                dataChannel.send(JSON.stringify({
                    type: "audio-video-data",
                    callType: 'audio',
                    // array buffer cannot be transmitted as a stringified json
                    // so encode it as a string and transmit
                    audioVideoData: dataStr
                }));
            }
        };
        recorder.start(30);
        recorder.onerror = function(e) {
            recorder.stop();
        }
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

            callType === 'audio' ? audioCallUser(senderId) : videoCallUser(senderId);
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
        peerConnections[recipientId].localAudioStream = null;
        peerConnections[recipientId].remoteAudioStream = null;
        appStore.dispatch({ type: END_AUDIO_CALL });
    } else if (type === 'video') {
        localVideoStream && localVideoStream.getTracks().forEach(track => track.stop());
        peerConnections[recipientId].localVideoStream = null;
        peerConnections[recipientId].remoteVideoStream = null;
        appStore.dispatch({ type: END_VIDEO_CALL });
    }
    URL.revokeObjectURL(remoteStreams[recipientId].url);
    delete remoteStreams[recipientId];
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