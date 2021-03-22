import { useContext } from "react";

import { RoomContext } from "../../contexts/RoomContext";
import ChatContainer from "../ChatContainer";
import LeaveRoomButton from "../common/components/LeaveRoomButton";
import './mainContainer.css';

export default function MainContainer() {
    const { roomId } = useContext(RoomContext);

    return (
        <div className="main-container">
            <LeaveRoomButton roomId={roomId} />
            <ChatContainer />
        </div>        
    );
}