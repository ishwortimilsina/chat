import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

import { checkRoomExists } from '../../store/actions';
import { delay } from '../../utils/utils';
import Modal from '../common/components/Modal';
import LoadingIcon from '../common/icons/LoadingIcon';
import MainContainer from '../MainContainer';
import './Room.css';

export default function Room() {
    const [ location, setLocation ] = useLocation();
    const [ isAvailable, setIsAvailable ] = useState(false);
    const [ isChecking, setIsChecking ] = useState(true);

    useEffect(() => {
        (async function checkingRoomAvailability() {
            await delay(1000);

            const currentRoom = location.split("?")[0].split("/")[1]
            const { roomId, isRoomAvailable } = await checkRoomExists(currentRoom);

            setIsChecking(false);

            if (roomId === currentRoom) {
                setIsAvailable(isRoomAvailable);
            } else {
                await delay(3000);
                setLocation("/");
            }
        })();
    }, [location, setLocation]);

    return (
        <div className="room-page">
            {
                isChecking ? (
                    <div className="page-loading">
                        <LoadingIcon style={{ height: 180, width: 180 }} />
                    </div>
                ) : isAvailable ? (
                    <MainContainer />
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
    );
}