import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AnimatePresence } from 'motion/react';
import { getConfig } from './config';
import { CyberPopup } from './components/CyberPopup';
import App from './App';
import './index.css';

const config = getConfig();
const productionRoot = document.getElementById('cyberlock-root');

if (productionRoot) {
  // Production: running inside Shopify theme
  const shouldSkip =
    (config.homeOnly && config.currentPage !== 'index') ||
    (config.visitorsOnly && config.isLoggedIn) ||
    (config.showOnce && localStorage.getItem('cyberlock_shown') === '1');

  if (!shouldSkip) {
    const PopupWrapper = () => {
      const [isOpen, setIsOpen] = useState(true);
      const handleClose = () => {
        if (config.showOnce) {
          localStorage.setItem('cyberlock_shown', '1');
        }
        setIsOpen(false);
      };
      return (
        <AnimatePresence>
          {isOpen && <CyberPopup isOpen={isOpen} onClose={handleClose} />}
        </AnimatePresence>
      );
    };

    setTimeout(() => {
      createRoot(productionRoot).render(
        <StrictMode>
          <PopupWrapper />
        </StrictMode>
      );
    }, config.delay * 1000);
  }
} else {
  // Dev: standalone demo via index.html → <div id="root">
  const devRoot = document.getElementById('root');
  if (devRoot) {
    createRoot(devRoot).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  }
}
