import React, { useEffect, useRef } from 'react';
import { connect } from 'react-redux';

import { sendCallRequest, endAudioVideoCall, acceptAudioVideoCall, rejectAudioVideoCall, leaveChat, audioVideoPeerConnections } from '../../store/actions';
import './chatbox.css';
import ChatControllers from './ChatControllers';
import MessageContainer from './MessageContainer';

function Chatbox({ selectedContact, selectContact, sendCallRequest, audioCall, acceptAudioVideoCall, rejectAudioVideoCall }) {
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
        <section className="chatbox">
            <div className={`chat-initiators-bar${!selectedContact || audioCall.ongoing || audioCall.callRequested || audioCall.incomingRequest || audioCall.acceptedRequest ? ' disable' : ''}`}>
                <div className="chat-initiators" onClick={() => sendCallRequest(selectedContact, 'audio')}>Call</div>
                <div className="chat-initiators" onClick={() => sendCallRequest(selectedContact, 'video')}>Video</div>
            </div>
            {
                !audioCall.ongoing && !audioCall.callRequested && !audioCall.acceptedRequest && !audioCall.incomingRequest
                    ? (
                        <>
                            <MessageContainer selectedContact={selectedContact} />
                            <ChatControllers selectedContact={selectedContact} />
                        </>
                    )
                    : (
                        <div className="audio-containers">
                            {
                                audioCall.callRequested ? (
                                    <>
                                        <span>Calling {selectedContact}...</span>
                                        <div className="call-buttons" onClick={() => {
                                            endAudioVideoCall(selectedContact, 'audio');
                                            leaveChat(selectedContact, 'audio');
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
                                            endAudioVideoCall(selectedContact, 'audio');
                                            leaveChat(selectedContact, 'audio');
                                        }}>End Call</div>
                                    </>
                                )
                            }
                        </div>
                    )
            }
        </section>
    );
}

const mapStateToProps = (state) => ({ audioCall: state.audioCall });

export default connect(mapStateToProps, { sendCallRequest, acceptAudioVideoCall, rejectAudioVideoCall })(Chatbox);