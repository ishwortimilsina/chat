import {
    ACCEPT_SHARE_FILE_REQUEST, END_SHARE_FILE, INCOMING_SHARE_FILE_REQUEST,
    OPEN_FILE_SHARE_WIDGET,
    REJECT_SHARE_FILE_REQUEST, REMOVE_CONTACT, REQUEST_SHARE_FILE, SHARE_FILE_METADATA, 
    SHARE_FILE_RECEIVE_DATA, SHARE_FILE_SEND_DATA, START_SHARE_FILE
} from "../actions/actionTypes";

const initialState = {
    ongoing: false,
    openShareFileWidget: false,
    shareRequested: false,
    incomingRequest: false,
    acceptedRequest: false,
    otherUser: undefined,
    shareFileMetadata: {},
    downloadProgress: 0,
    bytesReceived: 0,
    downloadStartTime: undefined,
    downloadSpeed: undefined,
    bytesSent: 0,
    uploadProgress: 0,
    uploadSpeed: undefined,
    disconnected: false
};

export function shareFileReducer(state = initialState, action) {
    switch (action.type) {
        case OPEN_FILE_SHARE_WIDGET:
            return { ...initialState, openFileSharingWidget: true, otherUser: action.otherUser };
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
        case SHARE_FILE_METADATA:
            return {
                ...initialState,
                ongoing: true,
                otherUser: action.otherUser,
                shareFileMetadata: { fileName: action.fileName, fileSize: action.fileSize },
                bytesReceived: 0,
                downloadProgress: 0,
                downloadStartTime: action.downloadStartTime
            };
        case SHARE_FILE_RECEIVE_DATA:
            return {
                ...state,
                bytesReceived: action.bytesReceived,
                downloadProgress: action.downloadProgress,
                downloadSpeed: action.downloadSpeed
            };
        case SHARE_FILE_SEND_DATA:
            return {
                ...state,
                bytesSent: action.bytesSent,
                uploadProgress: action.uploadProgress,
                uploadSpeed: action.uploadSpeed
            };
        default:
            return state;
    }
}