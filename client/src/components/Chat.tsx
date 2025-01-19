import React, { useState } from 'react';
import LoadingBubble from './LoadingBubble';

interface Message {
  text: string;
  isUser: boolean;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    model: string;
    cost: number;
  };
}

const interpretMarkdown = (text: string): React.ReactNode[] => {
  // Split text into lines while preserving empty lines
  const lines = text.split(/\r?\n/);
  
  // Process each line
  return lines.map((line, index) => {
    // Headers
    if (line.startsWith('# ')) {
      return <h1 key={index} className="text-2xl font-bold">{line.slice(2)}</h1>;
    }
    if (line.startsWith('## ')) {
      return <h2 key={index} className="text-xl font-bold">{line.slice(3)}</h2>;
    }
    if (line.startsWith('### ')) {
      return <h3 key={index} className="text-lg font-bold">{line.slice(4)}</h3>;
    }

    // Process inline markdown (bold and italic)
    let content = line;
    
    // Bold (using **text**)
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic (using *text*)
    content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Convert the processed string to React elements
    if (content.includes('<')) {
      // Use dangerouslySetInnerHTML only for lines that actually have HTML tags
      return <p key={index} dangerouslySetInnerHTML={{ __html: content }} />;
    }

    // Return empty lines as line breaks
    if (content.trim() === '') {
      return <br key={index} />;
    }

    // Return regular text
    return <p key={index}>{content}</p>;
  });
};

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Welcome to Adaptic. Ask anything about your account, market data, or positions, trades, or orders.",
      isUser: false
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage: Message = {
      text: inputText,
      isUser: true,
    };
    setMessages((prev) => [...prev, newMessage]);
    setInputText('');
    setIsLoading(true);

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
      const assistantMessage: Message = {
        text: data.message,
        isUser: false,
        usage: data.usage,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        text: 'Sorry, there was an error processing your request.',
        isUser: false,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/chat/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to reset chat');
      }

      setMessages([]);
      console.log('Chat history reset successfully');
    } catch (error) {
      console.error('Error resetting chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCost = (cost: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(cost);
  };

  return (
    <div className="flex flex-col mb-8">
      <h2 className="text-xl font-medium text-gray-700 mb-4">Chat</h2>
      <div className="flex flex-col h-[500px] bg-gray-50 rounded-lg">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.isUser
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                <div className="whitespace-pre-wrap">
                  {interpretMarkdown(message.text)}
                </div>
                {!message.isUser && message.usage && (
                  <div className="mt-2 text-xs italic text-gray-600">
                    {`${message.usage.prompt_tokens} prompt + ${message.usage.completion_tokens} completion tokens | ${message.usage.model} | ${formatCost(message.usage.cost)}`}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && <LoadingBubble />}
        </div>
        <div className="chat-input-container">
          <form onSubmit={handleSubmit} className="chat-form">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="chat-input"
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="chat-submit"
            >
              Send
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="chat-reset"
              disabled={isLoading || messages.length === 1}
            >
              Reset
            </button>
          </form>
        </div>
      </div>
      <style>
        {`
          .chat-form {
            display: flex;
            gap: 8px;
            width: 100%;
          }

          .chat-input {
            flex: 1;
            padding: 8px 12px;
            border: 1px solid #ccc;
            border-radius: 4px;
            font-size: 14px;
          }

          .chat-submit,
          .chat-reset {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            font-size: 14px;
            cursor: pointer;
            transition: background-color 0.2s;
          }

          .chat-submit {
            background-color: #007bff;
            color: white;
          }

          .chat-reset {
            background-color: #6c757d;
            color: white;
          }

          .chat-submit:hover,
          .chat-reset:hover {
            opacity: 0.9;
          }

          .chat-submit:disabled,
          .chat-reset:disabled {
            background-color: #ccc;
            cursor: not-allowed;
          }
        `}
      </style>
    </div>
  );
};

export default Chat;
