import { useRef, useEffect } from 'react';

import { leaveChat, audioVideoPeerConnections } from '../../store/actions';
import EndCallIcon from '../common/icons/EndCallIcon';

export default function VideoCallOngoing({ videoCall, endAudioVideoCall }) {
    const localVideoRef = useRef();
    const remoteVideoRef = useRef();

    useEffect(() => {
        if (videoCall.ongoing && videoCall.otherUser && audioVideoPeerConnections[videoCall.otherUser]) {
            const { localVideoStream, remoteVideoStream } = audioVideoPeerConnections[videoCall.otherUser];
            localVideoRef.current.srcObject = localVideoStream;
            remoteVideoRef.current.srcObject = remoteVideoStream;
        }
    }, [videoCall]);

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