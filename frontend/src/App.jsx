import React, {useCallback, useEffect, useRef, useState} from 'react';
import AudioMotionAnalyzer from 'audiomotion-analyzer';
import Keyboard from "@/Keyboard.jsx";
import './App.css';
import { BACKEND_URL } from "@/constants.js";

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
    const endMessage = useRef("");
    const [guessedLetters, setGuessedLetters] = useState([]);
    const [revealedLetters, setRevealedLetters] = useState({});
    const [isStartingGame, setIsStartingGame] = useState(false);
    const [isGameStarted, setIsGameStarted] = useState(false);
    
    const onKeyPress = useCallback((event) => {
        if (event.keyCode < 65 || event.keyCode > 90) return;
        if (guessedLetters.includes(event.key)) return;
        
        guessLetter(event.key).then(() => {
            setGuessedLetters(prev => [...prev, event.key]);
        });
    }, []);

    async function guessLetter(letter) {
        try {
            const response = await fetch(`${BACKEND_URL}/RadioBrowser/guessLetter`, {
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
        setIsStartingGame(true);
        
        try {
            const response = await fetch(`${BACKEND_URL}/RadioBrowser/getGameData`);

            if (response.ok) {
                const data = await response.json();

                broadcastUrl.current.src = data["broadcastUrl"].replace(/['"\s]+/g, '');
                answer.current = data["answer"];
                wordLengths.current = data["wordLengths"];
                
                broadcastUrl.current.oncanplay = async () => {
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

                    broadcastUrl.current.play().then(() => {
                        setIsGameStarted(true);
                        setIsStartingGame(false);
                    });
                };
            }
        } catch (error) {
            console.error("Error fetching the radio station URL:", error);
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
        wordLengths.current = [];
        setGuessedLetters([]);
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
            {!isGameStarted && !isStartingGame && <div>{endMessage.current}</div>}
            {!isGameStarted && isStartingGame && <div>Starting game...</div>}
            {!isGameStarted && !isStartingGame && <button onClick={startGame} className="m-3">Start</button>}
            {isGameStarted && (
                <div className="flex flex-col items-center text-2xl">
                    <div className="flex justify-center items-center">
                        {wordLengths.current.map((length, wordIndex) => {
                            const previousWordsLength = wordLengths.current.slice(0, wordIndex).reduce((accumulator, current) => accumulator + current, 0);
                            return Array.from({length}).map((_, letterIndex) => (
                                <CountryNameLetter
                                    key={`${wordIndex}-${letterIndex}`}
                                    letter={revealedLetters[previousWordsLength + letterIndex] === undefined ? '' : revealedLetters[previousWordsLength + letterIndex].toUpperCase()}
                                    isLastLetterOfWord={letterIndex === length - 1}
                                />
                            ));
                        })}
                    </div>
                    <Keyboard onKeyPress={onKeyPress} guessedLetters={guessedLetters} revealedLetters={Object.values(revealedLetters)}/>
                </div>
            )}
            <audio id="audio" ref={broadcastUrl} controls crossOrigin="anonymous" style={{display: 'none'}} onError={startGame}/>
        </>
    );
}

export default App;
