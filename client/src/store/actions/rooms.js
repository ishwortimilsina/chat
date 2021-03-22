import { appStore } from '../..';
import { JOIN_ROOM, LEAVE_ROOM, REMOVE_CONTACT } from './actionTypes';
import { endAudioVideoCall, leaveChat } from './audioVideoCall';

let newSocket;

export function initializeSocketForRooms(currentSocket) {
    newSocket = currentSocket;

    newSocket.on('stranger-left', ({ strangerId }) => {
        getNextStranger(strangerId);
    });
}

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

export async function leaveRoom({ roomId }) {
    const _this = {};
    return new Promise((resolve) => {
        if (newSocket) {
            newSocket.emit('leave-room', { roomId });
            _this.res = newSocket.on('leave-room', ({ roomId, success, msg }) => {
                if (success) {
                    appStore.dispatch({
                        type: LEAVE_ROOM,
                        roomId
                    });
                }
                resolve({ roomId, success, msg });
                _this.res = null;
            });
        }
    });
}

export async function joinMeetStrangerRoom() {
    const _this = {};
    return new Promise((resolve) => {
        if (newSocket) {
            newSocket.emit('join-meet-stranger-room');
            _this.res = newSocket.on('join-meet-stranger-room', ({ success, msg }) => {
                if (success) {
                    appStore.dispatch({
                        type: JOIN_ROOM,
                        roomId: 'meet-stranger'
                    });
                }
                resolve({ success, msg });
                _this.res = null;
            });
        }
    });
}

export async function leaveMeetStrangerRoom(strangerId) {
    appStore.dispatch({
        type: LEAVE_ROOM,
        roomId: 'meet-stranger'
    });
    endAudioVideoCall(strangerId, 'video');
    leaveChat(strangerId, 'video');

    if (newSocket) {
        newSocket.emit('leave-meet-stranger-room');
    }
}

export function getNextStranger(strangerId) {
    // first remove this user from the contact list
    // this will trigger other cleanups (eg. messages) as well
    appStore.dispatch({
        type: REMOVE_CONTACT,
        roomId: 'meet-stranger',
        contact: { userId: strangerId }
    });
    endAudioVideoCall(strangerId, 'video');
    leaveChat(strangerId, 'video');

    if (newSocket) {
        newSocket.emit('get-next-stranger', { strangerId });
    }
}