import { useState } from 'react';
import { useLocation } from 'wouter';

import ArrowLeftIcon from '../common/icons/ArrowLeftIcon';
import DoorOpenIcon from '../common/icons/DoorOpenIcon';

import './Room.css';

export default function JoinRoom({ goBack }) {
    const [ location, setLocation ] = useLocation();
    const [ roomId, setRoomId ] = useState('');
    const [ roomLink, setRoomLink ] = useState('');

    const handleRoomIdChange = ({ target }) => {
        setRoomId(target.value);
        const roomLink = `${window.location.hostname}${window.location.port ? ':'+window.location.port : ''}/meet/${target.value}`;
        setRoomLink(roomLink);
    };

    const handleJoin = () => {
        if (roomId) {
            setLocation(`/${roomId}`);
        }
    }

    return (
        <form className="room-form">
            <div className="go-back-button" onClick={goBack}>
                <ArrowLeftIcon style={{ height: 30, width: 30 }} tooltip="Back" />
            </div>
            <div className="room-form-header">
                <DoorOpenIcon tooltip="Join Room" style={{ height: 60, width: 60 }} />
                JOIN ROOM
            </div>
            <div className="room-form-body join-room-form">
                <label>Room ID</label>
                <input
                    className="room-form-input"
                    type="text"
                    value={roomId || ''}
                    onChange={handleRoomIdChange}
                    placeholder="Room ID"
                />
                <div className="room-link">
                    <label>Room URL</label>
                    <input
                        className="room-form-input"
                        type="text"
                        value={roomLink}
                        onChange={null}
                        placeholder="Room URL"
                        disabled
                    />
                </div>
            </div>
            <div className="room-form-footer">
                <div className={`room-submit-button${roomId ? '' : ' disable'}`} onClick={handleJoin}>
                    <DoorOpenIcon tooltip="Join Room" style={{ height: 20, width: 20 }} />
                    &emsp;Join
                </div>
            </div>
        </form>
    );
}