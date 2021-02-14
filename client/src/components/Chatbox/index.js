import { connect } from 'react-redux';

import { sendCallRequest, rejectAudioVideoCall } from '../../store/actions';
import AudioCallContainer from './AudioCallContainer';
import './chatbox.css';
import ChatControllers from './ChatControllers';
import MessageContainer from './MessageContainer';
import VideoCallContainer from './VideoCallContainer';

function Chatbox({ selectedContact, selectContact, sendCallRequest, audioCall, videoCall }) {
    const shouldShowAudioCallContainer = audioCall.ongoing || audioCall.callRequested || audioCall.acceptedRequest || audioCall.incomingRequest;
    const shouldShowVideoCallContainer = videoCall.ongoing || videoCall.callRequested || videoCall.acceptedRequest || videoCall.incomingRequest;

    return (
        <section className="chatbox">
            <div className={`chat-initiators-bar${!selectedContact || shouldShowAudioCallContainer || shouldShowVideoCallContainer ? ' disable' : ''}`}>
                <div className="chat-initiators" onClick={() => sendCallRequest(selectedContact, 'audio')}>Call</div>
                <div className="chat-initiators" onClick={() => sendCallRequest(selectedContact, 'video')}>Video</div>
            </div>
            {
                shouldShowAudioCallContainer || shouldShowVideoCallContainer
                    ? shouldShowAudioCallContainer
                        ? <AudioCallContainer audioCall={audioCall} selectContact={selectContact} />
                        : <VideoCallContainer videoCall={videoCall} selectContact={selectContact} />
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

const mapStateToProps = (state) => ({
    audioCall: state.audioCall,
    videoCall: state.videoCall
});

export default connect(mapStateToProps, { sendCallRequest, rejectAudioVideoCall })(Chatbox);