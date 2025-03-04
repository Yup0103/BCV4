import { useEffect } from 'react'
import MainLayout from './components/MainLayout'
import './App.css'

function App() {
  // Apply dark theme
  useEffect(() => {
    // Set dark theme CSS variables
    document.documentElement.style.setProperty('--primary-color', '#9C27B0');
    document.documentElement.style.setProperty('--primary-color-dark', '#7B1FA2');
    document.documentElement.style.setProperty('--primary-color-light', '#CE93D8');
    document.documentElement.style.setProperty('--highlight-color', '#FF9800');
    document.documentElement.style.setProperty('--text-primary', '#FFFFFF');
    document.documentElement.style.setProperty('--text-secondary', '#BBBBBB');
    document.documentElement.style.setProperty('--text-muted', '#888888');
    document.documentElement.style.setProperty('--background-dark', '#121212');
    document.documentElement.style.setProperty('--background-light', '#1E1E1E');
    document.documentElement.style.setProperty('--border-radius-sm', '4px');
    document.documentElement.style.setProperty('--border-radius-md', '8px');
    document.documentElement.style.setProperty('--border-radius-lg', '12px');
    document.documentElement.style.setProperty('--error-color', '#F44336');
    
    document.body.classList.add('dark-theme');
    return () => {
      document.body.classList.remove('dark-theme');
    };
  }, []);

  return (
    <div className="app">
      <MainLayout />
    </div>
  )
}

export default App
