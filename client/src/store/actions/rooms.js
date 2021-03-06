import { appStore } from '../..';
import { JOIN_ROOM } from './actionTypes';
import { newSocket } from './socket';

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

export async function joinRoom({ roomId }) {
    const _this = {};
    return new Promise((resolve) => {
        if (newSocket) {
            newSocket.emit('join-room', { roomId });
            _this.res = newSocket.on('join-room', ({ roomId, roomName, success, msg }) => {
                if (success) {
                    appStore.dispatch({
                        type: JOIN_ROOM,
                        roomId
                    });
                }
                resolve({ roomId, roomName, success, msg });
                _this.res = null;
            });
        }
    });
}