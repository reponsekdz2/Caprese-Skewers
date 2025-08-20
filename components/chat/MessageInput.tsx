
import React, { useState, useRef } from 'react';
import Button from '../common/Button';
import { SendIcon, PaperclipIcon, CloseIcon } from '../../assets/icons';

interface MessageInputProps {
  onSendMessage: (text: string, file?: File) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage }) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (text.trim() === '' && !file) return;
    onSendMessage(text, file || undefined);
    setText('');
    setFile(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset file input
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      // Validate file size/type here if needed
      const selectedFile = event.target.files[0];
      if (selectedFile.size > 10 * 1024 * 1024) { // Example: 10MB limit
        alert("File is too large. Maximum 10MB allowed."); // Replace with a proper toast notification
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setFile(selectedFile);
    } else {
      setFile(null);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-3 border-t border-secondary-200 dark:border-dark-border bg-white dark:bg-dark-card flex items-start gap-2">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        id="chatAttachment"
        // Consider adding 'accept' attribute for specific file types
        // accept="image/*,application/pdf,.doc,.docx,.txt" 
      />
      <Button 
        type="button" 
        variant="ghost" 
        size="sm" 
        onClick={() => fileInputRef.current?.click()}
        aria-label="Attach file"
        className="p-2.5 self-center"
      >
        <PaperclipIcon className="w-5 h-5 text-secondary-500 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400" />
      </Button>
      <div className="flex-1 flex flex-col">
        <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 p-2.5 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 resize-none text-sm scrollbar-thin scrollbar-thumb-secondary-300 dark:scrollbar-thumb-secondary-500 scrollbar-track-secondary-100 dark:scrollbar-track-secondary-700 bg-white dark:bg-secondary-700 text-secondary-900 dark:text-dark-text placeholder-secondary-400 dark:placeholder-secondary-500"
            style={{ maxHeight: '120px' }} 
        />
        {file && (
            <div className="text-xs text-secondary-600 dark:text-secondary-300 mt-1.5 p-1.5 bg-secondary-100 dark:bg-secondary-600 rounded flex items-center justify-between">
              <span className="truncate" title={file.name}>
                <PaperclipIcon className="w-3 h-3 inline mr-1" /> 
                {file.name.length > 30 ? file.name.substring(0,27) + '...' : file.name} ({ (file.size / 1024).toFixed(1) } KB)
              </span>
              <button type="button" onClick={clearFile} className="ml-2 text-red-500 hover:text-red-700 p-0.5 rounded-full hover:bg-red-100 dark:hover:bg-red-700 dark:hover:bg-opacity-30" aria-label="Remove attached file">
                <CloseIcon className="w-3 h-3"/>
              </button>
            </div>
        )}
      </div>
      <Button type="submit" variant="primary" size="sm" className="p-2.5 self-center" aria-label="Send message" disabled={text.trim() === '' && !file}>
        <SendIcon className="w-5 h-5" />
      </Button>
    </form>
  );
};

export default MessageInput;
