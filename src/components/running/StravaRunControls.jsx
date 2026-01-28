import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function StravaRunControls({ status, onStart, onPause, onResume, onStop }) {
  const handleButtonPress = (callback) => {
    // Haptic feedback if supported
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    callback();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div className="h-32 bg-gradient-to-t from-gray-950 via-gray-950/95 to-transparent backdrop-blur-lg pointer-events-auto">
        <div className="flex items-center justify-center h-full px-6">
          <AnimatePresence mode="wait">
            {/* IDLE MODE - Single Start Button */}
            {status === 'IDLE' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center gap-3"
              >
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleButtonPress(onStart)}
                  className="w-[88px] h-[88px] rounded-full bg-[#BFFF00] flex items-center justify-center shadow-2xl shadow-[#BFFF00]/50"
                  style={{ boxShadow: '0 0 30px rgba(191, 255, 0, 0.4)' }}
                >
                  <Play className="w-10 h-10 text-gray-950 ml-1" fill="#030712" />
                </motion.button>
                <span className="text-[#BFFF00] text-sm font-semibold uppercase tracking-wider">
                  START
                </span>
              </motion.div>
            )}

            {/* RUNNING MODE - Pause & Finish */}
            {status === 'RUNNING' && (
              <motion.div
                key="running"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="flex items-center gap-8"
              >
                {/* Pause Button */}
                <motion.div className="flex flex-col items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleButtonPress(onPause)}
                    className="w-16 h-16 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center shadow-lg transition-colors"
                  >
                    <Pause className="w-6 h-6 text-white" />
                  </motion.button>
                  <span className="text-gray-400 text-xs uppercase tracking-wider">
                    Pause
                  </span>
                </motion.div>

                {/* Finish Button with Confirm Dialog */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <motion.div className="flex flex-col items-center gap-2">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="w-[72px] h-[72px] rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-xl shadow-red-600/50 transition-colors"
                      >
                        <Square className="w-7 h-7 text-white" fill="white" />
                      </motion.button>
                      <span className="text-red-400 text-xs uppercase tracking-wider">
                        Finish
                      </span>
                    </motion.div>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-gray-900 border-gray-800">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">Finish Run?</AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-400">
                        Are you sure you want to finish this run? Your progress will be saved.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={onStop}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Finish Run
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </motion.div>
            )}

            {/* PAUSED MODE - Resume & Finish */}
            {status === 'PAUSED' && (
              <motion.div
                key="paused"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="flex items-center gap-8"
              >
                {/* Resume Button */}
                <motion.div className="flex flex-col items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleButtonPress(onResume)}
                    className="w-16 h-16 rounded-full bg-[#BFFF00] hover:bg-[#a8e600] flex items-center justify-center shadow-lg transition-colors"
                    style={{ boxShadow: '0 0 20px rgba(191, 255, 0, 0.3)' }}
                  >
                    <Play className="w-6 h-6 text-gray-950 ml-0.5" fill="#030712" />
                  </motion.button>
                  <span className="text-[#BFFF00] text-xs uppercase tracking-wider">
                    Resume
                  </span>
                </motion.div>

                {/* Finish Button with Confirm Dialog */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <motion.div className="flex flex-col items-center gap-2">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="w-[72px] h-[72px] rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-xl shadow-red-600/50 transition-colors"
                      >
                        <Square className="w-7 h-7 text-white" fill="white" />
                      </motion.button>
                      <span className="text-red-400 text-xs uppercase tracking-wider">
                        Finish
                      </span>
                    </motion.div>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-gray-900 border-gray-800">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">Finish Run?</AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-400">
                        Are you sure you want to finish this run? Your progress will be saved.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={onStop}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Finish Run
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}