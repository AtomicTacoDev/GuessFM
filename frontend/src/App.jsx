import React, {useRef} from 'react';
import './App.css';

function App() {
    const broadcastUrl = useRef(null);
    const hashedCountry = useRef(null);
    
    async function playRadioStation() {
        try {
            const response = await fetch("http://localhost:5085/RadioBrowser/getRandomRadioStationUrl");

            if (response.ok) {
                const data = await response.json();

                hashedCountry.current = data["hashedCountry"];
                broadcastUrl.current.src = data["broadcastUrl"].replace(/['"\s]+/g, '');
                broadcastUrl.current.play()
            } else {
                console.error("Error fetching radio station.");
            }
        } catch (error) {
            console.error("Error fetching the radio station URL:", error);
        }
    }

    return (
        <>
            <h1>GuessFM</h1>
            <div className="card">
                <button onClick={playRadioStation}>Play radio station</button>
            </div>
            <audio ref={broadcastUrl} controls style={{ display: 'none' }} />
        </>
    );
}

export default App;
