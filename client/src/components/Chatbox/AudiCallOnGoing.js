import { useEffect, useRef } from "react";

import { audioVideoPeerConnections, leaveChat } from "../../store/actions";
import EndCallIcon from "../common/icons/EndCallIcon";
import UserCircleIcon from "../common/icons/UserCircleIcon";
import useTimer from "../hooks/useTimer";

export default function AudioCalOnGoing({ endAudioVideoCall, audioCall }) {
    const remoteAudioRef = useRef();
    const { durationString } = useTimer();

    useEffect(() => {
        if (audioCall.ongoing && audioCall.otherUser && audioVideoPeerConnections[audioCall.otherUser]) {
            const { remoteAudioStream } = audioVideoPeerConnections[audioCall.otherUser];
            remoteAudioRef.current.srcObject = remoteAudioStream;
        }
    }, [audioCall]);

    return (
        <>
            <div className="remote-audio-container">
                <UserCircleIcon className="audio-ongoing-user-img" />
                <div>Call on-going with {audioCall.otherUser}</div>
                <div className="ongoing-call-timer">{durationString}</div>
                <audio ref={remoteAudioRef} autoPlay></audio> 
            </div>
            <div
                className="end-call-button"
                onClick={() => {
                    endAudioVideoCall(audioCall.otherUser, 'audio');
                    leaveChat(audioCall.otherUser, 'audio');
                }}
                title="End Call"
            >
                <EndCallIcon style={{ height: 30, width: 30 }} />
            </div>
        </>
    );
}