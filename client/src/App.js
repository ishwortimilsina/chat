import { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { useLocation, useRoute } from 'wouter';

import './App.css';

import { AppContext } from './contexts/AppContext';
import Home from './components/Landing/Home';
import Room from './components/Room';
import { generateRandomString } from './utils/utils';
import MeetStranger from './components/MeetStranger';
import { establishConnection } from './store/actions';
import LoadingIcon from './components/common/icons/LoadingIcon';
import PageNotFound from './components/PageNotFound';
import ShareFiles from './components/ShareFiles';


function App({ status, establishConnection }) {
    const [cred, setCred] = useState({});
    const [location, setLocation] = useLocation();
    const meetRoom = useRoute("/meet/:id");
    const shareFilesRoom = useRoute("/share-files/:id");

    useEffect(() => {
        const userId = generateRandomString(16);
        const localChatIdentity = JSON.parse(localStorage.getItem('chat-identity'));
        const userName = localChatIdentity && localChatIdentity.userName;

        establishConnection(userId);

        setCred({ userId, userName });
    }, [establishConnection]);

    return (
        <AppContext.Provider value={{ ...cred, status }}>
            <div className="App">
                <div className="site-navbar">
                    <div className="site-navbar-left" onClick={() => setLocation('/')}>
                        <img className="site-logo" src="/favicon.ico" alt="site-logo" />
                        <div className="site-name">Kurakani</div>
                    </div>
                    <div className="site-navbar-middle">
                        {
                            location === '/meet-stranger'
                            ? <span className="room-name">Meet Stranger</span>
                            : meetRoom[0]
                                ? <span className="room-name">Meet</span>
                                : shareFilesRoom[0]
                                    ? <span className="room-name">Share Files</span>
                                    : "Meet strangers, create and join rooms for text chats and audio/video calls, share files with your friends, and more."
                        }
                        
                    </div>
                    <div className="site-navbar-right" id="for-leave-room-button"></div>
                </div>
                {
                    status.connected
                        ? location === "/"
                            ? <Home />
                            : location === '/meet-stranger'
                                ? <MeetStranger />
                                : meetRoom[0] && meetRoom[1]
                                    ? <Room currentRoomId={meetRoom[1].id} />
                                    : shareFilesRoom[0] && shareFilesRoom[1]
                                        ? <ShareFiles currentRoomId={shareFilesRoom[1].id} />
                                        : <PageNotFound />
                        : (
                            <div className="page-loading-container">
                                <LoadingIcon style={{ height: 180, width: 180 }} />
                            </div>
                        )
                }
            </div>
        </AppContext.Provider>
    );
}

const mapStateToProps = (state) => ({
    status: state.status
});

export default connect(mapStateToProps, { establishConnection })(App);