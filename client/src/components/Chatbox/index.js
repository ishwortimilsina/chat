import { useContext } from 'react';
import { connect } from 'react-redux';
import { AppContext } from '../../contexts/AppContext';
import { RoomContext } from '../../contexts/RoomContext';

import { sendCallRequest, openFileSharingWidget } from '../../store/actions';
import ShareIcon from '../common/icons/ShareIcon';
import VideoCallIcon from '../common/icons/VideoCallIcon';
import VoiceCallIcon from '../common/icons/VoiceCallIcon';
import AudioCallContainer from './AudioCallContainer';
import './chatbox.css';
import ChatControllers from './ChatControllers';
import MessageContainer from './MessageContainer';
import OtherUserDisconnected from './OtherUserDisconnected';
import ShareFileContainer from './ShareFileContainer';
import VideoCallContainer from './VideoCallContainer';

function Chatbox({ selectedContact, selectedContactName, selectContact, sendCallRequest, openFileSharingWidget, audioCall, videoCall, shareFile }) {
    const shouldShowAudioCallContainer = audioCall.ongoing || audioCall.callRequested || audioCall.acceptedRequest || audioCall.incomingRequest;
    const shouldShowVideoCallContainer = videoCall.ongoing || videoCall.callRequested || videoCall.acceptedRequest || videoCall.incomingRequest;
    const shouldShowShareFileContainer = shareFile.openFileSharingWidget || shareFile.ongoing || shareFile.shareRequested || shareFile.acceptedRequest || shareFile.incomingRequest;
    const showOtherUserDisconnected = audioCall.disconnected || videoCall.disconnected || shareFile.disconnected;
    const cred = useContext(AppContext);
    const { roomId } = useContext(RoomContext);

    return (
        <section className="chatbox">
            <div className="chat-title-bar">
                <div className="chat-title">
                    { selectedContact ? (
                        <>
                            <div className="contact-list-item-img-container">
                                <img className="contact-list-item-img" src='/favicon.ico' alt={selectedContactName} />
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
                <div className={`${!selectedContact || shouldShowAudioCallContainer || shouldShowVideoCallContainer || shouldShowShareFileContainer ? ' disable' : ''}`}>
                    <ShareIcon tooltip="Share File" className="chat-initiators" onClick={() => openFileSharingWidget(selectedContact)} />
                    <VoiceCallIcon tooltip="Voice Call" className="chat-initiators" onClick={() => sendCallRequest(selectedContact, 'audio')} />
                    <VideoCallIcon tooltip="Video Call" className="chat-initiators" onClick={() => sendCallRequest(selectedContact, 'video')} />
                </div>
            </div>
            {
                shouldShowAudioCallContainer || shouldShowVideoCallContainer || shouldShowShareFileContainer || showOtherUserDisconnected
                    ? shouldShowAudioCallContainer
                        ? <AudioCallContainer audioCall={audioCall} selectContact={selectContact} />
                        : shouldShowVideoCallContainer
                            ? <VideoCallContainer videoCall={videoCall} selectContact={selectContact} />
                            : shouldShowShareFileContainer 
                                ? <ShareFileContainer currUserId={cred.userId} shareFile={shareFile} selectContact={selectContact} />
                                : <OtherUserDisconnected
                                    otherUser={audioCall.disconnected ? audioCall.otherUser : videoCall.otherUser}
                                    type={audioCall.disconnected ? 'audio' : 'video'}
                                />
                    : (
                        <>
                            <MessageContainer roomId={roomId} selectedContact={selectedContact} />
                            <ChatControllers roomId={roomId} selectedContact={selectedContact} />
                        </>
                    )
            }
        </section>
    );
}

const mapStateToProps = (state, ownProps) => ({
    audioCall: state.audioCall,
    videoCall: state.videoCall,
    shareFile: state.shareFile,
    selectedContactName: (state.contacts[ownProps.selectedContact] || {}).userName
});

export default connect(mapStateToProps, { sendCallRequest, openFileSharingWidget })(Chatbox);