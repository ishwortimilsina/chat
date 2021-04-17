import { ADD_CONTACT, CLEAR_CONTACTS, LEAVE_ROOM, PEER_READY, REMOVE_CONTACT, SET_CONTACTS } from "../actions/actionTypes";

const initialState = {};

export function contactsReducer(state=initialState, action) {
    switch(action.type) {
        case SET_CONTACTS: {
            let allContacts = {};
            action.contacts.forEach(cont => allContacts[cont.userId] = cont);
            return allContacts;
        } case ADD_CONTACT: {
            return {
                ...state,
                [action.contact.userId]: { ...action.contact, connInitiator: action.connInitiator }
            };
        } case REMOVE_CONTACT: {
            const newState = { ...state };
            delete newState[action.contact.userId];
            return newState;
        } case PEER_READY:
            return {
                ...state,
                [action.peerId]: {
                    ...state[action.peerId],
                    peerReady: true
                }
            };
        case LEAVE_ROOM:
        case CLEAR_CONTACTS:
            return initialState;
        default:
            return state;
    }
}