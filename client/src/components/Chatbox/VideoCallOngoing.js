import { useRef, useEffect } from 'react';

import { leaveChat, peerConnections } from '../../store/actions';
import EndCallIcon from '../common/icons/EndCallIcon';

export default function VideoCallOngoing({ videoCall, endAudioVideoCall }) {
    const localVideoRef = useRef();
    const remoteVideoRef = useRef();

    useEffect(() => {
        if (videoCall.remoteVideoReady && peerConnections[videoCall.otherUser].remoteVideoStream) {
            remoteVideoRef.current.src = peerConnections[videoCall.otherUser].remoteVideoStream.url;
            peerConnections[videoCall.otherUser].remoteVideoStream.videoElem = remoteVideoRef.current;
        }
    }, [videoCall.remoteVideoReady, videoCall.otherUser]);

    useEffect(() => {
        if (videoCall.localVideoReady) {
            localVideoRef.current.srcObject = peerConnections[videoCall.otherUser].localVideoStream;
        }
    }, [videoCall.localVideoReady, videoCall.otherUser]);

    return (
        <div className="actual-videos-container">
            <div className="remote-video-container">
                <video className="remote-video" ref={remoteVideoRef} autoPlay></video> 
            </div>
            <div className="local-video-container"> 
                <video className="local-video" ref={localVideoRef} autoPlay muted></video> 
            </div>
            <div
                className="end-call-button video-call-end-call-button"
                onClick={() => {
                    endAudioVideoCall(videoCall.otherUser, 'video');
                    leaveChat(videoCall.otherUser, 'video');
                }}
                title="End Call"
            >
                <EndCallIcon style={{ height: 30, width: 30 }} />
            </div>
        </div>
    );
}