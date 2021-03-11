import { useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import { videoCallUser } from '../../store/actions/audioVideoCall';
import { getNextStranger, joinMeetStrangerRoom, leaveMeetStrangerRoom } from '../../store/actions/rooms';
import { delay } from '../../utils/utils';
import ChatControllers from '../Chatbox/ChatControllers';
import MessageContainer from '../Chatbox/MessageContainer';
import VideoCallOngoing from '../Chatbox/VideoCallOngoing';
import FastForwardIcon from '../common/icons/FastForwardIcon';
import LoadingIcon from '../common/icons/LoadingIcon';
import './MeetStranger.css';

function MeetStranger({ stranger, videoCall }) {
    const strangerId = stranger && stranger.userId;
    const [isChecking, setIsChecking] = useState(false);
    const retryNextStranger = useRef(null);
    const partner = useRef(strangerId);

    useEffect(() => {
        (async function joiningRoom() {
            await delay(500);
            await joinMeetStrangerRoom();
            setIsChecking(false);
        })();
    }, []);

    useEffect(() => {
        if (!strangerId && !retryNextStranger.current) {
            retryNextStranger.current = setInterval(() => {
                if (!strangerId) getNextStranger();
                else clearInterval(retryNextStranger.current);
            }, 15000);
        } else {
            retryNextStranger.current && clearInterval(retryNextStranger.current);
        }

        if (strangerId && partner.current !== strangerId && stranger.connInitiator) {
            videoCallUser(strangerId);
        }

        return () => retryNextStranger.current && clearInterval(retryNextStranger.current);
    }, [strangerId, stranger.connInitiator])

    const nextUser = () => {
        if (strangerId) {
            getNextStranger();
        }
    };

    return (
        <div className="meet-stranger-container">
            <div className="room-title">
                <div className="room-name">Meet Stranger</div>
                <div className="room-leave-button" onClick={leaveMeetStrangerRoom}>
                    Leave Room
                </div>
            </div>
            {
                isChecking ? (
                    <div className="meet-stranger-page-loading">
                        <LoadingIcon style={{ height: 180, width: 180 }} />
                    </div>
                ) : (
                    <div className="meet-stranger-main-container">
                        <div className="meet-stranger-video-area">
                            {
                                strangerId && videoCall.ongoing
                                ? <VideoCallOngoing videoCall={videoCall} />
                                : <div className="placeholder-video-poster">Loading peer's video...</div>
                            }
                        </div>
                        <div className="meet-stranger-text-chat-area">
                            <div className="text-chat-title">
                                <div className="title-name">Text Chat: {strangerId}</div>
                                <div className="room-leave-button" onClick={nextUser}>
                                    <span>Next User</span>&nbsp;
                                    <FastForwardIcon style={{ height: 20, width: 20 }} />
                                </div>
                            </div>
                            <div className="meet-stranger-text-chat-area-inner">
                                {
                                    strangerId ? (
                                        <>
                                            <MessageContainer roomId="meet-stranger" selectedContact={strangerId} />
                                            <ChatControllers roomId="meet-stranger" selectedContact={strangerId} />
                                        </>
                                    ) : <div />
                                }
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
}

const mapStateToProps = (state) => {
    const contacts = Object.values(state.contacts);
    return {
        stranger: contacts[0] || {},
        videoCall: state.videoCall
    }
};

export default connect(mapStateToProps)(MeetStranger);