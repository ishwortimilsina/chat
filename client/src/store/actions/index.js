import { newSocket } from './socket';

export { establishConnection } from './socket';
export { sendCallRequest, endAudioVideoCall, acceptAudioVideoCall, rejectAudioVideoCall, leaveChat } from './audioVideoCall';
export { requestShareFile, leaveFileSharing, endFileSharing, acceptShareFile, rejectShareFile, openFileSharingWidget } from './shareFile';
export { sendMessage } from './dataConnection';
export { peerConnections } from './connections';

export async function checkRoomExists(roomId) {
    const _this = {};
    return new Promise((resolve) => {
        if (newSocket) {
            newSocket.emit('check-room-availability', { roomId });
            _this.res = newSocket.on('room-availability', ({ roomId, isAvailable }) => {
                resolve({ roomId, isRoomAvailable: isAvailable });
                _this.res = null;
            });
        }
    });
}

export async function createRoom({ roomName }) {
    const _this = {};
    return new Promise((resolve) => {
        if (newSocket) {
            newSocket.emit('create-room', { roomName });
            _this.res = newSocket.on('create-room', ({ roomId, success, msg }) => {
                resolve({ roomId, success, msg });
                _this.res = null;
            });
        }
    });
}