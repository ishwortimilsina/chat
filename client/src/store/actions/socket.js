import { io } from "socket.io-client";
import { ADD_CONTACT, REMOVE_CONTACT, SET_CONTACTS } from "./actionTypes";
import { initializeSocketForAudioVideoCall } from "./audioVideoCall";
import { initializeSocketForShareFile } from "./shareFile";
import { initializeSocketForDataConnection } from './dataConnection';
import { initializeSocketForPeerConnection } from "./peerConnection";

export function establishConnection(id, name) {
    return async (dispatch) => {
        try {
            const newSocket = await io(
                'http://localhost:3001',
                {
                    query: { id, name },
                    transports: ["websocket"]
                },
            );

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
            initializeSocketForAudioVideoCall(newSocket);
            initializeSocketForShareFile(newSocket);

        } catch (ex) {
            console.log(ex);
        }
    };
}