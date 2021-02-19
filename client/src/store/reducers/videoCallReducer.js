import {
    ACCEPT_VIDEO_CALL, END_VIDEO_CALL, INCOMING_VIDEO_CALL,
    LOCAL_VIDEO_READY, REJECT_VIDEO_CALL, REMOTE_VIDEO_READY, 
    REMOVE_CONTACT, 
    REQUEST_VIDEO_CALL, START_VIDEO_CALL 
} from "../actions";

const initialState = {
    ongoing: false,
    callRequested: false,
    incomingRequest: false,
    acceptedRequest: false,
    otherUser: undefined,
    localVideoReady: undefined,
    remoteVideoReady: undefined
};

export function videoCallReducer(state = initialState, action) {
    switch (action.type) {
        case REQUEST_VIDEO_CALL:
            return { ...initialState, callRequested: true, otherUser: action.otherUser };
        case INCOMING_VIDEO_CALL:
            return { ...initialState, incomingRequest: true, otherUser: action.otherUser };
        case ACCEPT_VIDEO_CALL:
            return { ...initialState, incomingRequest: false, otherUser: action.otherUser, acceptedRequest: true };
        case REJECT_VIDEO_CALL:
            return initialState;
        case START_VIDEO_CALL:
            return { ...initialState, ongoing: true, otherUser: action.otherUser };
        case END_VIDEO_CALL:
            return initialState;
        case LOCAL_VIDEO_READY:
            return { ...state, localVideoReady: true };
        case REMOTE_VIDEO_READY:
            return { ...state, remoteVideoReady: true };
        case REMOVE_CONTACT:
            if (action.contact.userId === state.otherUser) {
                return { ...initialState, otherUser: state.otherUser, disconnected: true };
            }
            return state;
        default:
            return state;
    }
}