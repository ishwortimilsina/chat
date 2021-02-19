import { endAudioVideoCall } from "../../store/actions";
import CallMissedIcon from "../common/icons/CallMissedIcon";
import EndCallIcon from "../common/icons/EndCallIcon";
import CallNotifier from "./CallNotifier";

export default function OtherUserDisconnected({ otherUser, type }) {
    return (
        <CallNotifier>
            <CallMissedIcon className="missed-call" />
            <span style={{ fontWeight: "bold", textAlign: 'center' }}>
                The other user {otherUser} got disconnected.
            </span>
            <div className="accept-reject-buttons-container">
                <div 
                    className="accept-call-button"
                    onClick={() => endAudioVideoCall(otherUser, type)}
                    title="End Call"
                >
                    <EndCallIcon style={{ height: 30, width: 30 }} />
                </div>
            </div>
        </CallNotifier>
    );
}