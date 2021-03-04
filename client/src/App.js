import { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { useLocation } from 'wouter';
import * as uuid from 'uuid';

import './App.css';

import { AppContext } from './contexts/AppContext';
import MainContainer from './components/MainContainer';
import Landing from './components/Landing';

function App({ status }) {
    const [location] = useLocation();
    const [cred, setCred] = useState({});

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
                    location === "/"
                    ? <Landing />
                    : <MainContainer />
                }
            </div>
        </AppContext.Provider>
    );
}

const mapStateToProps = (state) => ({
    status: state.status
});

export default connect(mapStateToProps)(App);