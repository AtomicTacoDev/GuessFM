import React, {useCallback, useEffect, useRef, useState} from 'react';
import AudioMotionAnalyzer from 'audiomotion-analyzer';
import './App.css';

function CountryNameLetter({ letter, isLastLetterOfWord }) {
    return (
        <div className={`aspect-square size-12 flex justify-center items-center outline outline-2 outline-gray-600 ${isLastLetterOfWord ? `mr-6` : `mr-2`}`}>
            { letter !== null ? letter : "" }
        </div>
    );
}

function App() {
    const broadcastUrl = useRef(null);
    const visualizerContainer = useRef(null);
    const analyzer = useRef(null);
    const answer = useRef(null);
    const wordLengths = useRef([]);
    const guessedLetters = useRef([]);
    const endMessage = useRef("");
    const [revealedLetters, setRevealedLetters] = useState({});
    const [isGameStarted, setIsGameStarted] = useState(false);
    
    const onKeyPress = useCallback((event) => {
        if (event.keyCode < 65 || event.keyCode > 90) return;
        if (guessedLetters.current.includes(event.key)) return;
        
        guessLetter(event.key).then(_ => guessedLetters.current.push(event.key));
    }, []);

    async function guessLetter(letter) {
        try {
            const response = await fetch(`http://localhost:5085/RadioBrowser/guessLetter`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    answer: answer.current,
                    letter: letter
                }),
            });
            
            if (!response.ok) {
                console.error("Error checking guess.");
            }
            
            const indexes = await response.json();
            if (indexes.length > 0) {
                for (let i = 0; i <= indexes.length; i++) {
                    if (indexes[i] === undefined) continue;
                    
                    setRevealedLetters((prevRevealedLetters) => {
                        const newRevealedLetters = { ...prevRevealedLetters };
                        
                        indexes.forEach(_ => {
                            newRevealedLetters[indexes[i]] = letter;
                        });

                        return newRevealedLetters;
                    });
                }
            }
        } catch (error) {
            console.log("Error requesting guess validation:", error);
        }
    }
    
    async function startGame() {
        try {
            const response = await fetch("http://localhost:5085/RadioBrowser/getGameData");

            if (response.ok) {
                const data = await response.json();

                broadcastUrl.current.src = data["broadcastUrl"].replace(/['"\s]+/g, '');
                answer.current = data["answer"];
                wordLengths.current = data["wordLengths"];
                
                broadcastUrl.current.oncanplay = () => {
                    analyzer.current = new AudioMotionAnalyzer(visualizerContainer.current, {
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

                    broadcastUrl.current.play().then(_ => setIsGameStarted(true)).catch((error) => {
                        console.error("Error playing audio:", error);
                        setIsGameStarted(false);
                    });
                };
            } else {
                console.error("Error fetching radio station.");
                setIsGameStarted(false);
            }
        } catch (error) {
            console.error("Error fetching the radio station URL:", error);
            setIsGameStarted(false);
        }
    }

    function endGame() {
        endMessage.current = "You won! The country was " + answer.current;
        setIsGameStarted(false);
        if (broadcastUrl.current) {
            broadcastUrl.current.pause();
        }
        if (analyzer.current) {
            analyzer.current.destroy();
        }
        answer.current = null;
        guessedLetters.current = [];
        wordLengths.current = [];
        setRevealedLetters({});
    }
    
    useEffect(() => {
        if (isGameStarted) document.addEventListener('keyup', onKeyPress);
        
        return () => {
            document.removeEventListener('keyup', onKeyPress);
        }
    }, [isGameStarted]);

    useEffect(() => {
        if (!isGameStarted) return;
        
        if (Object.keys(revealedLetters).length === wordLengths.current.reduce((accumulator, current) => accumulator + current)) {
            endGame();
        }
    }, [revealedLetters]);

    return (
        <>
            <div ref={visualizerContainer} style={{width: '100%', height: '500px'}}/>
            {!isGameStarted && <div>{endMessage.current}</div>}
            {!isGameStarted && <button onClick={startGame} className="m-3">Start</button>}
            {isGameStarted && (
                <div className="flex justify-center items-center text-2xl">
                    {wordLengths.current.map((length, wordIndex) => {
                        const previousWordsLength = wordLengths.current.slice(0, wordIndex).reduce((accumulator, current) => accumulator + current, 0);

                        return Array.from({ length }).map((_, letterIndex) => (
                            <CountryNameLetter
                                key={`${wordIndex}-${letterIndex}`}
                                letter={revealedLetters[previousWordsLength + letterIndex] === undefined ? '' : revealedLetters[previousWordsLength + letterIndex].toUpperCase()}
                                isLastLetterOfWord={letterIndex === length - 1}
                            />
                        ));
                    })}
                </div>
            )}
            <audio id="audio" ref={broadcastUrl} controls crossOrigin="anonymous" style={{display: 'none'}} />
        </>
    );
}

export default App;
