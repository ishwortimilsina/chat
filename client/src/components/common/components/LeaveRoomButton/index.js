import { createPortal } from 'react-dom';
import { useLocation } from 'wouter';
import { leaveMeetStrangerRoom, leaveRoom } from '../../../../store/actions/rooms';

import './LeaveRoomButton.css';

export default function LeaveRoomButton({ otherUser, roomId }) {
    const [, setLocation] = useLocation();

    const handleLeaveRoom = () => {
        if (roomId === "meet-stranger" && otherUser) {
            leaveMeetStrangerRoom(otherUser);
        } else {
            leaveRoom({ roomId });
        }
        setLocation('/');
    }

    return createPortal(
        <div className="room-leave-button" onClick={handleLeaveRoom}>
            Leave Room
        </div>,
        document.getElementById("for-leave-room-button")
    );
}