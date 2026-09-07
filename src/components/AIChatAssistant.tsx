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
    { id: 1, text: "你好！我是睿造AI助手。我可以帮你查找信息科技课件、了解原创周边、以及解答创作工具使用问题。请问有什么可以帮你的？（例如：课件资源、IP周边、创作工具等）", sender: 'ai' }
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

      if (input.includes("教育") || input.includes("学校") || input.includes("学生") || input.includes("课件") || input.includes("课程")) {
        aiResponse = "针对教育场景，我推荐你前往 /resources 课件资源页！那里有涵盖小学到高中全套信息科技课件包，包括创意设计、编程项目等丰富教学资源。";
      } else if (input.includes("周边") || input.includes("ip") || input.includes("文创") || input.includes("产品")) {
        aiResponse = "关于原创IP周边，你可以在 /products 页面查看睿造小睿等原创IP形象和周边产品。每款设计都融入了独特的创意灵感哦！";
      } else if (input.includes("工具") || input.includes("创作") || input.includes("参数") || input.includes("计算")) {
        aiResponse = "创作工具箱在 /advice 页面！那里有素材切片参数参考、创意成本计算器、模板素材库等实用工具，帮助你高效创作。";
      } else if (input.includes("素材") || input.includes("模板")) {
        aiResponse = "创作素材和模板可以在 /advice 创作工具箱中找到，包括创意设计模板、编程项目模板等多种资源。";
      } else if (input.includes("社群") || input.includes("活动")) {
        aiResponse = "想加入科创社群或了解活动，可以点击联系页面加入我们的创作者社群，定期举办线上线下创意活动！";
      } else {
        aiResponse = "听起来很有意思！你可以试试问我关于课件资源、原创周边、创作工具使用或社群活动的问题哦！";
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
        className="fixed bottom-8 right-8 z-[100] w-16 h-16 rounded-full bg-gradient-to-br from-[#0071e3] to-[#00c6ff] text-white shadow-2xl flex items-center justify-center shimmer-border avatar-ring badge-pulse"
      >
        <Sparkles className="w-8 h-8 relative z-10" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-28 right-8 z-[101] w-[400px] h-[600px] bg-white rounded-[2.5rem] shadow-3xl flex flex-col overflow-hidden border border-[#d2d2d7]/30 shimmer-card group"
          >
            {/* Header */}
            <div className="p-6 bg-[#f5f5f7] border-b border-[#d2d2d7]/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0071e3] flex items-center justify-center text-white">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1d1d1f]">睿造AI助手预览</h3>
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
                  placeholder="询问课件/工具使用..."
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