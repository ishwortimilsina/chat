import { useRef, useEffect } from 'react';
import { connect } from 'react-redux';

import { endAudioVideoCall, acceptAudioVideoCall, rejectAudioVideoCall, leaveChat, audioVideoPeerConnections } from '../../store/actions';

function VideoCallContainer({ videoCall, acceptAudioVideoCall, rejectAudioVideoCall, selectContact }) {
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
        <div className="videos-container">
            {
                videoCall.callRequested ? (
                    <>
                        <span>Calling {videoCall.otherUser}...</span>
                        <div className="call-buttons" onClick={() => {
                            endAudioVideoCall(videoCall.otherUser, 'video');
                            leaveChat(videoCall.otherUser, 'video');
                        }}>End Call</div>
                    </>
                ) : videoCall.incomingRequest ? (
                    <>
                        <span>{videoCall.otherUser} is calling you...</span>
                        <div className="call-buttons" onClick={() => {
                            acceptAudioVideoCall(videoCall.otherUser, 'video');
                            selectContact(videoCall.otherUser);
                        }}>Accept Call</div>
                        <div className="call-buttons" onClick={() => rejectAudioVideoCall(videoCall.otherUser, 'video')}>Reject Call</div>
                    </>
                ) : videoCall.acceptedRequest ? (
                    <>
                        <span>Connecting...</span>
                    </>
                ) : (
                    <>
                        <div className="remote-video-container">
                            <video className="remote-video" ref={remoteVideoRef} autoPlay></video> 
                        </div>
                        <div className="local-video-container"> 
                            <video className="local-video" ref={localVideoRef} autoPlay muted></video> 
                        </div>
                        <div className="call-buttons end-button" onClick={() => {
                            endAudioVideoCall(videoCall.otherUser, 'video');
                            leaveChat(videoCall.otherUser, 'video');
                        }}>End Call</div>
                    </>
                )
            }
        </div>
    );
}

export default connect(null, { acceptAudioVideoCall, rejectAudioVideoCall })(VideoCallContainer);