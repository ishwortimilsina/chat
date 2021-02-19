import {
    ACCEPT_AUDIO_CALL, END_AUDIO_CALL, INCOMING_AUDIO_CALL,
    LOCAL_AUDIO_READY, REJECT_AUDIO_CALL, REMOTE_AUDIO_READY,
    REMOVE_CONTACT,
    REQUEST_AUDIO_CALL, START_AUDIO_CALL
} from "../actions";

const initialState = {
    ongoing: false,
    callRequested: false,
    incomingRequest: false,
    acceptedRequest: false,
    otherUser: undefined,
    localAudioReady: undefined,
    remoteAudioReady: undefined,
    disconnected: false
};

export function audioCallReducer(state = initialState, action) {
    switch (action.type) {
        case REQUEST_AUDIO_CALL:
            return { ...initialState, callRequested: true, otherUser: action.otherUser };
        case INCOMING_AUDIO_CALL:
            return { ...initialState, incomingRequest: true, otherUser: action.otherUser };
        case ACCEPT_AUDIO_CALL:
            return { ...initialState, incomingRequest: false, otherUser: action.otherUser, acceptedRequest: true };
        case REJECT_AUDIO_CALL:
            return initialState;
        case START_AUDIO_CALL:
            return { ...initialState, ongoing: true, otherUser: action.otherUser };
        case END_AUDIO_CALL:
            return initialState;
        case LOCAL_AUDIO_READY:
            return { ...state, localAudioReady: true };
        case REMOTE_AUDIO_READY:
            return { ...state, remoteAudioReady: true };
        case REMOVE_CONTACT:
            if (action.contact.userId === state.otherUser) {
                return { ...initialState, otherUser: state.otherUser, disconnected: true };
            }
            return state;
        default:
            return state;
    }
}