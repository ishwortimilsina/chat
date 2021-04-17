import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { RoomContext } from '../../contexts/RoomContext';

import { joinRoom } from '../../store/actions';
import { delay } from '../../utils/utils';
import LeaveRoomButton from '../common/components/LeaveRoomButton';
import Modal from '../common/components/Modal';
import LoadingIcon from '../common/icons/LoadingIcon';
import LoginForm from '../Landing/LoginForm';

export default function ShareFiles({ currentRoomId }) {
    const [ location, setLocation ] = useLocation();
    const [ isUserNameSet, changeIsUserNameSet ] = useState(false);
    const [ roomName, setRoomName ] = useState('');
    const [ isAvailable, setIsAvailable ] = useState(false);
    const [ isChecking, setIsChecking ] = useState(true);

    useEffect(() => {
        if (isUserNameSet) {
            (async function joiningRoom() {
                await delay(1000);

                const { roomId, roomName, success } = await joinRoom({ roomId: currentRoomId, roomType: 'share-files' });

                setIsChecking(false);

                if (roomId === currentRoomId && success) {
                    setIsAvailable(success);
                    setRoomName(roomName)
                } else {
                    await delay(3000);
                    setLocation("/");
                }
            })();
        }
    }, [isUserNameSet, location, setLocation, currentRoomId]);

    return (
        <RoomContext.Provider value={{ roomId: currentRoomId, roomName }}>
            <LeaveRoomButton roomId={currentRoomId} />
            <div className="room-page">
                {
                    !isUserNameSet ? (
                        <LoginForm changeIsUserNameSet={changeIsUserNameSet} />
                    ) : isChecking ? (
                        <div className="page-loading">
                            <LoadingIcon style={{ height: 180, width: 180 }} />
                        </div>
                    ) : isAvailable ? (
                        <div>This is share-files room </div>
                    ) : (
                        <Modal backgroundColor="rgb(177 198 229)">
                            <div className="no-room-msg">
                                <strong>This room is not available.</strong>
                                <span>Taking you to home page in 3 seconds.</span>
                            </div>
                        </Modal>
                    )
                }
            </div>
        </RoomContext.Provider>
    );
}