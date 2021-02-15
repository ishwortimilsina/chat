import { useRef, useEffect } from 'react';
import { connect } from 'react-redux';

import { endAudioVideoCall, acceptAudioVideoCall, rejectAudioVideoCall, leaveChat, audioVideoPeerConnections } from '../../store/actions';
import EndCallIcon from '../common/icons/EndCallIcon';
import IncomingCallIcon from '../common/icons/IncomingCallIcon';
import OutgoingCallIcon from '../common/icons/OutgoingCallIcon';

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
                        <OutgoingCallIcon className="outgoing-call" />
                        <span>Calling {videoCall.otherUser}...</span>
                        <div className="end-call-button" onClick={() => {
                            endAudioVideoCall(videoCall.otherUser, 'video');
                            leaveChat(videoCall.otherUser, 'video');
                        }}>
                            <EndCallIcon style={{ height: 30, width: 30 }} />
                        </div>
                    </>
                ) : videoCall.incomingRequest ? (
                    <>
                        <IncomingCallIcon className="incoming-call" />
                        <span>{videoCall.otherUser} is calling you...</span>
                        <div className="accept-reject-buttons-container">
                            <div
                                className="accept-call-button"
                                onClick={() => {
                                    acceptAudioVideoCall(videoCall.otherUser, 'video');
                                    selectContact(videoCall.otherUser);
                                }}
                                title="Accept Call"
                            >
                                <OutgoingCallIcon style={{ height: 30, width: 30, color: 'green' }} />
                            </div>
                            <div
                                className="end-call-button"
                                onClick={() => rejectAudioVideoCall(videoCall.otherUser, 'video')}
                                title="Reject Call"
                            >
                                <EndCallIcon style={{ height: 30, width: 30 }} />
                            </div>
                        </div>
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