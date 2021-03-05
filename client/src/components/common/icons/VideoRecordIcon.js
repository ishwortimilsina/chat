export default function VideoRecordIcon({ tooltip, ...otherProps }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...otherProps}>
            { tooltip ? <title>{tooltip}</title> : null }
            <path fill="none" d="M0 0h24v24H0z"/>
            <path d="M13 6V4H5V2h10v4h1a1 1 0 0 1 1 1v2.2l5.213-3.65a.5.5 0 0 1 .787.41v12.08a.5.5 0 0 1-.787.41L17 14.8V19a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h11zm-8 4v2h2v-2H5z"/>
        </svg>
    );
}