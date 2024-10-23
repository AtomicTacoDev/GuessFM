import React from 'react';

const Keyboard = ({ onKeyPress, guessedLetters, revealedLetters }) => {
    const keysRow1 = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
    const keysRow2 = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'];
    const keysRow3 = ['Z', 'X', 'C', 'V', 'B', 'N', 'M'];
    
    const keyUpEvent = (key) => new KeyboardEvent('keyup', {
        key: key,
        keyCode: key.toUpperCase().charCodeAt(0),
    })
    
    const renderRow = (keys) => (
        <div className="flex justify-center my-2">
            {keys.map(key => (
                <button
                    key={key}
                    onClick={() => document.dispatchEvent(keyUpEvent(key.toLowerCase()))}
                    className={`mx-1 px-4 py-2 rounded-md transition-colors ${revealedLetters.includes(key.toLowerCase()) ? `bg-green-500` : guessedLetters.includes(key.toLowerCase()) ? `bg-gray-800` : `bg-gray-600 hover:bg-gray-500`}`}
                >
                    {key}
                </button>
            ))}
        </div>
    );

    return (
        <div className="flex flex-col items-center mt-4">
            {renderRow(keysRow1)}
            {renderRow(keysRow2)}
            {renderRow(keysRow3)}
        </div>
    );
};

export default Keyboard;