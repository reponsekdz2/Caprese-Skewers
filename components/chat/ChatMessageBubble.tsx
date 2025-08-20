
import React from 'react';
import { ChatMessage, User } from '../../types';
import { CheckCircleIcon, PaperclipIcon, DownloadIcon, CheckDoubleIcon } from '../../assets/icons'; 

interface ChatMessageBubbleProps {
  message: ChatMessage;
  currentUser: User;
}

const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message, currentUser }) => {
  const isSender = message.senderId === currentUser.id;

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <div className={`flex mb-1.5 ${isSender ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-end gap-2 ${isSender ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isSender && message.senderAvatar && (
            <img src={message.senderAvatar} alt={message.senderName} className="w-6 h-6 rounded-full self-end mb-0.5" />
        )}
        {!isSender && !message.senderAvatar && (
            <span className="w-6 h-6 rounded-full bg-secondary-300 dark:bg-secondary-600 flex items-center justify-center text-xs font-semibold text-secondary-700 dark:text-secondary-200 self-end mb-0.5">
                {message.senderName?.charAt(0).toUpperCase()}
            </span>
        )}
        <div className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl px-3 py-2 rounded-lg shadow-md ${
          isSender 
          ? 'bg-primary-500 dark:bg-primary-600 text-white rounded-br-none' 
          : 'bg-white dark:bg-dark-card text-secondary-800 dark:text-dark-text border border-secondary-200 dark:border-dark-border rounded-bl-none'
        }`}>
          {!isSender && message.senderName && (
            <p className="text-xs font-semibold mb-0.5" style={{ color: isSender ? 'rgba(255,255,255,0.8)' : 'rgb(59 130 246)' /* Tailwind primary-500 */}}>
              {message.senderName}
            </p>
          )}
          
          {message.fileName && (
            <div 
              className={`flex items-center text-sm mb-1 p-2 rounded-md border ${isSender ? 'border-primary-400 dark:border-primary-500 bg-primary-400 bg-opacity-30 dark:bg-primary-500 dark:bg-opacity-30' : 'border-secondary-300 dark:border-secondary-600 bg-secondary-100 dark:bg-secondary-700'}`}
            >
              <PaperclipIcon className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate flex-grow" title={message.fileName}>{message.fileName}</span>
              {message.fileUrl && (
                <a 
                  href={message.fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  title={`Download ${message.fileName}`}
                  className="ml-2 p-1 hover:bg-opacity-50 rounded-full"
                  style={{backgroundColor: isSender ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}}
                >
                  <DownloadIcon className="w-4 h-4"/>
                </a>
              )}
            </div>
          )}

          {message.text && <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>}
          
          <div className={`text-xs mt-1 flex items-center ${isSender ? 'text-primary-100 dark:text-primary-300 justify-end' : 'text-secondary-400 dark:text-secondary-500 justify-start'}`}>
            <span>{formatTimestamp(message.timestamp)}</span>
            {isSender && message.status === 'read' && <CheckDoubleIcon className="w-3.5 h-3.5 ml-1 text-blue-300 dark:text-blue-400" />}
            {isSender && message.status === 'delivered' && <CheckDoubleIcon className="w-3.5 h-3.5 ml-1 text-gray-300 dark:text-gray-400" />}
            {isSender && message.status === 'sent' && <CheckCircleIcon className="w-3 h-3 ml-1 text-gray-300 dark:text-gray-400 opacity-70" />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessageBubble;
