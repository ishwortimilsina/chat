import { useContext } from "react";
import { useLocation } from "wouter";
import { RoomContext } from "../../contexts/RoomContext";
import { leaveRoom } from "../../store/actions/rooms";
import ChatContainer from "../ChatContainer";
import './mainContainer.css';

export default function MainContainer() {
    const [ , setLocation] = useLocation();
    const { roomId, roomName } = useContext(RoomContext);

    const handleLeaveRoom = async () => {
        setLocation('/');
        await leaveRoom({ roomId });
    };

    return (
        <div className="main-container">
            <div className="room-title">
                <div className="room-name">{roomName}</div>
                <div className="room-leave-button" onClick={handleLeaveRoom}>
                    Leave Room
                </div>
            </div>
            <ChatContainer />
        </div>        
    );
}