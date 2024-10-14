
import React, { useState, useRef } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';

function App() {
    const [stationUrl, setStationUrl] = useState(null); // State to store the station URL
    const audioRef = useRef(null); // Reference to the audio element

    async function GetRadioStations() {
        try {
            const response = await fetch(`http://localhost:5085/Test/getRadioStations`);
            const apiUrl = await response.text();

            try {
                const url = new URL(`http://${radio}/json/stations`);
                // url.searchParams.append('hidebroken', 'true');

                const response = await fetch(apiUrl);
                const radioStations = await response.json();
                const randomRadio = radioStations[Math.floor(Math.random() * radioData.length)];
                console.log(randomRadio);
                
                setStationUrl(randomRadio.url_resolved);
                
                if (audioRef.current) {
                    audioRef.current.src = randomRadio.url_resolved;
                    audioRef.current.play();
                }
            } catch (e) {
                console.error('Error fetching radio stations:', e);
            }
        } catch (e) {
            console.error('Error fetching API url:', e);
        }
    }

    return (
        <>
            <div>
                <a href="https://vitejs.dev" target="_blank">
                    <img src={viteLogo} className="logo" alt="Vite logo" />
                </a>
                <a href="https://react.dev" target="_blank">
                    <img src={reactLogo} className="logo react" alt="React logo" />
                </a>
            </div>
            <h1>Vite + React</h1>
            <div className="card">
                <button onClick={GetRadioStations}>Get radio station</button>
            </div>
            <p className="read-the-docs">
                Click on the Vite and React logos to learn more
            </p>
            <audio ref={audioRef} controls style={{ display: 'none' }} />
        </>
    );
}

export default App;
