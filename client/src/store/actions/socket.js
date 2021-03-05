import { io } from "socket.io-client";
import { ADD_CONTACT, CONNECTED, DISCONNECTED, REMOVE_CONTACT, SET_CONTACTS } from "./actionTypes";
import { initializeSocketForDataConnection } from './dataConnection';
import { initializeSocketForPeerConnection } from "./peerConnection";

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

            newSocket.on('contacts-list', data => {
                dispatch({
                    type: SET_CONTACTS,
                    contacts: data.contacts
                });
            });

            newSocket.on('new-contact', data => {
                dispatch({
                    type: ADD_CONTACT,
                    contact: data.contact
                });
            });

            newSocket.on('remove-contact', data => {
                dispatch({
                    type: REMOVE_CONTACT,
                    contact: data.contact
                });
            });

            initializeSocketForPeerConnection(newSocket);
            initializeSocketForDataConnection(newSocket);

        } catch (ex) {
            console.log(ex);
        }
    };
}