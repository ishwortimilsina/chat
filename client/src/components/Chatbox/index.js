import { connect } from 'react-redux';

import { sendCallRequest, rejectAudioVideoCall } from '../../store/actions';
import VideoCallIcon from '../common/icons/VideoCallIcon';
import VoiceCallIcon from '../common/icons/VoiceCallIcon';
import AudioCallContainer from './AudioCallContainer';
import './chatbox.css';
import ChatControllers from './ChatControllers';
import MessageContainer from './MessageContainer';
import OtherUserDisconnected from './OtherUserDisconnected';
import VideoCallContainer from './VideoCallContainer';

function Chatbox({ selectedContact, selectedContactName, selectContact, sendCallRequest, audioCall, videoCall }) {
    const shouldShowAudioCallContainer = audioCall.ongoing || audioCall.callRequested || audioCall.acceptedRequest || audioCall.incomingRequest;
    const shouldShowVideoCallContainer = videoCall.ongoing || videoCall.callRequested || videoCall.acceptedRequest || videoCall.incomingRequest;
    const showOtherUserDisconnected = audioCall.disconnected || videoCall.disconnected;

    return (
        <section className="chatbox">
            <div className="chat-title-bar">
                <div className="chat-title">
                    { selectedContact ? (
                        <>
                            <div className="contact-list-item-img-container">
                                <img className="contact-list-item-img" src='favicon.ico' alt={selectedContactName} />
                            </div>
                            <div className="contact-list-item-details">
                                <div className="chat-title-name">{selectedContactName}</div>
                                <div className="chat-title-availability">
                                    <div className="contact-list-item-active"></div>
                                    <div>Available</div>
                                </div>
                            </div>
                        </>
                    ) : <span>Select a contact to start chatting.</span>}
                </div>
                <div className={`${!selectedContact || shouldShowAudioCallContainer || shouldShowVideoCallContainer ? ' disable' : ''}`}>
                    <VoiceCallIcon tooltip="Voice Call" className="chat-initiators" onClick={() => sendCallRequest(selectedContact, 'audio')} />
                    <VideoCallIcon tooltip="Video Call" className="chat-initiators" onClick={() => sendCallRequest(selectedContact, 'video')} />
                </div>
            </div>
            {
                shouldShowAudioCallContainer || shouldShowVideoCallContainer || showOtherUserDisconnected
                    ? shouldShowAudioCallContainer
                        ? <AudioCallContainer audioCall={audioCall} selectContact={selectContact} />
                        : shouldShowVideoCallContainer
                            ? <VideoCallContainer videoCall={videoCall} selectContact={selectContact} />
                            : <OtherUserDisconnected
                                otherUser={audioCall.disconnected ? audioCall.otherUser : videoCall.otherUser}
                                type={audioCall.disconnected ? 'audio' : 'video'}
                            />
                    : (
                        <>
                            <MessageContainer selectedContact={selectedContact} />
                            <ChatControllers selectedContact={selectedContact} />
                        </>
                    )
            }
        </section>
    );
}

const mapStateToProps = (state, ownProps) => ({
    audioCall: state.audioCall,
    videoCall: state.videoCall,
    selectedContactName: (state.contacts.filter(cont => cont.userId === ownProps.selectedContact)[0] || {}).userName
});

export default connect(mapStateToProps, { sendCallRequest, rejectAudioVideoCall })(Chatbox);