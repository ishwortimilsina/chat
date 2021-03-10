import { io } from "socket.io-client";
import { CONNECTED, DISCONNECTED } from "./actionTypes";
import { initiateSocketsForContactsHandling } from "./contacts";
import { initializeSocketForDataConnection } from './dataConnection';
import { initializeSocketForPeerConnection } from "./peerConnection";
import { initializeSocketForRooms } from "./rooms";

export let newSocket = null;
export function establishConnection(id, name) {
    return async (dispatch) => {
        try {
            newSocket = await io(
                'http://localhost:3001',
                {
                    query: { id, name },
                    transports: ["websocket"]
                },
            );

            newSocket.on('connect', () => {
                dispatch({ type: CONNECTED });
            });

            newSocket.on('disconnect', () => {
                dispatch({ type: DISCONNECTED });
                newSocket = null;
            });

            initiateSocketsForContactsHandling(newSocket);

            initializeSocketForRooms(newSocket);

            initializeSocketForPeerConnection(newSocket);
            initializeSocketForDataConnection(newSocket);

        } catch (ex) {
            console.log(ex);
        }
    };
}