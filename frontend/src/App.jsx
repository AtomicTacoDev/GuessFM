import React, {useCallback, useEffect, useRef, useState} from 'react';
import AudioMotionAnalyzer from 'audiomotion-analyzer';
import './App.css';

function App() {
    const broadcastUrl = useRef(null);
    const hashedCountry = useRef(null);
    const visualizer = useRef(null);
    const [isGameStarted, setIsGameStarted] = useState(false);

    const onKeyPress = useCallback((event) => {
        console.log(event.keyCode);
    }, []);

    async function startGame() {
        setIsGameStarted(true);

        try {
            const response = await fetch("http://localhost:5085/RadioBrowser/getRandomRadioStationUrl");

            if (response.ok) {
                const data = await response.json();

                hashedCountry.current = data["hashedCountry"];
                broadcastUrl.current.src = data["broadcastUrl"].replace(/['"\s]+/g, '');

                broadcastUrl.current.oncanplay = () => {
                    broadcastUrl.current.play().catch((error) => {
                        console.error("Error playing audio:", error);
                    });
                };
            } else {
                console.error("Error fetching radio station.");
            }
        } catch (error) {
            console.error("Error fetching the radio station URL:", error);
        }
    }
    
    useEffect(() => {
        if (visualizer.current && broadcastUrl.current && isGameStarted) {
            const analyzer = new AudioMotionAnalyzer(visualizer.current, {
                source: document.getElementById("audio"),
                mode: 3,
                overlay: true,
                showBgColor: true,
                bgAlpha: 0,
                alphaBars: true,
                colorMode: "gradient",
                gradient: "classic",
                radial: true,
                showPeaks: false,
                showScaleX: false,
                showScaleY: false,
                weightingFilter: "B",
                onCanvasDraw: instance => {
                    instance.radius = 0.5 + instance.getEnergy();
                }
            });


            return () => {
                analyzer.destroy();
            };
        }
    }, [isGameStarted]);
    
    useEffect(() => {
        document.addEventListener('keydown', onKeyPress);
        
        return () => {
            document.removeEventListener('keydown', onKeyPress);
        }
    }, [isGameStarted, onKeyPress]);

    return (
        <>
            <h1>GuessFM</h1>
            <div ref={visualizer} style={{width: '100%', height: '300px'}}/>
            {!isGameStarted && (
                <div className="card">
                    <button onClick={startGame}>Start</button>
                </div>
            )}
            <audio id="audio" ref={broadcastUrl} controls crossOrigin="anonymous" style={{display: 'none'}} />
        </>
    );
}

export default App;
