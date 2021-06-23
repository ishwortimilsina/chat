import { appStore } from "../..";
import { ADD_CONTACT, CLEAR_CONTACTS, REMOVE_CONTACT, SET_CONTACTS } from "./actionTypes";

export function initiateSocketsForContactsHandling(newSocket) {
    newSocket.on('contacts-list', data => {
        appStore.dispatch({
            type: SET_CONTACTS,
            roomId: data.roomId,
            contacts: data.contacts
        });
    });

    newSocket.on('new-contact', data => {
        appStore.dispatch({
            type: ADD_CONTACT,
            roomId: data.roomId,
            contact: data.contact
        });
    });

    newSocket.on('remove-contact', data => {
        appStore.dispatch({
            type: REMOVE_CONTACT,
            roomId: data.roomId,
            contact: data.contact
        });
    });

    newSocket.on('clear-contacts', data => {
        appStore.dispatch({
            type: CLEAR_CONTACTS,
            roomId: data.roomId
        });
    });
}