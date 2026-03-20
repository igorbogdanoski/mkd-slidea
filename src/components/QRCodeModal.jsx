import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const QRCodeModal = ({ isOpen, onClose, eventCode }) => {
  const [copied, setCopied] = React.useState(false);
  const joinUrl = `${window.location.origin}/event/${eventCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white rounded-[3rem] p-10 max-w-sm w-full shadow-2xl text-center"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-2xl font-black mb-2">Приклучи се</h3>
            <p className="text-slate-500 mb-8 font-medium">Скенирајте го кодот за да влезете во настанот</p>

            <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-slate-100 mb-8 inline-block mx-auto">
              <QRCodeSVG 
                value={joinUrl} 
                size={200}
                level="H"
                includeMargin={false}
                fgColor="#1E293B"
              />
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between border border-slate-100">
                <span className="font-mono font-bold text-indigo-600 text-lg">#{eventCode}</span>
                <button 
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Копирано' : 'Копирај линк'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default QRCodeModal;
