import { connect } from 'react-redux';

import { endAudioVideoCall, acceptAudioVideoCall, rejectAudioVideoCall, leaveChat } from '../../store/actions';
import EndCallIcon from '../common/icons/EndCallIcon';
import IncomingCallIcon from '../common/icons/IncomingCallIcon';
import OutgoingCallIcon from '../common/icons/OutgoingCallIcon';
import AudioCalOnGoing from './AudiCallOnGoing';
import CallNotifier from './CallNotifier';

function AudioCallContainer({ audioCall, acceptAudioVideoCall, rejectAudioVideoCall, selectContact }) {
    return (
        <div className="audios-container">
            {
                audioCall.callRequested ? (
                    <CallNotifier>
                        <OutgoingCallIcon className="outgoing-call" />
                        <span style={{fontWeight: "bold"}}>{audioCall.otherUser}</span>
                        <div className="end-call-button" onClick={() => {
                            endAudioVideoCall(audioCall.otherUser, 'audio');
                            leaveChat(audioCall.otherUser, 'audio');
                        }}>
                            <EndCallIcon style={{ height: 30, width: 30 }} />
                        </div>
                    </CallNotifier>
                ) : audioCall.incomingRequest ? (
                    <CallNotifier>
                        <IncomingCallIcon className="incoming-call" />
                        <span style={{fontWeight: "bold"}}>{audioCall.otherUser}</span>
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
                    </CallNotifier>
                ) : audioCall.acceptedRequest 
                    ? <span>Connecting...</span>
                    : <AudioCalOnGoing endAudioVideoCall={endAudioVideoCall} audioCall={audioCall} />
            }
        </div>
    );
}

export default connect(null, { acceptAudioVideoCall, rejectAudioVideoCall })(AudioCallContainer);