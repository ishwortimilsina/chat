import { RECEIVE_MESSAGE, SEND_MESSAGE } from "../actions";

const initialState = {};

export default function messagesReducer(state=initialState, action) {
    switch(action.type) {
        case SEND_MESSAGE: {
            let newState = { ...state };
            action.recipients.forEach(recipient => {
                newState = {
                    ...newState,
                    [recipient]: [
                        ...(newState[recipient] || []),
                        {
                            text: action.text,
                            sender: action.sender,
                            time: action.time,
                            msgId: `${action.sender}-${recipient}-${Date.now()}`
                        }
                    ]
                };
            });
            return newState;
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