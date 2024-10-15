import React, { useRef, useState } from 'react';
import './App.css';

function App() {
    const audioRef = useRef(null);

    async function GetRandomStationUrl() {
        try {
            const response = await fetch("http://localhost:5085/RadioBrowser/getRandomRadioStationUrl");

            if (response.ok) {
                return (await response.text()).replace(/['"\s]+/g, '');
            } else {
                console.error("Error fetching radio station.");
            }
        } catch (error) {
            console.error("Error fetching the radio station URL:", error);
        }
    }
    
    async function playRadioStation() {
        const radioStationUrl = await GetRandomStationUrl();
        
        console.log(radioStationUrl);
        
        audioRef.current.src = await radioStationUrl;
        audioRef.current.play();
    }

    return (
        <>
            <h1>GuessFM</h1>
            <div className="card">
                <button onClick={playRadioStation}>Play radio station</button>
            </div>
            <audio ref={audioRef} controls style={{ display: 'none' }} />
        </>
    );
}

export default App;
