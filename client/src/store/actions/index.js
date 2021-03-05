import { newSocket } from './socket';

export { establishConnection } from './socket';
export { sendCallRequest, endAudioVideoCall, acceptAudioVideoCall, rejectAudioVideoCall, leaveChat } from './audioVideoCall';
export { requestShareFile, leaveFileSharing, endFileSharing, acceptShareFile, rejectShareFile, openFileSharingWidget } from './shareFile';
export { sendMessage } from './dataConnection';
export { peerConnections } from './connections';

export async function checkRoomExists(roomId) {
    return new Promise((resolve) => {
        if (newSocket) {
            newSocket.emit('check-room-availability', { roomId });
            newSocket.on('room-availability', ({ isAvailable }) => {
                resolve(isAvailable);
            });
        }
    });
}