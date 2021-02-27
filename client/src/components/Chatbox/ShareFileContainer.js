import { connect } from 'react-redux';

import { leaveFileSharing, endFileSharing, acceptShareFile, rejectShareFile, requestShareFile } from '../../store/actions';
import EndCallIcon from '../common/icons/EndCallIcon';
import FileDownloadIcon from '../common/icons/FileDownloadIcon';
import FileUploadIcon from '../common/icons/FileUploadIcon';
import ThumbDownIcon from '../common/icons/ThumbDownIcon';
import ThumbUpIcon from '../common/icons/ThumbUpIcon';
import CallNotifier from './CallNotifier';
import ShareFileOngoing from './ShareFileOngoing';

function ShareFileContainer({ shareFile, requestShareFile, rejectShareFile, acceptShareFile, selectContact, currUserId }) {
    return (
        <div className="share-file-container">
            <CallNotifier>
            {
                shareFile.shareRequested ? (
                    <>
                        <FileUploadIcon className="outgoing-call" />
                        Requesting <span style={{fontWeight: "bold"}}>{shareFile.otherUser}</span> to accept the file.
                        <div className="end-call-button" onClick={() => {
                            endFileSharing();
                            leaveFileSharing(shareFile.otherUser, currUserId);
                        }}>
                            <EndCallIcon style={{ height: 30, width: 30 }} />
                        </div>
                    </>
                ) : shareFile.incomingRequest ? (
                    <>
                        <FileDownloadIcon className="incoming-call" />
                        <span style={{fontWeight: "bold"}}>{shareFile.otherUser}</span> wants to share a file with you.
                        <div className="accept-reject-buttons-container">
                            <div 
                                className="accept-call-button"
                                onClick={() => {
                                    acceptShareFile(shareFile.otherUser, currUserId);
                                    selectContact(shareFile.otherUser);
                                }}
                                title="Accept Request"
                            >
                                <ThumbUpIcon style={{ height: 30, width: 30, color: 'green' }} />
                            </div>
                            <div
                                className="end-call-button"
                                onClick={() => rejectShareFile(shareFile.otherUser, currUserId)}
                                title="Reject Request"
                            >
                                <ThumbDownIcon style={{ height: 30, width: 30, color: 'red' }} />
                            </div>
                        </div>
                    </>
                ) : shareFile.acceptedRequest ? (
                    <span>Connecting...</span>
                ) : (
                    <ShareFileOngoing
                        currUserId={currUserId}
                        requestShareFile={requestShareFile}
                        endFileSharing={endFileSharing}
                        shareFile={shareFile}
                    />
                )
            }
            </CallNotifier>
        </div>
    );
}

export default connect(null, { requestShareFile, acceptShareFile, rejectShareFile })(ShareFileContainer);