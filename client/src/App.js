import { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { useLocation } from 'wouter';
import * as uuid from 'uuid';

import './App.css';

import { AppContext } from './contexts/AppContext';
import Home from './components/Landing/Home';
import LoginForm from './components/Landing/LoginForm';
import Room from './components/Room';


function App({ status }) {
    const [cred, setCred] = useState({});
    const [location] = useLocation();

    useEffect(() => {
        const userId = uuid.v1();
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