import { useRef, useEffect } from 'react';
import { connect } from 'react-redux';

import { endAudioVideoCall, acceptAudioVideoCall, rejectAudioVideoCall, leaveChat, audioVideoPeerConnections } from '../../store/actions';
import EndCallIcon from '../common/icons/EndCallIcon';
import IncomingCallIcon from '../common/icons/IncomingCallIcon';
import OutgoingCallIcon from '../common/icons/OutgoingCallIcon';
import VoiceCallIcon from '../common/icons/VoiceCallIcon';

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
                        <OutgoingCallIcon className="outgoing-call" />
                        <span>Calling {audioCall.otherUser}...</span>
                        <div className="end-call-button" onClick={() => {
                            endAudioVideoCall(audioCall.otherUser, 'audio');
                            leaveChat(audioCall.otherUser, 'audio');
                        }}>
                            <EndCallIcon style={{ height: 30, width: 30 }} />
                        </div>
                    </>
                ) : audioCall.incomingRequest ? (
                    <>
                        <IncomingCallIcon className="incoming-call" />
                        <span>{audioCall.otherUser} is calling you...</span>
                        <div className="accept-reject-buttons-container">
                            <div 
                                className="accept-call-button"
                                onClick={() => {
                                    acceptAudioVideoCall(audioCall.otherUser, 'audio');
                                    selectContact(audioCall.otherUser);
                                }}
                                title="Accept Call"
                            >
                                <OutgoingCallIcon style={{ height: 30, width: 30, color: 'green' }} />
                            </div>
                            <div
                                className="end-call-button"
                                onClick={() => rejectAudioVideoCall(audioCall.otherUser, 'audio')}
                                title="Reject Call"
                            >
                                <EndCallIcon style={{ height: 30, width: 30 }} />
                            </div>
                        </div>
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