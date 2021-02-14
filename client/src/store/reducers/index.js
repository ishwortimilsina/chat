import { combineReducers } from 'redux';
import { audioCallReducer } from './audioCallReducer';
import { contactsReducer } from './contactsReducer';
import { messagesReducer } from './messagesReducer';


const rootReducer = combineReducers({
    contacts: contactsReducer,
    messages: messagesReducer,
    audioCall: audioCallReducer
});

export default rootReducer;