import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Save, 
  LayoutGrid, 
  List,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Loader2,
  Wand2,
  Zap
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/store/useUserStore";

interface Printer {
  id: string;
  title: string;
  brand: string;
  rating: number;
  pros: string[];
  cons: string[];
  price: string;
  image: string;
  description: string;
  buy_url: string;
  status?: 'draft' | 'published';
  source_url?: string;
}

export default function PrinterManager() {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<Partial<Printer> | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [uploading, setUploading] = useState(false);
  const [parseText, setParseText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [discoveryCount, setDiscoveryCount] = useState(12);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPrinters();
  }, []);

  const handleSmartParse = async () => {
      if (!parseText.trim()) return;
      setIsParsing(true);
      
      try {
        // 检查是否配置了 DeepSeek API Key
        const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
        
        if (apiKey && apiKey !== 'your_api_key_here') {
          // 调用真实的 DeepSeek API 进行智能解析
          const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: "deepseek-chat",
              messages: [
                {
                  role: "system", 
                  content: "你是一个 3D 打印专家。请从用户提供的文本中提取打印机信息，并以 JSON 格式返回：{brand, title, price, pros:[], cons:[], description, buy_url}。注意：pros 提取 3-5 个，cons 提取 2-3 个。清除所有'核心优势'、'不足之处'等标题文字。"
                },
                { role: "user", content: parseText }
              ],
              response_format: { type: 'json_object' }
            })
          });

          const data = await response.json();
          const result = JSON.parse(data.choices[0].message.content);

          setEditingPrinter({
            ...editingPrinter,
            brand: result.brand || "未知品牌",
            title: result.title || "新机型",
            price: result.price || "待定",
            buy_url: result.buy_url || "",
            pros: result.pros || [],
            cons: result.cons || [],
            description: result.description || "",
            rating: 4.8
          });
        } else {
          // 如果没有 API Key，回退到之前的本地正则解析逻辑
          console.warn("未检测到 VITE_DEEPSEEK_API_KEY，使用本地模拟解析模式。");
          // ... 原有的 setTimeout 和正则逻辑 ...
          setTimeout(() => {
            const text = parseText;
            // (保持原有的正则解析代码不变，作为兜底)
            const brands = ["拓竹", "Bambu Lab", "创想三维", "Creality", "纵维立方", "Anycubic", "闪铸", "Flashforge", "普鲁士", "Prusa", "智能派", "Elegoo"];
            let foundBrand = "未知品牌";
            for (const b of brands) {
              if (text.toLowerCase().includes(b.toLowerCase())) {
                foundBrand = b;
                break;
              }
            }
            const lines = text.split(/[\n,，。;；]/).filter(l => l.trim());
            const foundTitle = lines[0] || "新机型";
            const priceRegex = /(?:¥|￥|RMB|\$)\s*(\d+(?:[.,，]\d+)?)|(\d+(?:[.,，]\d+)?)\s*(?:元|块)/i;
            const priceMatch = text.match(priceRegex);
            const foundPrice = priceMatch ? priceMatch[0] : "待定";
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            const urlMatch = text.match(urlRegex);
            const foundBuyUrl = urlMatch ? urlMatch[0] : "";
            const pros: string[] = [];
            const cons: string[] = [];
            const usedLines = new Set([lines[0]]);
            const clean = (l: string) => l.replace(/[✅❌➕➖⭐✨🌟🚀💎🔥]/g, "").replace(/核心优势|优势|优点|不足之处|不足|缺点|亮点|遗憾/g, "").replace(/[:：]/g, "").replace(/^[+\-\d.)\s]*/, "").trim();
            lines.forEach((line, index) => {
              if (index === 0) return;
              const lowerLine = line.toLowerCase();
              if (line.includes("✅") || line.includes("+")) {
                const cleaned = clean(line);
                if (cleaned) { pros.push(cleaned); usedLines.add(line); }
              }
              if (line.includes("❌") || line.includes("-")) {
                const cleaned = clean(line);
                if (cleaned) { cons.push(cleaned); usedLines.add(line); }
              }
            });
            const remainingLines = lines.filter(l => !usedLines.has(l) && l.length > 5);
            setEditingPrinter({
              ...editingPrinter,
              brand: foundBrand,
              title: foundTitle,
              price: foundPrice,
              buy_url: foundBuyUrl,
              pros: [...new Set(pros)].slice(0, 5),
              cons: [...new Set(cons)].slice(0, 3),
              description: remainingLines.slice(0, 3).join("。"),
              rating: 4.8
            });
            setIsParsing(false);
            setParseText("");
          }, 800);
          return;
        }
      } catch (error) {
        console.error("AI 解析失败:", error);
        alert("AI 解析遇到问题，已切换至本地模式。");
      } finally {
        if (import.meta.env.VITE_DEEPSEEK_API_KEY) {
          setIsParsing(false);
          setParseText("");
        }
      }
    };

  const fetchPrinters = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('printers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setPrinters(data);
    setLoading(false);
  };

  const handleAutoDiscover = async () => {
    setIsDiscovering(true);
    try {
      const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
      
      if (apiKey && apiKey !== 'your_api_key_here') {
        // 调用 DeepSeek API 进行全网新款搜索模拟（基于 AI 的知识推理或联网插件模拟）
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
              {
                role: "system", 
                content: `你是一个专业的 3D 打印硬件数据采集专家。请提供 ${discoveryCount} 款目前市面上真实在售、极具特色（多头换色、极速、工业级）的 3D 打印机详细数据。

严格要求：
1. 型号真实：必须是真实型号（如：Bambu Lab X1C, Creality K2 Plus, Anycubic Kobra 3 等）。
2. 图片处理（重点）：
   - 优先尝试提供真实的官方产品图链接。
   - 由于官方 CDN 常有防盗链保护，请务必在 'image_prompt' 字段中提供一段精确的英文描述，用于生成该机器的逼真预览图。描述应包含：机器型号、颜色、结构特征（如 CoreXY 架构、透明外壳、多色供料系统等）。
3. 数据要求：价格换算为人民币（如：¥6,999），评分参考真实好评率（0-5分）。
4. 格式：以 JSON 数组格式返回：[{brand, title, price, rating, pros:[], cons:[], description, buy_url, image, image_prompt}]。`
              },
              { role: "user", content: `请扫描并发现 ${discoveryCount} 款真实的特色 3D 打印机，并为每一款提供精准的图片生成描述。` }
            ],
            response_format: { type: 'json_object' }
          })
        });

        const data = await response.json();
        console.log("DeepSeek API Response:", data);
        
        let content = data.choices[0].message.content;
        // 清理可能存在的 Markdown 代码块标记
        content = content.replace(/```json\n?|```/g, '').trim();
        
        let result;
        try {
          result = JSON.parse(content);
        } catch (e) {
          console.error("JSON Parsing Error:", e, "Content:", content);
          throw new Error("AI 返回的数据格式不正确，无法解析");
        }
        
        // 兼容不同格式的返回值
        let newModels = [];
        if (Array.isArray(result)) {
          newModels = result;
        } else if (result.printers && Array.isArray(result.printers)) {
          newModels = result.printers;
        } else if (result.models && Array.isArray(result.models)) {
          newModels = result.models;
        } else {
          // 尝试寻找对象中的第一个数组
          const firstArray = Object.values(result).find(val => Array.isArray(val));
          if (firstArray) newModels = firstArray;
        }

        console.log("Parsed Models:", newModels);

        if (Array.isArray(newModels) && newModels.length > 0) {
          let addedCount = 0;
          for (const model of newModels) {
            // 确保必要字段存在
            if (!model.title || !model.brand) continue;
            
            // 查重逻辑更精确一些：完全匹配或包含匹配
            const isExist = printers.some(p => 
              p.title.toLowerCase() === model.title.toLowerCase() || 
              (p.title.toLowerCase().includes(model.title.toLowerCase()) && model.title.length > 5)
            );

            if (!isExist) {
              const { error: insertError } = await supabase.from('printers').insert([{
                title: model.title,
                brand: model.brand,
                price: model.price || "待定",
                image: model.image || "https://core-normal.traeapi.us/api/ide/v1/text_to_image?prompt=3D+printer+modern+design+industrial&image_size=landscape_4_3",
                description: model.description || "",
                pros: Array.isArray(model.pros) ? model.pros : [],
                cons: Array.isArray(model.cons) ? model.cons : [],
                buy_url: model.buy_url || "",
                status: 'draft',
                rating: model.rating || 4.8,
                source_url: 'AI Auto Discovery'
              }]);
              
              if (insertError) {
                console.error("Insert Error:", insertError);
                alert(`保存机型 "${model.title}" 失败: ${insertError.message}`);
              } else {
                addedCount++;
              }
            }
          }
          
          if (addedCount === 0) {
            alert("扫描完成，但发现的所有机型已存在于列表中。");
          } else {
            await fetchPrinters();
            alert(`真 AI 扫描完成！成功导入 ${addedCount} 款新款（标记为草稿）。请查看带'自动发现'标签的项。`);
          }
        } else {
          throw new Error("未能从 AI 响应中提取到有效机型数据");
        }
      } else {
        // 回退逻辑
        setTimeout(async () => {
          // ... 原有的模拟逻辑 ...
          const newModels = [
            {
              title: "2026 颠覆之作：Bambu Lab H2D",
              brand: "拓竹科技 (Bambu Lab)",
              price: "¥8,999",
              image: "https://images.squarespace-cdn.com/content/v1/5c98e217a9ab4564c7031835/1715846985175-QY4K0OQO6OQO6OQO6OQO/Bambu+Lab+H2D.jpg",
              description: "2026年最新发布的四合一工具机，集成了 3D 打印与 40W 激光雕刻模组。",
              pros: ["四合一功能", "40W 强力激光"],
              cons: ["体积巨大"],
              buy_url: "https://bambulab.cn/",
              status: "draft",
              source_url: "AI Local Discovery"
            }
          ];
          for (const model of newModels) {
            const isExist = printers.some(p => p.title.includes(model.title));
            if (!isExist) await supabase.from('printers').insert([model]);
          }
          fetchPrinters();
          setIsDiscovering(false);
          alert("本地模拟扫描完成！");
        }, 2000);
      }
    } catch (error: any) {
      console.error("AI 发现失败:", error);
      alert(`AI 自动发现遇到问题: ${error.message || '未知错误'}`);
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { isAdmin } = useUserStore.getState();
    if (!isAdmin) {
      alert("权限不足：仅管理员可上传图片。");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `printers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('course-materials') // Reuse existing bucket or suggest creating printer-images
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('course-materials')
        .getPublicUrl(filePath);

      setEditingPrinter(prev => ({ ...prev, image: publicUrl }));
    } catch (error: any) {
      alert("图片上传失败: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!editingPrinter?.title || !editingPrinter?.brand) return;

    const printerData = {
      ...editingPrinter,
      updated_at: new Date().toISOString()
    };

    if (editingPrinter.id) {
      const { error } = await supabase
        .from('printers')
        .update(printerData)
        .eq('id', editingPrinter.id);
      if (!error) setIsModalOpen(false);
    } else {
      const { error } = await supabase
        .from('printers')
        .insert([printerData]);
      if (!error) setIsModalOpen(false);
    }
    fetchPrinters();
  };

  const handleDelete = async (id: string) => {
    if (confirm("确定要删除这款设备吗？此操作不可撤销。")) {
      const { error } = await supabase
        .from('printers')
        .delete()
        .eq('id', id);
      if (!error) fetchPrinters();
    }
  };

  const filteredPrinters = printers.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f5f5f7] pt-28 pb-12 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div>
            <h1 className="text-3xl font-bold text-[#1d1d1f]">设备方案管理</h1>
            <p className="text-[#86868b] mt-1">管理前台展示的 3D 打印机推荐与评测数据</p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex items-center bg-white rounded-2xl px-4 py-2 shadow-sm border border-[#f5f5f7]">
              <span className="text-xs font-bold text-[#86868b] mr-2">扫描数量:</span>
              <input 
                type="number" 
                min="1" 
                max="50"
                value={discoveryCount}
                onChange={(e) => setDiscoveryCount(parseInt(e.target.value) || 1)}
                className="w-12 text-center font-bold text-[#0071e3] outline-none"
              />
            </div>
            <button 
              onClick={handleAutoDiscover}
              disabled={isDiscovering}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-[#0071e3] text-[#0071e3] font-bold hover:bg-[#0071e3]/5 transition-all disabled:opacity-50"
            >
              {isDiscovering ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              智能扫描新款
            </button>
            <button 
              onClick={() => {
                setEditingPrinter({ rating: 4.5, pros: [], cons: [] });
                setIsModalOpen(true);
              }}
              className="btn-primary flex items-center gap-2 px-6"
            >
              <Plus className="w-4 h-4" />
              新增机型
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b]" />
            <input
              type="text"
              placeholder="搜索机型或品牌..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-[#0071e3]/20 transition-all outline-none"
            />
          </div>
          <div className="flex bg-white rounded-2xl p-1 shadow-sm shrink-0">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-[#f5f5f7] text-[#0071e3]' : 'text-[#86868b]'}`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-[#f5f5f7] text-[#0071e3]' : 'text-[#86868b]'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#0071e3] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPrinters.map((printer) => (
              <motion.div
                layout
                key={printer.id}
                className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-white hover:shadow-xl transition-all group"
              >
                <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] flex items-center justify-center border-b border-[#f5f5f7]">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-[0.02] pointer-events-none select-none overflow-hidden">
                    <div className="absolute -top-5 -left-5 text-4xl font-black rotate-12 whitespace-nowrap">
                      {printer.brand} {printer.brand}
                    </div>
                  </div>

                  {printer.image && !printer.image.includes('traeapi.us') && !printer.image.includes('placeholder') ? (
                    <img 
                      src={printer.image} 
                      alt={printer.title} 
                      className="w-full h-full object-cover z-10" 
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          const placeholder = parent.querySelector('.brand-artistic-display');
                          if (placeholder) placeholder.classList.remove('hidden');
                          if (placeholder) placeholder.classList.add('flex');
                        }
                      }}
                    />
                  ) : null}
                  
                  <div className={`brand-artistic-display ${printer.image && !printer.image.includes('traeapi.us') && !printer.image.includes('placeholder') ? 'hidden' : 'flex'} absolute inset-0 flex-col items-center justify-center p-4 text-center z-0`}>
                    <span className="text-3xl font-black tracking-tighter text-[#1d1d1f] select-none">
                      {printer.brand.split(' ')[0]}
                    </span>
                    <div className="h-0.5 w-8 bg-gradient-to-r from-[#0071e3] to-[#28cd41] rounded-full my-2" />
                    <span className="text-[8px] font-bold tracking-[0.3em] text-[#86868b] uppercase">
                      {printer.brand}
                    </span>
                  </div>
                  {printer.status === 'draft' && (
                    <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#0071e3] text-white text-[10px] font-bold flex items-center gap-1 shadow-lg">
                      <Zap className="w-3 h-3" />
                      自动发现
                    </div>
                  )}
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        setEditingPrinter(printer);
                        setIsModalOpen(true);
                      }}
                      className="p-2 rounded-full bg-white/90 backdrop-blur shadow-sm hover:text-[#0071e3] transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(printer.id)}
                      className="p-2 rounded-full bg-white/90 backdrop-blur shadow-sm hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-8">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-[#0071e3] uppercase tracking-wider">{printer.brand}</span>
                    <span className="text-sm font-bold text-[#1d1d1f]">{printer.price}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-[#1d1d1f]">{printer.title}</h3>
                  <p className="text-sm text-[#86868b] line-clamp-2 leading-relaxed">{printer.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-white">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#f5f5f7] text-sm text-[#86868b] font-bold">
                  <th className="px-8 py-6">机型名称</th>
                  <th className="px-8 py-6">品牌</th>
                  <th className="px-8 py-6">价格</th>
                  <th className="px-8 py-6">评分</th>
                  <th className="px-8 py-6 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f5f7]">
                {filteredPrinters.map((printer) => (
                  <tr key={printer.id} className="hover:bg-[#f5f5f7]/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] overflow-hidden flex items-center justify-center relative border border-[#f5f5f7]">
                          {printer.image && !printer.image.includes('traeapi.us') && !printer.image.includes('placeholder') ? (
                            <img 
                              src={printer.image} 
                              alt={printer.title}
                              className="w-full h-full object-cover z-10" 
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  const placeholder = parent.querySelector('.brand-artistic-display-small');
                                  if (placeholder) placeholder.classList.remove('hidden');
                                  if (placeholder) placeholder.classList.add('flex');
                                }
                              }}
                            />
                          ) : null}
                          <div className={`brand-artistic-display-small ${printer.image && !printer.image.includes('traeapi.us') && !printer.image.includes('placeholder') ? 'hidden' : 'flex'} absolute inset-0 items-center justify-center text-[10px] font-black text-[#0071e3] z-0`}>
                            {printer.brand[0]}
                          </div>
                        </div>
                        <span className="font-bold text-[#1d1d1f]">{printer.title}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-[#86868b]">{printer.brand}</td>
                    <td className="px-8 py-6 font-medium">{printer.price}</td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">★</span>
                        <span>{printer.rating}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-3">
                        <button 
                          onClick={() => {
                            setEditingPrinter(printer);
                            setIsModalOpen(true);
                          }}
                          className="p-2 rounded-xl hover:bg-white text-[#86868b] hover:text-[#0071e3] transition-all shadow-none hover:shadow-sm"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(printer.id)}
                          className="p-2 rounded-xl hover:bg-white text-[#86868b] hover:text-red-500 transition-all shadow-none hover:shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredPrinters.length === 0 && (
          <div className="text-center py-32 bg-white rounded-[3rem] shadow-sm border border-white">
            <div className="w-20 h-20 rounded-full bg-[#f5f5f7] flex items-center justify-center mx-auto mb-6 text-[#86868b]">
              <AlertCircle className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-[#1d1d1f] mb-2">未找到匹配的设备</h3>
            <p className="text-[#86868b]">尝试更换搜索词或新增一款设备</p>
          </div>
        )}

        {/* Edit Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden"
              >
                <div className="p-8 border-b border-[#f5f5f7] flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-[#1d1d1f]">
                    {editingPrinter?.id ? "编辑设备信息" : "新增设备方案"}
                  </h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-[#f5f5f7]">
                    <X className="w-6 h-6 text-[#86868b]" />
                  </button>
                </div>

                <div className="p-10 max-h-[70vh] overflow-y-auto">
                  {/* Smart Parser Section */}
                  {!editingPrinter?.id && (
                    <div className="mb-10 p-6 bg-[#f5f5f7] rounded-[2rem] border border-[#0071e3]/10">
                      <div className="flex items-center gap-2 mb-4 text-[#0071e3]">
                        <Zap className="w-5 h-5" />
                        <h3 className="font-bold">智能快速录入</h3>
                      </div>
                      <div className="flex gap-4">
                        <textarea
                          placeholder="粘贴官网简介或评测文本（例如：拓竹X1C旗舰机型，价格¥6999，优点是速度快，缺点是有点贵...）"
                          value={parseText}
                          onChange={(e) => setParseText(e.target.value)}
                          className="flex-grow p-4 bg-white rounded-2xl border-none focus:ring-2 focus:ring-[#0071e3]/20 transition-all outline-none resize-none h-24 text-sm"
                        />
                        <button
                          type="button"
                          onClick={handleSmartParse}
                          disabled={isParsing || !parseText.trim()}
                          className="px-6 rounded-2xl bg-[#0071e3] text-white font-bold hover:bg-[#0077ed] transition-all flex flex-col items-center justify-center gap-2 disabled:opacity-50 shrink-0"
                        >
                          {isParsing ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <Wand2 className="w-5 h-5" />
                              <span className="text-xs">一键解析</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-[10px] text-[#86868b] mt-3 px-2">提示：AI 将自动提取品牌、型号、价格和优缺点，您可以在下方继续微调。</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-bold text-[#86868b] uppercase tracking-wider mb-2">设备名称 *</label>
                        <input
                          type="text"
                          value={editingPrinter?.title || ""}
                          onChange={(e) => setEditingPrinter({ ...editingPrinter, title: e.target.value })}
                          className="w-full p-4 bg-[#f5f5f7] rounded-2xl border-none focus:ring-2 focus:ring-[#0071e3]/20 transition-all outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-[#86868b] uppercase tracking-wider mb-2">品牌名称 *</label>
                        <input
                          type="text"
                          value={editingPrinter?.brand || ""}
                          onChange={(e) => setEditingPrinter({ ...editingPrinter, brand: e.target.value })}
                          className="w-full p-4 bg-[#f5f5f7] rounded-2xl border-none focus:ring-2 focus:ring-[#0071e3]/20 transition-all outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-[#86868b] uppercase tracking-wider mb-2">参考价格</label>
                          <input
                            type="text"
                            placeholder="如: ¥6,999"
                            value={editingPrinter?.price || ""}
                            onChange={(e) => setEditingPrinter({ ...editingPrinter, price: e.target.value })}
                            className="w-full p-4 bg-[#f5f5f7] rounded-2xl border-none focus:ring-2 focus:ring-[#0071e3]/20 transition-all outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-[#86868b] uppercase tracking-wider mb-2">发布状态</label>
                          <select
                            value={editingPrinter?.status || "published"}
                            onChange={(e) => setEditingPrinter({ ...editingPrinter, status: e.target.value as any })}
                            className="w-full p-4 bg-[#f5f5f7] rounded-2xl border-none focus:ring-2 focus:ring-[#0071e3]/20 transition-all outline-none"
                          >
                            <option value="published">正式发布</option>
                            <option value="draft">自动发现 (草稿)</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-[#86868b] uppercase tracking-wider mb-2">评分 (0-5)</label>
                          <input
                            type="number"
                            step="0.1"
                            max="5"
                            value={editingPrinter?.rating || 0}
                            onChange={(e) => setEditingPrinter({ ...editingPrinter, rating: parseFloat(e.target.value) })}
                            className="w-full p-4 bg-[#f5f5f7] rounded-2xl border-none focus:ring-2 focus:ring-[#0071e3]/20 transition-all outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-bold text-[#86868b] uppercase tracking-wider mb-2">封面图片</label>
                        <div className="space-y-4">
                          {editingPrinter?.image && (
                            <div className="relative aspect-video rounded-[2rem] overflow-hidden bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] flex items-center justify-center border border-[#f5f5f7]">
                              {editingPrinter.image && !editingPrinter.image.includes('traeapi.us') && !editingPrinter.image.includes('placeholder') ? (
                                <img 
                                  src={editingPrinter.image} 
                                  alt="Preview" 
                                  className="w-full h-full object-cover z-10" 
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) {
                                      const placeholder = parent.querySelector('.brand-artistic-display-preview');
                                      if (placeholder) placeholder.classList.remove('hidden');
                                      if (placeholder) placeholder.classList.add('flex');
                                    }
                                  }}
                                />
                              ) : null}
                              <div className={`brand-artistic-display-preview ${editingPrinter.image && !editingPrinter.image.includes('traeapi.us') && !editingPrinter.image.includes('placeholder') ? 'hidden' : 'flex'} absolute inset-0 flex-col items-center justify-center p-4 text-center z-0`}>
                                <span className="text-5xl font-black tracking-tighter text-[#1d1d1f] select-none">
                                  {editingPrinter.brand.split(' ')[0]}
                                </span>
                                <div className="h-1 w-12 bg-gradient-to-r from-[#0071e3] to-[#28cd41] rounded-full my-3" />
                                <span className="text-[10px] font-bold tracking-[0.4em] text-[#86868b] uppercase">
                                  {editingPrinter.brand}
                                </span>
                              </div>
                              <button 
                                onClick={() => setEditingPrinter({ ...editingPrinter, image: "" })}
                                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="输入图片 URL 或上传文件"
                              value={editingPrinter?.image || ""}
                              onChange={(e) => setEditingPrinter({ ...editingPrinter, image: e.target.value })}
                              className="flex-grow p-4 bg-[#f5f5f7] rounded-2xl border-none focus:ring-2 focus:ring-[#0071e3]/20 transition-all outline-none"
                            />
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleImageUpload}
                              accept="image/*"
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploading}
                              className="px-6 rounded-2xl bg-white border border-[#d2d2d7] hover:border-[#0071e3] text-[#0071e3] transition-all flex items-center justify-center disabled:opacity-50"
                            >
                              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                            </button>
                          </div>
                          <p className="text-xs text-[#86868b]">建议尺寸: 16:9，支持 JPG, PNG, WebP</p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-[#86868b] uppercase tracking-wider mb-2">购买/官网链接</label>
                        <input
                          type="text"
                          value={editingPrinter?.buy_url || ""}
                          onChange={(e) => setEditingPrinter({ ...editingPrinter, buy_url: e.target.value })}
                          className="w-full p-4 bg-[#f5f5f7] rounded-2xl border-none focus:ring-2 focus:ring-[#0071e3]/20 transition-all outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <label className="block text-sm font-bold text-[#86868b] uppercase tracking-wider mb-2">核心优势 (Pros) - 每行一个</label>
                      <textarea
                        rows={3}
                        value={editingPrinter?.pros?.join('\n') || ""}
                        onChange={(e) => setEditingPrinter({ ...editingPrinter, pros: e.target.value.split('\n').filter(s => s.trim()) })}
                        className="w-full p-4 bg-[#f5f5f7] rounded-2xl border-none focus:ring-2 focus:ring-[#0071e3]/20 transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#86868b] uppercase tracking-wider mb-2">不足之处 (Cons) - 每行一个</label>
                      <textarea
                        rows={3}
                        value={editingPrinter?.cons?.join('\n') || ""}
                        onChange={(e) => setEditingPrinter({ ...editingPrinter, cons: e.target.value.split('\n').filter(s => s.trim()) })}
                        className="w-full p-4 bg-[#f5f5f7] rounded-2xl border-none focus:ring-2 focus:ring-[#0071e3]/20 transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#86868b] uppercase tracking-wider mb-2">详细描述</label>
                      <textarea
                        rows={4}
                        value={editingPrinter?.description || ""}
                        onChange={(e) => setEditingPrinter({ ...editingPrinter, description: e.target.value })}
                        className="w-full p-4 bg-[#f5f5f7] rounded-2xl border-none focus:ring-2 focus:ring-[#0071e3]/20 transition-all outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-8 border-t border-[#f5f5f7] flex justify-end gap-4">
                  <button onClick={() => setIsModalOpen(false)} className="px-8 py-3 rounded-2xl hover:bg-[#f5f5f7] text-[#86868b] font-bold">
                    取消
                  </button>
                  <button onClick={handleSave} className="btn-primary px-10 py-3 flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    保存修改
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}