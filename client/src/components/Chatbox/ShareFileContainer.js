import { connect } from 'react-redux';

import { leaveFileSharing, endFileSharing, acceptShareFile, rejectShareFile } from '../../store/actions';
import EndCallIcon from '../common/icons/EndCallIcon';
import FileDownloadIcon from '../common/icons/FileDownloadIcon';
import FileUploadIcon from '../common/icons/FileUploadIcon';
import ThumbDownIcon from '../common/icons/ThumbDownIcon';
import ThumbUpIcon from '../common/icons/ThumbUpIcon';
import CallNotifier from './CallNotifier';
import ShareFileOngoing from './ShareFileOngoing';

function ShareFileContainer({ shareFile, rejectShareFile, acceptShareFile, selectContact, currUserId }) {
    return (
        <div className="share-file-container">
            {
                shareFile.shareRequested ? (
                    <CallNotifier>
                        <FileUploadIcon className="outgoing-call" />
                        Requesting <span style={{fontWeight: "bold"}}>{shareFile.otherUser}</span> to accept file.
                        <div className="end-call-button" onClick={() => {
                            endFileSharing();
                            leaveFileSharing(shareFile.otherUser, currUserId);
                        }}>
                            <EndCallIcon style={{ height: 30, width: 30 }} />
                        </div>
                    </CallNotifier>
                ) : shareFile.incomingRequest ? (
                    <CallNotifier>
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
                    </CallNotifier>
                ) : shareFile.acceptedRequest 
                    ? <span>Connecting...</span>
                    : <ShareFileOngoing currUserId={currUserId} endFileSharing={endFileSharing} shareFile={shareFile} />
            }
        </div>
    );
}

export default connect(null, { acceptShareFile, rejectShareFile })(ShareFileContainer);