import { useState, useEffect, useMemo, useRef } from "react";
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
  Loader2,
  Wand2,
  Zap,
  Eye,
  Check,
  Printer as PrinterIcon,
  Square,
  CheckSquare2,
  AlertTriangle
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/store/useUserStore";
import { safeConfirm, showToast } from "@/lib/utils";

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
  created_at?: string;
  updated_at?: string;
}

export default function PrinterManager() {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<Partial<Printer> | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [uploading, setUploading] = useState(false);
  const [parseText, setParseText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [discoveryCount, setDiscoveryCount] = useState(12);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<{ matches: Printer[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 精准查重工具：品牌 + 型号组合（模糊/完全）多维匹配
  const normalizeText = (s: string): string => {
    return (s || "")
      .toLowerCase()
      .replace(/[\s\-_\/\\()（）【】\[\]·.,，。!！?？:：;；'"`~@#$%^&*+=<>|]/g, "")
      .replace(/系列|旗舰|专业|极速|高速|打印|3d|printer|color/gi, "");
  };

  const findDuplicates = (candidate: Partial<Printer>, excludeId?: string): Printer[] => {
    if (!candidate.title && !candidate.brand) return [];
    const nTitle = normalizeText(candidate.title || "");
    const nBrand = normalizeText(candidate.brand || "");
    const brandSynonyms: Record<string, string[]> = {
      "bambulab": ["拓竹", "bambu", "bambulab", "竹"],
      "拓竹": ["拓竹", "bambu", "bambulab", "竹"],
      "creality": ["创想三维", "creality", "创想"],
      "创想三维": ["创想三维", "creality", "创想"],
      "anycubic": ["纵维立方", "anycubic", "纵维"],
      "纵维立方": ["纵维立方", "anycubic", "纵维"],
      "flashforge": ["闪铸", "flashforge", "闪"],
      "闪铸": ["闪铸", "flashforge", "闪"],
      "prusa": ["普鲁士", "prusa", "普鲁"],
      "普鲁士": ["普鲁士", "prusa", "普鲁"],
      "elegoo": ["智能派", "elegoo"],
      "智能派": ["智能派", "elegoo"],
      "qidi": ["起迪", "qidi", "启迪"],
      "起迪": ["起迪", "qidi", "启迪"],
      "snapmaker": [" snapmaker", "快造"],
      "markforged": ["markforged", "马克锻造"],
    };
    const brandKeys = Object.keys(brandSynonyms);
    let matchedBrandKeys: string[] = [];
    for (const k of brandKeys) {
      if (brandSynonyms[k].some(s => nBrand.includes(normalizeText(s)))) {
        matchedBrandKeys.push(k);
        break;
      }
    }
    const brandPool = matchedBrandKeys.length > 0
      ? Array.from(new Set(matchedBrandKeys.flatMap(k => brandSynonyms[k].map(normalizeText))))
      : [nBrand];

    return printers.filter(p => {
      if (excludeId && p.id === excludeId) return false;
      const pTitle = normalizeText(p.title);
      const pBrand = normalizeText(p.brand);
      const brandMatch = brandPool.length === 0 || brandPool[0] === ""
        ? true
        : brandPool.some(s => pBrand.includes(s) || s.includes(pBrand));
      const titleExact = nTitle && (pTitle === nTitle);
      const titleContain = nTitle && (
        (nTitle.length > 5 && pTitle.includes(nTitle)) ||
        (pTitle.length > 5 && nTitle.includes(pTitle))
      );
      const titleFuzzy = nTitle && pTitle && (
        Math.min(nTitle.length, pTitle.length) >= 5 &&
        (
          [...nTitle].filter(c => pTitle.includes(c)).length / Math.max(nTitle.length, pTitle.length) > 0.85
        )
      );
      return brandMatch && (titleExact || titleContain || titleFuzzy);
    });
  };

  useEffect(() => {
    fetchPrinters();
  }, []);

  const handleSmartParse = async () => {
    if (!parseText.trim()) return;
    setIsParsing(true);

    try {
      const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;

      if (!apiKey || apiKey === 'your_api_key_here') {
        throw new Error("未配置 DeepSeek API Key（VITE_DEEPSEEK_API_KEY），请在项目根目录 .env 文件中设置后重试。");
      }

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

      if (!response.ok) {
        throw new Error(`DeepSeek API 请求失败 (HTTP ${response.status})`);
      }

      const data = await response.json();
      if (!data?.choices?.[0]?.message?.content) {
        throw new Error("DeepSeek 返回为空");
      }

      let content = data.choices[0].message.content;
      content = content.replace(/```json\n?|```/g, '').trim();
      const result = JSON.parse(content);

      setEditingPrinter({
        ...editingPrinter,
        brand: result.brand || "未知品牌",
        title: result.title || "新机型",
        price: result.price || "待定",
        buy_url: result.buy_url || "",
        pros: Array.isArray(result.pros) ? result.pros : [],
        cons: Array.isArray(result.cons) ? result.cons : [],
        description: result.description || "",
        rating: typeof result.rating === 'number' ? result.rating : 4.8
      });
      showToast("success", "AI 智能解析成功，请在下方核对和补充。");
    } catch (err: any) {
      console.error("AI 解析失败:", err);
      showToast("error", `AI 解析失败: ${err.message || '未知错误'}`);
    } finally {
      setIsParsing(false);
      setParseText("");
    }
  };

  const fetchPrinters = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('printers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message || "无法获取打印机数据，请检查 RLS 权限或网络连接");
      }

      console.log("真实打印机数据:", data);
      setPrinters((data || []) as Printer[]);
      if ((data?.length ?? 0) > 0) {
        showToast("success", `成功同步 ${data!.length} 款真实机型数据`);
      }
    } catch (err: any) {
      console.error('获取打印机失败:', err.message);
      setError(err.message || "加载失败");
      setPrinters([]);
      showToast("error", err.message || "打印机数据加载失败");
    } finally {
      setLoading(false);
    }
  };

  const handleAutoDiscover = async () => {
    setIsDiscovering(true);
    try {
      const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;

      if (!apiKey || apiKey === 'your_api_key_here') {
        throw new Error("未配置 DeepSeek API Key（VITE_DEEPSEEK_API_KEY），请在项目根目录 .env 文件中设置后重试。");
      }

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

      if (!response.ok) {
        throw new Error(`DeepSeek API 请求失败 (HTTP ${response.status})`);
      }

      const data = await response.json();
      console.log("DeepSeek API Response:", data);

      if (!data?.choices?.[0]?.message?.content) {
        throw new Error("DeepSeek 返回为空");
      }

      let content = data.choices[0].message.content;
      content = content.replace(/```json\n?|```/g, '').trim();

      let result;
      try {
        result = JSON.parse(content);
      } catch (e) {
        console.error("JSON Parsing Error:", e, "Content:", content);
        throw new Error("AI 返回的数据格式不正确，无法解析");
      }

      let newModels: any[] = [];
      if (Array.isArray(result)) {
        newModels = result;
      } else if (result.printers && Array.isArray(result.printers)) {
        newModels = result.printers;
      } else if (result.models && Array.isArray(result.models)) {
        newModels = result.models;
      } else {
        const firstArray = Object.values(result).find(val => Array.isArray(val));
        if (firstArray) newModels = firstArray as any[];
      }

      console.log("Parsed Models:", newModels);

      if (!Array.isArray(newModels) || newModels.length === 0) {
        throw new Error("未能从 AI 响应中提取到有效机型数据");
      }

      let addedCount = 0;
      let skippedCount = 0;
      for (const model of newModels) {
        if (!model.title || !model.brand) continue;

        const dupes = findDuplicates({ title: model.title, brand: model.brand });
        if (dupes.length > 0) {
          skippedCount++;
          continue;
        }

        const { error: insertError } = await supabase.from('printers').insert([{
          title: model.title,
          brand: model.brand,
          price: model.price || "待定",
          image: model.image || "",
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
          showToast("error", `保存机型 "${model.title}" 失败: ${insertError.message}`);
        } else {
          addedCount++;
        }
      }

      if (addedCount === 0) {
        showToast("info", `扫描完成，全部 ${skippedCount} 款机型已在库中，已自动跳过重复。`);
      } else {
        await fetchPrinters();
        let msg = `真 AI 扫描完成！成功导入 ${addedCount} 款新款（草稿）。`;
        if (skippedCount > 0) msg += ` 自动避开重复 ${skippedCount} 款。`;
        showToast("success", msg);
      }
    } catch (error: any) {
      console.error("AI 发现失败:", error);
      showToast("error", `AI 自动发现失败: ${error.message || '未知错误'}`);
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { isAdmin } = useUserStore.getState();
    if (!isAdmin) {
      showToast("error", "权限不足：仅管理员可上传图片。");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `printers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('course-materials')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('course-materials')
        .getPublicUrl(filePath);

      setEditingPrinter(prev => ({ ...prev, image: publicUrl }));
      showToast("success", "图片上传成功");
    } catch (error: any) {
      showToast("error", "图片上传失败: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (force = false) => {
    if (!editingPrinter?.title || !editingPrinter?.brand) {
      showToast("error", "设备名称和品牌为必填项");
      return;
    }

    if (!force && !editingPrinter.id) {
      const matches = findDuplicates(editingPrinter);
      if (matches.length > 0) {
        setDuplicateWarning({ matches });
        return;
      }
    }

    const printerData = {
      ...editingPrinter,
      updated_at: new Date().toISOString()
    };

    try {
      if (editingPrinter.id) {
        const { error } = await supabase
          .from('printers')
          .update(printerData)
          .eq('id', editingPrinter.id);
        if (error) throw error;
        showToast("success", `「${editingPrinter.title}」已更新`);
      } else {
        const { error } = await supabase
          .from('printers')
          .insert([printerData]);
        if (error) throw error;
        showToast("success", `「${editingPrinter.title}」新增成功`);
      }
      setIsModalOpen(false);
      setDuplicateWarning(null);
      fetchPrinters();
    } catch (err: any) {
      showToast("error", `保存失败: ${err.message || '未知错误'}`);
    }
  };

  const handleDelete = async (id: string) => {
    const printer = printers.find(p => p.id === id);
    if (safeConfirm("确定要删除这款设备吗？此操作不可撤销。")) {
      try {
        const { error } = await supabase
          .from('printers')
          .delete()
          .eq('id', id);
        if (error) throw error;
        setSelectedIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        showToast("success", `「${printer?.title || '设备'}」已删除`);
        fetchPrinters();
      } catch (err: any) {
        showToast("error", `删除失败: ${err.message || '未知错误'}`);
      }
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredPrinters.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPrinters.map(p => p.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkDelete = async () => {
    const count = selectedIds.size;
    if (count === 0) return;
    if (!safeConfirm(`确定要批量删除选中的 ${count} 款设备吗？此操作不可撤销。`)) return;
    setIsDeleting(true);
    let successCount = 0;
    for (const id of Array.from(selectedIds)) {
      try {
        const { error } = await supabase.from('printers').delete().eq('id', id);
        if (!error) successCount++;
      } catch (e) { /* noop */ }
    }
    setIsDeleting(false);
    setSelectedIds(new Set());
    if (successCount > 0) {
      showToast("success", `已批量删除 ${successCount} 款设备`);
      fetchPrinters();
    } else {
      showToast("error", "批量删除失败，请稍后重试");
    }
  };

  const handleBulkStatus = async (newStatus: 'draft' | 'published') => {
    const count = selectedIds.size;
    if (count === 0) return;
    const ids = Array.from(selectedIds);
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('printers')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .in('id', ids);
      if (error) throw error;
      showToast("success", `已将 ${count} 款设备更新为「${statusMap[newStatus].label}」`);
      clearSelection();
      fetchPrinters();
    } catch (err: any) {
      showToast("error", `批量状态更新失败: ${err.message || '未知错误'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredPrinters = useMemo(() => {
    return printers.filter(p => {
      const matchesSearch = searchQuery.trim() === ""
        ? true
        : p.title.toLowerCase().includes(searchQuery.toLowerCase())
          || p.brand.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "all" ? true : (p.status || "published") === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [printers, searchQuery, filterStatus]);

  const statusMap: Record<string, { label: string; cls: string }> = {
    "published": { label: "已发布", cls: "bg-emerald-50 text-emerald-600 border border-emerald-100" },
    "draft": { label: "草稿(自动发现)", cls: "bg-[#0071e3]/10 text-[#0071e3] border border-[#0071e3]/20" },
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] pt-28 pb-12 px-6 md:px-12 relative">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#1d1d1f]">设备方案管理</h1>
            <p className="text-[#86868b] mt-1">
              共 {printers.length} 款机型 ·
              草稿 {printers.filter(p => (p.status || 'published') === 'draft').length} 款 ·
              已发布 {printers.filter(p => (p.status || 'published') === 'published').length} 款
            </p>
          </div>
          <div className="flex gap-3 items-center flex-wrap">
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
              onClick={fetchPrinters}
              disabled={loading}
              className="px-5 py-3 rounded-2xl bg-white border border-[#0071e3]/20 text-[#0071e3] font-semibold hover:bg-[#0071e3]/5 transition-all shadow-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Eye className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "同步中..." : "刷新真实数据"}
            </button>
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
                setEditingPrinter({ rating: 4.5, pros: [], cons: [], status: 'published' });
                setIsModalOpen(true);
              }}
              className="btn-primary flex items-center gap-2 px-6"
            >
              <Plus className="w-4 h-4" />
              新增机型
            </button>
          </div>
        </div>

        {/* Toolbar + 选中工具栏 */}
        <AnimatePresence mode="wait">
          {selectedIds.size > 0 ? (
            <motion.div
              key="selected-bar"
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className="bg-gradient-to-r from-[#0071e3] to-[#28cd41] rounded-3xl shadow-xl shadow-[#0071e3]/20 px-6 py-4 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 text-white overflow-hidden"
            >
              <div className="flex items-center gap-4 flex-wrap">
                <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                  <CheckSquare2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] font-bold text-white/80">多选模式</div>
                  <div className="text-lg font-bold leading-tight">
                    已选中 <span className="text-white">{selectedIds.size}</span> / {filteredPrinters.length} 款
                  </div>
                </div>
                <button
                  onClick={toggleSelectAll}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl bg-white/15 text-sm font-semibold hover:bg-white/25 transition-colors disabled:opacity-50"
                >
                  {selectedIds.size === filteredPrinters.length ? "取消全选" : "全选当前筛选"}
                </button>
                <button
                  onClick={clearSelection}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl bg-white/10 text-sm font-semibold hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                  清空选择
                </button>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => handleBulkStatus('published')}
                  disabled={isDeleting}
                  className="px-5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 transition-colors flex items-center gap-2 font-semibold disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  批量发布
                </button>
                <button
                  onClick={() => handleBulkStatus('draft')}
                  disabled={isDeleting}
                  className="px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 transition-colors flex items-center gap-2 font-semibold disabled:opacity-50"
                >
                  <Eye className="w-4 h-4" />
                  批量设为草稿
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 transition-colors flex items-center gap-2 font-bold shadow-lg shadow-rose-900/30 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  {isDeleting ? "处理中..." : `批量删除 (${selectedIds.size})`}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="normal-toolbar"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="bg-white rounded-3xl p-4 shadow-sm border border-white mb-8 flex flex-col md:flex-row gap-4"
            >
              <div className="relative flex-grow">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b]" />
                <input
                  type="text"
                  placeholder="搜索真实机型或品牌..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 outline-none transition-all"
                />
              </div>
              <div className="flex gap-2 flex-wrap items-center">
                <div className="flex items-center gap-2 px-2 py-1 rounded-2xl bg-[#f5f5f7]">
                  <button
                    onClick={toggleSelectAll}
                    disabled={filteredPrinters.length === 0}
                    title="快速多选"
                    className="p-2.5 rounded-xl hover:bg-white text-[#86868b] hover:text-[#0071e3] transition-all disabled:opacity-40"
                  >
                    <CheckSquare2 className="w-4.5 h-4.5" />
                  </button>
                  <span className="text-xs font-bold text-[#86868b] pr-2">多选</span>
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#ececef] transition-colors outline-none font-medium text-sm"
                >
                  <option value="all">全部状态</option>
                  <option value="published">已发布</option>
                  <option value="draft">草稿 (AI自动发现)</option>
                </select>
                <div className="flex bg-[#f5f5f7] rounded-2xl p-1 shadow-sm shrink-0">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-[#0071e3] shadow-sm' : 'text-[#86868b]'}`}
                  >
                    <LayoutGrid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-[#0071e3] shadow-sm' : 'text-[#86868b]'}`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading / Error / Empty / Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2.5rem] shadow-sm">
            <Loader2 className="w-10 h-10 text-[#0071e3] animate-spin mb-4" />
            <p className="text-[#86868b]">正在从数据库同步真实机型数据...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 bg-rose-50/50 border border-rose-100 rounded-[2.5rem]">
            <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
            <h3 className="text-xl font-bold text-[#1d1d1f] mb-2">数据加载失败</h3>
            <p className="text-rose-600 mb-6 max-w-md text-center px-4">{error}</p>
            <p className="text-[#86868b] text-sm max-w-lg text-center px-4 mb-6">
              请确认 Supabase `printers` 表存在且 RLS 策略已配置，或临时禁用 RLS 后重试。
            </p>
            <button
              onClick={fetchPrinters}
              className="px-6 py-3 rounded-2xl bg-[#0071e3] text-white font-bold hover:bg-[#0077ed] transition-all ripple-target"
            >
              重新加载
            </button>
          </div>
        ) : filteredPrinters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2.5rem] shadow-sm border border-white">
            <PrinterIcon className="w-16 h-16 text-[#86868b]/20 mb-6" />
            <h3 className="text-2xl font-bold text-[#1d1d1f] mb-2">
              {printers.length === 0 ? "暂无设备数据" : "没有匹配的设备"}
            </h3>
            <p className="text-[#86868b] text-center max-w-md px-4">
              {printers.length === 0
                ? "请点击右上角「智能扫描新款」或「新增机型」来录入第一款真实设备。草稿数据需管理员审核后发布。"
                : "请尝试调整搜索关键词或状态过滤条件。"}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPrinters.map((printer) => {
              const selected = selectedIds.has(printer.id);
              const cardCls = selected
                ? "bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-[#0071e3] ring-4 ring-[#0071e3]/20 shadow-[0_20px_50px_-12px_rgba(0,113,227,0.35)] hover:shadow-xl transition-all group relative"
                : "bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-white hover:shadow-xl transition-all group relative";
              const cornerCheckCls = selected
                ? "w-8 h-8 rounded-xl border-2 shadow-lg flex items-center justify-center transition-all bg-gradient-to-br from-[#0071e3] to-[#28cd41] border-transparent text-white scale-110"
                : "w-8 h-8 rounded-xl border-2 shadow-lg flex items-center justify-center transition-all bg-white border-[#d2d2d7] text-transparent hover:border-[#0071e3] hover:text-[#0071e3]/40";
              return (
              <motion.div
                layout
                key={printer.id}
                className={cardCls}
              >
                {/* 选中蒙层 + 复选框 */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleSelect(printer.id); }}
                  className="absolute top-0 left-0 z-30 w-full h-full cursor-default pointer-events-none"
                  tabIndex={-1}
                  aria-hidden={true}
                />
                <div
                  onClick={(e) => { e.stopPropagation(); toggleSelect(printer.id); }}
                  className="absolute bottom-5 right-6 z-40 cursor-pointer"
                  title={selected ? "取消选中" : "加入批量操作"}
                >
                  <div className={cornerCheckCls}>
                    <Check className="w-4 h-4" strokeWidth={3.5} />
                  </div>
                </div>
                {selected && (
                  <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-br from-[#0071e3]/5 via-transparent to-[#28cd41]/5 mix-blend-multiply" />
                )}

                <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] flex items-center justify-center border-b border-[#f5f5f7] shimmer-border">
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
                  <div className="absolute top-4 left-4 flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSelect(printer.id); }}
                      className="w-8 h-8 rounded-xl bg-white/90 backdrop-blur border border-white shadow-md flex items-center justify-center text-[#86868b] hover:bg-white hover:text-[#0071e3] transition-all z-40"
                      title={selected ? "取消选中" : "选中此项"}
                    >
                      {selected ? <CheckSquare2 className="w-4.5 h-4.5 text-[#0071e3]" /> : <Square className="w-4.5 h-4.5" />}
                    </button>
                    {printer.status === 'draft' && (
                      <div className="px-3 py-1 rounded-full bg-[#0071e3] text-white text-[10px] font-bold flex items-center gap-1 shadow-lg">
                        <Zap className="w-3 h-3" />
                        自动发现
                      </div>
                    )}
                    {printer.status === 'published' && (
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-lg ${statusMap['published'].cls}`}>
                        {statusMap['published'].label}
                      </div>
                    )}
                  </div>
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-40">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingPrinter(printer);
                        setIsModalOpen(true);
                      }}
                      className="p-2 rounded-full bg-white/90 backdrop-blur shadow-sm hover:text-[#0071e3] transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(printer.id); }}
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
                  <div className="flex items-center gap-1 mt-4">
                    <span className="text-yellow-500">★</span>
                    <span className="text-sm font-bold text-[#1d1d1f]">{printer.rating}</span>
                  </div>
                </div>
              </motion.div>
            );})}
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-white">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#f5f5f7] text-sm text-[#86868b] font-bold">
                  <th className="px-6 py-6 w-16">
                    {(() => {
                      const allSelected = selectedIds.size === filteredPrinters.length && filteredPrinters.length > 0;
                      let cls = "w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all disabled:opacity-40";
                      cls += allSelected
                        ? " bg-gradient-to-br from-[#0071e3] to-[#28cd41] border-transparent text-white"
                        : " bg-white border-[#d2d2d7] text-transparent hover:border-[#0071e3]";
                      return (
                        <button
                          onClick={toggleSelectAll}
                          disabled={filteredPrinters.length === 0}
                          className={cls}
                        >
                          <Check className="w-4 h-4" strokeWidth={3.5} />
                        </button>
                      );
                    })()}
                  </th>
                  <th className="px-2 py-6">机型名称</th>
                  <th className="px-8 py-6">品牌</th>
                  <th className="px-8 py-6">价格</th>
                  <th className="px-8 py-6">评分</th>
                  <th className="px-8 py-6">状态</th>
                  <th className="px-8 py-6 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f5f7]">
                {filteredPrinters.map((printer) => {
                  const selected = selectedIds.has(printer.id);
                  const rowCls = selected
                    ? "group transition-colors bg-gradient-to-r from-[#0071e3]/5 via-white to-[#28cd41]/5"
                    : "group transition-colors hover:bg-[#f5f5f7]/50";
                  const btnCls = selected
                    ? "w-8 h-8 rounded-xl border-2 shadow-sm flex items-center justify-center transition-all bg-gradient-to-br from-[#0071e3] to-[#28cd41] border-transparent text-white scale-105"
                    : "w-8 h-8 rounded-xl border-2 shadow-sm flex items-center justify-center transition-all bg-white border-[#d2d2d7] text-transparent hover:border-[#0071e3] hover:text-[#0071e3]/40";
                  return (
                  <tr key={printer.id} className={rowCls}>
                    <td className="px-6 py-6">
                      <button
                        onClick={() => toggleSelect(printer.id)}
                        className={btnCls}
                      >
                        <Check className="w-4 h-4" strokeWidth={3.5} />
                      </button>
                    </td>
                    <td className="px-2 py-6">
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
                    <td className="px-8 py-6">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${statusMap[printer.status || 'published']?.cls || statusMap['published'].cls}`}>
                        {statusMap[printer.status || 'published']?.label || printer.status}
                      </span>
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
                );})}
              </tbody>
            </table>
          </div>
        )}

        {/* 重复机型拦截弹窗 */}
        <AnimatePresence>
          {duplicateWarning && isModalOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[250] bg-[#1d1d1f]/60 backdrop-blur-md"
                onClick={() => setDuplicateWarning(null)}
              />
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[260] w-[min(92vw,620px)] bg-white rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)] overflow-hidden"
              >
                <div className="bg-gradient-to-r from-amber-400 to-orange-500 px-8 py-5 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-grow pt-0.5">
                    <div className="text-xs uppercase tracking-[0.22em] font-bold text-white/85">检测到重复机型</div>
                    <div className="text-xl font-bold text-white mt-1">
                      库中已存在 <span className="underline underline-offset-2">{duplicateWarning.matches.length}</span> 款相似型号
                    </div>
                  </div>
                  <button
                    onClick={() => setDuplicateWarning(null)}
                    className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center shrink-0 transition-colors"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>

                <div className="px-8 py-6 max-h-96 overflow-y-auto">
                  <p className="text-[#86868b] text-sm leading-relaxed mb-5">
                    以下机型与您正在新增的「<span className="font-bold text-[#1d1d1f]">{editingPrinter?.brand} {editingPrinter?.title}</span>」
                    在品牌与型号维度高度相似，请确认是否重复录入：
                  </p>
                  <div className="space-y-3">
                    {duplicateWarning.matches.map(m => (
                      <div key={m.id} className="flex items-center gap-4 p-4 rounded-2xl border-2 border-amber-100 bg-gradient-to-r from-amber-50/60 to-orange-50/40 hover:border-amber-200 transition-colors">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white to-[#f8fafc] border border-amber-100 flex items-center justify-center shrink-0 overflow-hidden relative">
                          {m.image && !m.image.includes('traeapi.us') ? (
                            <img src={m.image} alt="" className="w-full h-full object-cover z-10"
                              onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                          ) : null}
                          <span className="absolute text-xs font-black text-amber-600/70">{m.brand[0]}</span>
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-1">{m.brand}</div>
                          <div className="font-bold text-[#1d1d1f] truncate">{m.title}</div>
                          <div className="flex items-center gap-2 mt-1 text-xs">
                            <span className="text-[#86868b]">{m.price}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusMap[m.status || 'published']?.cls || ''}`}>
                              {statusMap[m.status || 'published']?.label}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setEditingPrinter(m);
                            setDuplicateWarning(null);
                          }}
                          className="px-4 py-2.5 rounded-xl bg-white border border-[#d2d2d7] hover:border-[#0071e3] hover:text-[#0071e3] text-[#1d1d1f] font-semibold text-sm transition-colors shrink-0"
                        >
                          编辑此款
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#fafafa] border-t border-[#f5f5f7] px-8 py-5 flex flex-col md:flex-row gap-3 md:justify-end md:items-center">
                  <button
                    onClick={() => setDuplicateWarning(null)}
                    className="px-5 py-3 rounded-2xl text-[#86868b] hover:text-[#1d1d1f] hover:bg-white font-semibold transition-all order-2 md:order-1"
                  >
                    返回修改
                  </button>
                  <button
                    onClick={() => handleSave(true)}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-bold shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all order-1 md:order-2"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    确认仍要新增（仍可能重复）
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

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
                          className="px-6 rounded-2xl bg-[#0071e3] text-white font-bold hover:bg-[#0077ed] transition-all flex flex-col items-center justify-center gap-2 disabled:opacity-50 shrink-0 ripple-target"
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
                            <div className="relative aspect-video rounded-[2rem] overflow-hidden bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] flex items-center justify-center border border-[#f5f5f7] shimmer-border">
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
                  <button onClick={() => handleSave()} className="btn-primary px-10 py-3 flex items-center gap-2">
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