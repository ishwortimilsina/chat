import { RECEIVE_MESSAGE, SEND_MESSAGE } from "../actions";

const initialState = {};

export function messagesReducer(state=initialState, action) {
    switch(action.type) {
        case SEND_MESSAGE: {
            return {
                ...state,
                [action.recipient]: [
                    ...(state[action.recipient] || []),
                    {
                        text: action.text,
                        sender: action.sender,
                        time: action.time,
                        msgId: `${action.sender}-${action.recipient}-${Date.now()}`
                    }
                ]
            };
        }
        case RECEIVE_MESSAGE: {
            return {
                ...state,
                [action.sender]: [
                    ...(state[action.sender] || []),
                    {
                        text: action.text,
                        sender: action.sender,
                        time: action.time,
                        msgId: `${action.sender}-${Date.now()}`
                    }
                ]
            };
        }
        default:
            return state;
    }
}