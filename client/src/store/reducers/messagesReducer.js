import { JOIN_ROOM, RECEIVE_MESSAGE, SEND_MESSAGE } from "../actions/actionTypes";

const initialState = {};

export function messagesReducer(state=initialState, action) {
    switch(action.type) {
        case JOIN_ROOM: {
            return {
                ...state,
                [action.roomId]: {}
            };
        }
        case SEND_MESSAGE: {
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