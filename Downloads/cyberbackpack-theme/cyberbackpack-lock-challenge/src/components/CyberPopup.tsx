import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, ShieldAlert, Truck, Trophy } from 'lucide-react';
import { GameState } from '../types';
import { getConfig } from '../config';
import { CountdownTimer } from './CountdownTimer';
import { CyberLock } from './CyberLock';

const config = getConfig();

const IntroView = ({ onStart }: { onStart: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="flex flex-col items-center text-center px-4 w-full"
  >
    <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mb-8 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
      <Lock className="w-8 h-8 text-red-500" />
    </div>
    <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 tracking-tight uppercase">
      {config.headingLine1}
      <br />
      <span className="text-red-500">{config.headingLine2}</span>
    </h2>
    <p className="text-zinc-400 text-lg mb-8 max-w-[260px]">{config.challengeText}</p>

    <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 mb-8 w-full max-w-[280px] flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
        <Lock className="w-4 h-4 text-red-500" />
      </div>
      <div className="text-left">
        <p className="text-white font-bold text-sm tracking-wide">HACKER CHALLENGE</p>
        <p className="text-red-400 text-sm">You have {config.timerSeconds} seconds.</p>
      </div>
    </div>

    <button
      onClick={onStart}
      className="w-full max-w-[280px] bg-gradient-to-b from-red-600 to-red-800 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all active:scale-[0.98] border border-red-500/50 tracking-wider"
    >
      {config.ctaStart}
    </button>
  </motion.div>
);

const GameView = ({
  state,
  onTimeout,
  onUnlock,
  onValuesChange,
}: {
  state: 'playing' | 'checking';
  onTimeout: () => void;
  onUnlock: () => void;
  onValuesChange: (digits: [number, number, number]) => void;
}) => {
  const isChecking = state === 'checking';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center w-full"
    >
      <div className="mb-6 text-center">
        <h3 className="text-sm font-bold text-red-500 tracking-widest uppercase mb-2 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
          {isChecking ? 'BREACHING SYSTEM...' : 'TIME LEFT'}
        </h3>
        <CountdownTimer
          isPlaying={state === 'playing'}
          onZero={onTimeout}
          initialSeconds={config.timerSeconds}
        />
      </div>

      <CyberLock disabled={isChecking} isChecking={isChecking} onValuesChange={onValuesChange} />

      <p className="text-xs text-zinc-500 mt-6 mb-6 flex items-center gap-2">
        <span className="w-4 h-4 rounded-full border border-zinc-600 flex items-center justify-center text-[8px] font-bold">
          i
        </span>
        Swipe up or down to change numbers
      </p>

      <button
        onClick={onUnlock}
        disabled={isChecking}
        className={`w-full max-w-[280px] font-bold py-4 rounded-xl transition-all active:scale-[0.98] border tracking-wider ${
          isChecking
            ? 'bg-zinc-900 text-zinc-500 border-zinc-800 cursor-not-allowed'
            : 'bg-white text-black hover:bg-zinc-200 border-white shadow-[0_0_30px_rgba(255,255,255,0.1)]'
        }`}
      >
        {isChecking ? 'CHECKING...' : 'UNLOCK'}
      </button>
    </motion.div>
  );
};

const GrantedView = ({ onClaim }: { onClaim: () => void }) => (
  <motion.div
    initial={{ opacity: 0, scale: 1.1 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0 }}
    className="flex flex-col items-center justify-center h-full min-h-[300px] w-full"
  >
    <div className="w-28 h-28 rounded-full bg-green-950/50 border border-green-500/50 flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(34,197,94,0.4)] relative">
      <motion.div
        className="absolute inset-0 rounded-full border border-green-500"
        animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <Trophy className="w-12 h-12 text-green-500" />
    </div>
    <h2 className="text-4xl sm:text-5xl font-black text-green-500 tracking-tight uppercase drop-shadow-[0_0_15px_rgba(34,197,94,0.5)] mb-4 text-center">
      ACCESS
      <br />
      GRANTED
    </h2>
    <p className="text-zinc-400 text-center text-lg max-w-[240px] mb-4">
      You cracked it! You unlocked
    </p>
    <h3 className="text-3xl font-black text-white mb-8 tracking-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
      {config.winRewardText}
    </h3>
    <button
      onClick={onClaim}
      className="w-full max-w-[280px] bg-gradient-to-b from-green-600 to-green-800 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all active:scale-[0.98] border border-green-500/50 tracking-wider"
    >
      {config.ctaClaim}
    </button>
  </motion.div>
);

const DeniedView = () => (
  <motion.div
    initial={{ opacity: 0, scale: 1.1 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0 }}
    className="flex flex-col items-center justify-center h-full min-h-[300px] w-full"
  >
    <motion.div
      animate={{ x: [-8, 8, -6, 6, -4, 4, 0], transition: { duration: 0.5, ease: 'easeInOut' } }}
      className="flex flex-col items-center"
    >
      <div className="w-28 h-28 rounded-full bg-red-950/50 border border-red-500/50 flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(239,68,68,0.4)] relative">
        <motion.div
          className="absolute inset-0 rounded-full border border-red-500"
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <ShieldAlert className="w-12 h-12 text-red-500" />
      </div>
      <h2 className="text-4xl sm:text-5xl font-black text-red-500 tracking-tight uppercase drop-shadow-[0_0_15px_rgba(239,68,68,0.5)] mb-4 text-center">
        ACCESS
        <br />
        DENIED
      </h2>
      <p className="text-zinc-400 text-center text-lg max-w-[240px]">
        Nice try, hacker. The lock is stronger than you.
      </p>
    </motion.div>
  </motion.div>
);

const RewardView = ({ onClaim }: { onClaim: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center text-center px-4 w-full"
  >
    <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(255,255,255,0.05)]">
      <Truck className="w-10 h-10 text-white" />
    </div>
    <p className="text-zinc-400 text-sm tracking-widest uppercase mb-2">But you did unlock</p>
    <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 tracking-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
      {config.loseRewardText}
    </h2>
    <div className="h-[1px] w-12 bg-zinc-800 mb-6" />
    <button
      onClick={onClaim}
      className="w-full max-w-[280px] bg-gradient-to-b from-red-600 to-red-800 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all active:scale-[0.98] border border-red-500/50 tracking-wider"
    >
      {config.ctaClaim}
    </button>
  </motion.div>
);

export const CyberPopup = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [gameState, setGameState] = useState<GameState>('intro');
  const currentDigits = useRef<[number, number, number]>([0, 0, 0]);

  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => setGameState('intro'), 500);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const handleUnlock = () => {
    setGameState('checking');

    setTimeout(() => {
      const [d0, d1, d2] = currentDigits.current;
      const [w0, w1, w2] = config.winCombo;

      const won = String(d0) === w0 && String(d1) === w1 && String(d2) === w2;

      if (won) {
        setGameState('granted');
      } else {
        setGameState('denied');
        setTimeout(() => setGameState('reward'), 1200);
      }
    }, 1400);
  };

  const handleClaim = () => {
    if (window._klOnsite && config.klaviyoFormId) {
      window._klOnsite.push(['openForm', config.klaviyoFormId]);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-[420px] bg-[#0a0a0a] border border-zinc-800/80 rounded-[2rem] shadow-[0_0_80px_rgba(0,0,0,1)] overflow-hidden flex flex-col items-center"
        style={{
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 20px 60px -10px rgba(0,0,0,1)',
        }}
      >
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-full transition-all"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="pt-8 pb-2 flex justify-center w-full z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white text-black flex items-center justify-center rounded-lg rotate-45 border border-zinc-700 shadow-inner">
              <div className="w-4 h-4 border-2 border-black -rotate-45" />
            </div>
            <span className="text-white font-medium tracking-[0.2em] text-sm uppercase">
              CYBERBACKPACK
            </span>
          </div>
        </div>

        <div className="w-full relative min-h-[500px] flex items-center justify-center p-6">
          <AnimatePresence mode="wait">
            {gameState === 'intro' && <IntroView key="intro" onStart={() => setGameState('playing')} />}

            {(gameState === 'playing' || gameState === 'checking') && (
              <GameView
                key="game"
                state={gameState}
                onTimeout={handleUnlock}
                onUnlock={handleUnlock}
                onValuesChange={(digits) => { currentDigits.current = digits; }}
              />
            )}

            {gameState === 'granted' && <GrantedView key="granted" onClaim={handleClaim} />}

            {gameState === 'denied' && <DeniedView key="denied" />}

            {gameState === 'reward' && <RewardView key="reward" onClaim={handleClaim} />}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
