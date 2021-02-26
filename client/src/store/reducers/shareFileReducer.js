import {
    ACCEPT_SHARE_FILE_REQUEST, END_SHARE_FILE, INCOMING_SHARE_FILE_REQUEST,
    REJECT_SHARE_FILE_REQUEST, REMOVE_CONTACT, REQUEST_SHARE_FILE, START_SHARE_FILE
} from "../actions";

const initialState = {
    ongoing: false,
    shareRequested: false,
    incomingRequest: false,
    acceptedRequest: false,
    otherUser: undefined,
    disconnected: false
};

export function shareFileReducer(state = initialState, action) {
    switch (action.type) {
        case REQUEST_SHARE_FILE:
            return { ...initialState, shareRequested: true, otherUser: action.otherUser };
        case INCOMING_SHARE_FILE_REQUEST:
            return { ...initialState, incomingRequest: true, otherUser: action.otherUser };
        case ACCEPT_SHARE_FILE_REQUEST:
            return { ...initialState, incomingRequest: false, otherUser: action.otherUser, acceptedRequest: true };
        case REJECT_SHARE_FILE_REQUEST:
            return initialState;
        case START_SHARE_FILE:
            return { ...initialState, ongoing: true, otherUser: action.otherUser };
        case END_SHARE_FILE:
            return initialState;
        case REMOVE_CONTACT:
            if (action.contact.userId === state.otherUser) {
                return { ...initialState, otherUser: state.otherUser, disconnected: true };
            }
            return state;
        default:
            return state;
    }
}