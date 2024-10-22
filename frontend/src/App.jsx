import React, {useCallback, useEffect, useRef, useState} from 'react';
import AudioMotionAnalyzer from 'audiomotion-analyzer';
import './App.css';

function CountryNameLetter({ isLastLetterOfWord }) {
    return (
        <div className={`aspect-square size-12 flex justify-center items-center outline outline-2 outline-gray-600 ${isLastLetterOfWord ? `mr-6` : `mr-2`}`}>
            
        </div>
    );
}

function App() {
    const broadcastUrl = useRef(null);
    const hashedCountry = useRef(null);
    const wordLengths = useRef(null);
    const visualizer = useRef(null);
    const [isGameStarted, setIsGameStarted] = useState(false);

    const onKeyPress = useCallback((event) => {
        console.log(event.keyCode);
    }, []);

    async function startGame() {
        try {
            const response = await fetch("http://localhost:5085/RadioBrowser/getGameData");

            if (response.ok) {
                const data = await response.json();

                hashedCountry.current = data["hashedCountry"];
                broadcastUrl.current.src = data["broadcastUrl"].replace(/['"\s]+/g, '');
                wordLengths.current = data["wordLengths"];
                
                broadcastUrl.current.oncanplay = () => {
                    broadcastUrl.current.play().catch((error) => {
                        console.error("Error playing audio:", error);
                    });
                    setIsGameStarted(true);
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
        if (isGameStarted) document.addEventListener('keydown', onKeyPress);
        
        return () => {
            document.removeEventListener('keydown', onKeyPress);
        }
    }, [isGameStarted]);

    return (
        <>
            <div ref={visualizer} style={{width: '100%', height: '500px'}}/>
            {!isGameStarted && <button onClick={startGame} className="m-3">Start</button>}
            {isGameStarted && (
                <div className="flex justify-center items-center">
                    {wordLengths.current.map((length, wordIndex) => (
                        Array.from({ length }).map((_, letterIndex) => (
                            <CountryNameLetter key={`${wordIndex}-${letterIndex}`} isLastLetterOfWord={letterIndex === length - 1} />
                        ))
                    ))}
                </div>
            )}
            <audio id="audio" ref={broadcastUrl} controls crossOrigin="anonymous" style={{display: 'none'}} />
        </>
    );
}

export default App;
