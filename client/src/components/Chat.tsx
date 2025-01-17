import React, { useState } from 'react';

interface Message {
  text: string;
  isUser: boolean;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // Add user message
    const userMessage: Message = {
      text: inputText,
      isUser: true,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputText }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();

      // Add server response
      const serverMessage: Message = {
        text: data.response,
        isUser: false,
      };
      setMessages((prev) => [...prev, serverMessage]);
    } catch (error) {
      console.error('Error:', error);
      // Add error message
      const errorMessage: Message = {
        text: 'Error: Could not get response from server',
        isUser: false,
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-medium text-gray-700 mb-4">Chat</h2>
      <div className="flex flex-col h-[400px] bg-gray-100 rounded-lg p-4 mb-4">
        <div className="flex-1 overflow-y-auto mb-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} mb-2`}>
              <div
                className={`max-w-[75%] p-3 rounded-lg ${
                  message.isUser ? 'bg-blue-500 text-white ml-auto' : 'bg-white text-gray-800 mr-auto'
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 p-2 border border-gray-300 rounded"
            placeholder="Type your message..."
          />
          <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
