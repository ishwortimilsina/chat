import { JOIN_ROOM, LEAVE_ROOM, RECEIVE_MESSAGE, REMOVE_CONTACT, SEND_MESSAGE } from "../actions/actionTypes";

const initialState = {};

export function messagesReducer(state=initialState, action) {
    switch(action.type) {
        case JOIN_ROOM: {
            return {
                ...state,
                [action.roomId]: {}
            };
        }
        case LEAVE_ROOM: {
            return initialState;
        }
        case REMOVE_CONTACT: {
            return {
                ...state,
                [action.roomId]: {
                    ...state[action.roomId],
                    [action.contact.userId]: undefined
                }
            };
        }
        case SEND_MESSAGE: {
            console.log(action)
            return {
                ...state,
                [action.roomId]: {
                    ...state[action.roomId],
                    [action.recipient]: [
                        ...(state[action.roomId][action.recipient] || []),
                        {
                            text: action.text,
                            sender: action.sender,
                            time: action.time,
                            msgId: `${action.sender}-${action.recipient}-${Date.now()}`
                        }
                    ]
                }
            };
        }
        case RECEIVE_MESSAGE: {
            return {
                ...state,
                [action.roomId]: {
                    ...state[action.roomId],
                    [action.sender]: [
                        ...(state[action.roomId][action.sender] || []),
                        {
                            text: action.text,
                            sender: action.sender,
                            time: action.time,
                            msgId: `${action.sender}-${Date.now()}`
                        }
                    ]
                }
            };
        }
        default:
            return state;
    }
}