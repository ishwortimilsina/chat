import { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { useLocation } from 'wouter';

import './App.css';

import { AppContext } from './contexts/AppContext';
import Home from './components/Landing/Home';
import LoginForm from './components/Landing/LoginForm';
import Room from './components/Room';
import { generateRandomString } from './utils/utils';
import MeetStranger from './components/MeetStranger';


function App({ status }) {
    const [cred, setCred] = useState({});
    const [location] = useLocation();

    useEffect(() => {
        const userId = generateRandomString(16);
        const localChatIdentity = JSON.parse(localStorage.getItem('chat-identity'));
        const userName = localChatIdentity && localChatIdentity.userName;

        setCred({ userId, userName });
    }, []);

    return (
        <AppContext.Provider value={{ ...cred, status }}>
            <div className="App">
                {
                    status.connected
                        ? location === "/"
                            ? <Home />
                            : location === '/meet-stranger'
                                ? <MeetStranger />
                                : <Room />
                        : <LoginForm userName="Ishwor Timilsina" userId="some-random-id" />
                }
            </div>
        </AppContext.Provider>
    );
}

const mapStateToProps = (state) => ({
    status: state.status
});

export default connect(mapStateToProps)(App);