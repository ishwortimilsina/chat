import { useState } from "react";
import { Link } from "wouter";
import DoorOpenIcon from "../common/icons/DoorOpenIcon";
import FileTransferIcon from "../common/icons/FileTransferIcon";
import FilmIcon from "../common/icons/FilmIcon";
import HomeIcon from "../common/icons/HomeIcon";
import SpyIcon from "../common/icons/SpyIcon";
import VideoRecordIcon from "../common/icons/VideoRecordIcon";
import CreateRoom from "../Room/CreateRoom";
import JoinRoom from "../Room/JoinRoom";

import './Landing.css';

export default function Home(props) {
    const [ selectedMenu, selectMenu ] = useState('');

    return (
        <div className="landing-page">
            <div className="landing-home">
                <div className="home-menu-container">
                    {
                        selectedMenu === 'create-room' ? <CreateRoom roomType="meet" goBack={() => selectMenu('')} />
                        : selectedMenu === 'join-room' ? <JoinRoom goBack={() => selectMenu('')} />
                        : selectedMenu === 'share-files' ? <CreateRoom roomType="share-files" goBack={() => selectMenu('')} />
                        : (
                            <>
                                <div className="home-menu-item" onClick={() => selectMenu('create-room')}>
                                    <HomeIcon className="home-menu-icon" tooltip="Create Room" />
                                    <div className="home-menu-item-text">Create Room</div>
                                </div>
                                <div className="home-menu-item" onClick={() => selectMenu('join-room')}>
                                    <DoorOpenIcon className="home-menu-icon" tooltip="Join Room" />
                                    <div className="home-menu-item-text">Join Room</div>
                                </div>
                                <Link className="home-menu-item" href="/meet-stranger">
                                    <SpyIcon className="home-menu-icon" tooltip="Meet Random People" />
                                    <div className="home-menu-item-text">Meet Stranger</div>
                                </Link>
                                <div className="home-menu-item" onClick={() => selectMenu('share-files')}>
                                    <FileTransferIcon className="home-menu-icon" tooltip="Transfer Files" />
                                    <div className="home-menu-item-text">Share Files</div>
                                </div>
                                <div className="home-menu-item disable">
                                    <VideoRecordIcon className="home-menu-icon" tooltip="Record Video" />
                                    <div className="home-menu-item-text">Record Video</div>
                                </div>
                                <div className="home-menu-item disable">
                                    <FilmIcon className="home-menu-icon" tooltip="Watch Along Videos" />
                                    <div className="home-menu-item-text">Watch Along</div>
                                </div>
                            </>
                        )
                    }
                </div>
            </div>
        </div>
    );
}