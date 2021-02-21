import { connect } from 'react-redux';

import { endAudioVideoCall, acceptAudioVideoCall, rejectAudioVideoCall, leaveChat } from '../../store/actions';
import EndCallIcon from '../common/icons/EndCallIcon';
import IncomingCallIcon from '../common/icons/IncomingCallIcon';
import OutgoingCallIcon from '../common/icons/OutgoingCallIcon';
import CallNotifier from './CallNotifier';
import VideoCallOngoing from './VideoCallOngoing';

function VideoCallContainer({ videoCall, acceptAudioVideoCall, rejectAudioVideoCall, selectContact }) {
    return (
        <div className="videos-container">
            {
                videoCall.callRequested ? (
                    <CallNotifier>
                        <OutgoingCallIcon className="outgoing-call" />
                        <span style={{fontWeight: "bold"}}>{videoCall.otherUser}</span>
                        <div className="end-call-button" onClick={() => {
                            endAudioVideoCall(videoCall.otherUser, 'video');
                            leaveChat(videoCall.otherUser, 'video');
                        }}>
                            <EndCallIcon style={{ height: 30, width: 30 }} />
                        </div>
                    </CallNotifier>
                ) : videoCall.incomingRequest ? (
                    <CallNotifier>
                        <IncomingCallIcon className="incoming-call" />
                        <span style={{fontWeight: "bold"}}>{videoCall.otherUser}</span>
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
                    </CallNotifier>
                ) : videoCall.acceptedRequest
                    ? <span>Connecting...</span>
                    : <VideoCallOngoing endAudioVideoCall={endAudioVideoCall} videoCall={videoCall} />
            }
        </div>
    );
}

export default connect(null, { acceptAudioVideoCall, rejectAudioVideoCall })(VideoCallContainer);