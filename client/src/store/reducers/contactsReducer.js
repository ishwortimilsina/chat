const initialState = [];

export function contactsReducer(state=initialState, action) {
    switch(action.type) {
        case 'contacts:set':
            return [ ...action.contacts ];
        default:
            return state;
    }
}