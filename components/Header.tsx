'use client';

import { Settings, Trash2, Download, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  onToggleSettings: () => void;
  onClearChat: () => void;
  onExportChat: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function Header({
  onToggleSettings,
  onClearChat,
  onExportChat,
  isDarkMode,
  onToggleDarkMode
}: HeaderProps) {
  return (
    <div className="flex justify-between items-center p-4 border-b bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm">
      <h1 className="text-xl font-bold dark:text-white bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">RAG Chatbot</h1>
      <div className="flex items-center space-x-2">
        <button
          onClick={onToggleSettings}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          aria-label="Toggle settings"
        >
          <Settings className="w-5 h-5 dark:text-white" />
        </button>
        <button
          onClick={onClearChat}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          aria-label="Clear chat"
        >
          <Trash2 className="w-5 h-5 dark:text-white" />
        </button>
        <button
          onClick={onExportChat}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          aria-label="Export chat"
        >
          <Download className="w-5 h-5 dark:text-white" />
        </button>
        <button
          onClick={onToggleDarkMode}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-white" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
} 