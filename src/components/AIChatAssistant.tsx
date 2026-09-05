import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Bot, User, Sparkles } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  sender: 'ai' | 'user';
}

const AIChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "你好！我是睿造打印工坊的智能选购助手。我可以根据你的需求推荐最适合的 3D 打印机。请问你主要打算用来做什么？（例如：教育方案、手办制作、工业原型等）", sender: 'ai' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: Date.now(),
      text: inputText,
      sender: 'user'
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Mock AI response logic
    setTimeout(() => {
      let aiResponse = "";
      const input = userMsg.text.toLowerCase();

      if (input.includes("教育") || input.includes("学校") || input.includes("学生")) {
        aiResponse = "针对教育场景，我强烈推荐拓竹 (Bambu Lab) 的 A1 mini。它操作极其简单，拥有全自动校准功能，而且安全性很高，非常适合中小学信息科技课堂。";
      } else if (input.includes("手办") || input.includes("模型") || input.includes("精度")) {
        aiResponse = "如果你追求极致的表面精度，光固化打印机是首选。纵维立方 (Anycubic) 的 Photon Mono M5s 拥有 12K 分辨率，能够呈现极其细腻的纹理。";
      } else if (input.includes("工业") || input.includes("原型") || input.includes("强度") || input.includes("碳纤维")) {
        aiResponse = "工业原型或高强度零件推荐使用拓竹 X1-Carbon 或 创想 K1C。它们都支持碳纤维材料，且具备极高的打印速度和结构强度。";
      } else if (input.includes("速度") || input.includes("快")) {
        aiResponse = "如果你追求极致的打印速度，闪铸 (Flashforge) 的 Adventurer 5M Pro 拥有高达 600mm/s 的速度，是目前的竞速标杆。";
      } else if (input.includes("预算") || input.includes("便宜") || input.includes("性价比")) {
        aiResponse = "性价比方面，A1 mini (¥1,599) 是入门的首选。如果你需要封闭机箱，创想 K1C 在 3000 元价位段表现非常出色。";
      } else {
        aiResponse = "听起来很有意思！为了给出更精准的建议，你能告诉我你的具体使用场景（如教育、模型制作）或者你的预算范围吗？";
      }

      const aiMsg: Message = {
        id: Date.now() + 1,
        text: aiResponse,
        sender: 'ai'
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-[100] w-16 h-16 rounded-full bg-gradient-to-br from-[#0071e3] to-[#00c6ff] text-white shadow-2xl flex items-center justify-center"
      >
        <Sparkles className="w-8 h-8" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-28 right-8 z-[101] w-[400px] h-[600px] bg-white rounded-[2.5rem] shadow-3xl flex flex-col overflow-hidden border border-[#d2d2d7]/30"
          >
            {/* Header */}
            <div className="p-6 bg-[#f5f5f7] border-b border-[#d2d2d7]/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0071e3] flex items-center justify-center text-white">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1d1d1f]">选购助手预览</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#28cd41] animate-pulse" />
                    <span className="text-[10px] font-medium text-[#86868b] uppercase tracking-wider">在线帮助</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-[#d2d2d7]/30 transition-colors"
              >
                <X className="w-5 h-5 text-[#86868b]" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map(msg => (
                <motion.div
                  initial={{ opacity: 0, x: msg.sender === 'ai' ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={msg.id}
                  className={`flex ${msg.sender === 'ai' ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[80%] p-4 rounded-2xl ${
                    msg.sender === 'ai' 
                      ? 'bg-[#f5f5f7] text-[#1d1d1f] rounded-tl-none' 
                      : 'bg-[#0071e3] text-white rounded-tr-none shadow-md'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-[#f5f5f7] p-4 rounded-2xl rounded-tl-none flex gap-1">
                    <span className="w-1.5 h-1.5 bg-[#86868b] rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-[#86868b] rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-[#86868b] rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-6 bg-white border-t border-[#d2d2d7]/30">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="询问选购建议..."
                  className="w-full pl-6 pr-14 py-4 bg-[#f5f5f7] rounded-full text-sm border-none focus:ring-2 focus:ring-[#0071e3]/20 transition-all outline-none"
                />
                <button
                  onClick={handleSend}
                  className="absolute right-2 w-10 h-10 rounded-full bg-[#0071e3] text-white flex items-center justify-center hover:bg-[#0077ed] transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[10px] text-center text-[#86868b] mt-4">
                预览版本：AI 逻辑目前仅为模拟演示，暂未接入真实 API
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatAssistant;