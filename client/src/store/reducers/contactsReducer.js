import { ADD_CONTACT, CLEAR_CONTACTS, LEAVE_ROOM, REMOVE_CONTACT, SET_CONTACTS } from "../actions/actionTypes";

const initialState = [];

export function contactsReducer(state=initialState, action) {
    switch(action.type) {
        case SET_CONTACTS:
            return [ ...action.contacts ];
        case ADD_CONTACT:
            return [ ...state, action.contact ];
        case REMOVE_CONTACT:
            return state.filter(cont => cont.userId !== action.contact.userId);
        case LEAVE_ROOM:
        case CLEAR_CONTACTS:
            return initialState;
        default:
            return state;
    }
}