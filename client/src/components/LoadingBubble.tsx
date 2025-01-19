import React, { useState, useEffect } from 'react';

const loadingMessages = [
  "Requesting data",
  "Performing analysis",
  "Computing technicals",
  "Synthesizing response",
  "Building trade theory",
  "Calling trading API",
];

const LoadingBubble: React.FC = () => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prevIndex) => 
        (prevIndex + 1) % loadingMessages.length
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-start">
      <div className="max-w-[70%] rounded-lg p-3 bg-gray-200 text-gray-800">
        <div className="flex items-center">
          <span className="italic">{loadingMessages[currentMessageIndex]}</span>
          <span className="loading-dots ml-1">...</span>
        </div>
      </div>
      <style>
        {`
          @keyframes loadingDots {
            0%, 20% {
              content: ".";
            }
            40%, 60% {
              content: "..";
            }
            80%, 100% {
              content: "...";
            }
          }

          .loading-dots::after {
            content: "...";
            animation: loadingDots 1.5s infinite;
            display: inline-block;
            width: 1em;
          }
        `}
      </style>
    </div>
  );
};

export default LoadingBubble;
