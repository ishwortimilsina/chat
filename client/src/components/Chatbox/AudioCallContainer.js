import { useRef, useEffect } from 'react';
import { connect } from 'react-redux';

import { endAudioVideoCall, acceptAudioVideoCall, rejectAudioVideoCall, leaveChat, audioVideoPeerConnections } from '../../store/actions';

function AudioCallContainer({ audioCall, acceptAudioVideoCall, rejectAudioVideoCall, selectContact }) {
    const localAudioRef = useRef();
    const remoteAudioRef = useRef();

    useEffect(() => {
        if (audioCall.ongoing && audioCall.otherUser && audioVideoPeerConnections[audioCall.otherUser]) {
            const { localAudioStream, remoteAudioStream } = audioVideoPeerConnections[audioCall.otherUser];
            localAudioRef.current.srcObject = localAudioStream;
            remoteAudioRef.current.srcObject = remoteAudioStream;
        }
    }, [audioCall]);

    return (
        <div className="audios-container">
            {
                audioCall.callRequested ? (
                    <>
                        <span>Calling {audioCall.otherUser}...</span>
                        <div className="call-buttons" onClick={() => {
                            endAudioVideoCall(audioCall.otherUser, 'audio');
                            leaveChat(audioCall.otherUser, 'audio');
                        }}>End Call</div>
                    </>
                ) : audioCall.incomingRequest ? (
                    <>
                        <span>{audioCall.otherUser} is calling you...</span>
                        <div className="call-buttons" onClick={() => {
                            acceptAudioVideoCall(audioCall.otherUser, 'audio');
                            selectContact(audioCall.otherUser);
                        }}>Accept Call</div>
                        <div className="call-buttons" onClick={() => rejectAudioVideoCall(audioCall.otherUser, 'audio')}>Reject Call</div>
                    </>
                ) : audioCall.acceptedRequest ? (
                    <>
                        <span>Connecting...</span>
                    </>
                ) : (
                    <>
                        <div className="local-audio-container"> 
                            <span>Local audio</span>
                            <audio ref={localAudioRef}></audio> 
                        </div>
                        <div className="remote-audio-container">
                            <span>Remote audio</span>
                            <audio ref={remoteAudioRef} autoPlay></audio> 
                        </div>
                        <div className="call-buttons" onClick={() => {
                            endAudioVideoCall(audioCall.otherUser, 'audio');
                            leaveChat(audioCall.otherUser, 'audio');
                        }}>End Call</div>
                    </>
                )
            }
        </div>
    );
}

export default connect(null, { acceptAudioVideoCall, rejectAudioVideoCall })(AudioCallContainer);