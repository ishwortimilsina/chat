import { useState } from 'react';
import { useLocation } from 'wouter';

import { createRoom } from '../../store/actions';
import ArrowLeftIcon from '../common/icons/ArrowLeftIcon';
import CopyIcon from '../common/icons/CopyIcon';
import DoorOpenIcon from '../common/icons/DoorOpenIcon';
import HomeIcon from '../common/icons/HomeIcon';
import LoadingIcon from '../common/icons/LoadingIcon';

import './Room.css';

export default function CreateRoom({ goBack, roomType }) {
    const [ location, setLocation ] = useLocation();
    const [ roomName, setRoomName ] = useState(roomType === "meet" ? "" : "Share Files");
    const [ roomId, setRoomId ] = useState('');
    const [ isSubmitting, setIsSubmitting ] = useState(false);
    const [ roomLink, setRoomLink ] = useState('');
    const [ copied, setCopied ] = useState(false);
    const [ failureMsg, setFailureMsg ] = useState('');

    const handleSubmit = async () => {
        setIsSubmitting(true);
        const { roomId, success, msg } = await createRoom({ roomName, roomType })
        if (success) {
            setRoomId(roomId);
            setFailureMsg('');
            setRoomLink(`${window.location.hostname}${window.location.port ? ':'+window.location.port : ''}/${roomType}/${roomId}`);
        } else {
            setRoomId('');
            setFailureMsg(msg);
            setRoomLink('');
        }
        setIsSubmitting(false);
    };

    const copyToClipboard = async () => {
        try {
            if (roomLink) {
                await navigator.clipboard.writeText(roomLink);
                setCopied(true);
            }
        } catch (err) {
            setCopied(false);   
        }
    };

    const handleJoin = () => {
        if (roomId) {
            setLocation(`/${roomType}/${roomId}`);
        }
    }

    return (
        <form className="room-form">
            <div className="go-back-button" onClick={goBack}>
                <ArrowLeftIcon style={{ height: 30, width: 30 }} tooltip="Back" />
            </div>
            <div className="room-form-header">
                <HomeIcon tooltip="Create Room" style={{ height: 60, width: 60 }} />
                CREATE ROOM
            </div>
            <div className="room-form-body">
                <label>Room Name</label>
                <input
                    className="room-form-input"
                    type="text"
                    value={roomName || ''}
                    onChange={({ target }) => setRoomName(target.value)}
                    placeholder="Room Name"
                    disabled={isSubmitting || roomId || roomType !== "meet"}
                />
                <label>Room ID</label>
                <input
                    className="room-form-input"
                    type="text"
                    value={roomId || ''}
                    onChange={null}
                    placeholder="Room ID"
                    disabled
                />
                { failureMsg ? <strong>{failureMsg}</strong> : null }
                <div className="room-link">
                    <label>Room URL:</label>
                    <div className="room-link-link">
                        <span>{roomLink}</span>
                        <CopyIcon className={`copy-room-link${roomId ? '' : ' disable'}`} tooltip="Copy link" onClick={copyToClipboard} />
                    </div>
                </div>
                { copied ? <span className="copied-msg">Copied the link to clipboard.</span> : null }
            </div>
            <div className="room-form-footer">
                <div className={`room-submit-button${roomId ? '' : ' disable'}`} onClick={handleJoin}>
                    <DoorOpenIcon tooltip="Join Room" style={{ height: 20, width: 20 }} />
                    &emsp;Join
                </div>
                <div className={`room-submit-button${roomName && !roomId ? '' : ' disable'}`} onClick={handleSubmit}>
                    <HomeIcon tooltip="Create Room" style={{ height: 20, width: 20 }} />
                    &emsp;{ isSubmitting ? <LoadingIcon style={{ height: 80, width: 80 }} /> : 'Create' }
                </div>
            </div>
        </form>
    );
}