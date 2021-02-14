import { combineReducers } from 'redux';
import { audioCallReducer } from './audioCallReducer';
import { contactsReducer } from './contactsReducer';
import { messagesReducer } from './messagesReducer';
import { videoCallReducer } from './videoCallReducer';


const rootReducer = combineReducers({
    contacts: contactsReducer,
    messages: messagesReducer,
    audioCall: audioCallReducer,
    videoCall: videoCallReducer
});

export default rootReducer;