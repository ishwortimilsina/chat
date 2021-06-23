import { CONNECTED, DISCONNECTED } from "../actions/actionTypes";

const initialState = {
    connected: false
};

export default function statusReducer(state = initialState, action) {
    switch (action.type) {
        case CONNECTED:
            return { ...state, connected: true };
        case DISCONNECTED:
            return { ...state, connected: false };
        default:
            return state;
    }
}