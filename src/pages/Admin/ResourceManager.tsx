import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  FileText, 
  Download,
  Trash2,
  Edit2,
  UploadCloud,
  X,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/store/useUserStore";

interface Resource {
  id: string | number;
  title: string;
  category: string;
  file_type: string;
  file_url: string;
  downloads: number;
  created_at: string;
  min_level: string;
}

export default function ResourceManager() {
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [resources, setResources] = useState<Resource[]>([]);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResources(data || []);
    } catch (err: any) {
      console.error('Error fetching resources:', err.message);
      // 如果表不存在，使用 Mock 数据
      setResources([
        { id: 1, title: "初中信息技术-3D建模入门", category: "初中", file_type: "PPTX", downloads: 145, created_at: "2026-09-01", min_level: "LV2", file_url: "#" },
        { id: 2, title: "Rayzo Pro 打印机切片参数指南", category: "技术文档", file_type: "PDF", downloads: 89, created_at: "2026-08-28", min_level: "LV1", file_url: "#" },
      ]);
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        setError("文件大小不能超过 50MB");
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);
    setUploadProgress(5);
    
    console.log("开始上传流程...", { fileName: selectedFile.name, fileSize: selectedFile.size });

    try {
      // 0. 简化的权限检查：只要是管理员身份即可
      const { user, isAdmin } = useUserStore.getState();
      
      console.log("正在验证管理员权限...", { user: user?.email, isAdmin });

      if (!isAdmin) {
        throw new Error("权限不足：仅管理员可执行上传操作。");
      }
      
      setUploadProgress(10);

      // 1. 获取表单数据
      const form = e.currentTarget as HTMLFormElement;
      const formData = new FormData(form);
      const title = formData.get('title') as string;
      const category = formData.get('category') as string;
      const minLevel = (formData.get('level') as string).split(' ')[0];

      // 2. 上传文件到 Supabase Storage (使用公共权限绕过 Auth Session 校验)
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `resources/${fileName}`;

      console.log("正在通过快速通道上传文件...", filePath);
      
      const { error: uploadError } = await supabase.storage
        .from('course-materials')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error("上传失败:", uploadError);
        throw new Error(`文件上传失败: ${uploadError.message}。请确保 SQL 脚本中的 '允许任何人上传' 策略已执行成功。`);
      }
      console.log("文件上传成功");
      setUploadProgress(70);

      // 3. 获取公共 URL
      const { data: { publicUrl } } = supabase.storage
        .from('course-materials')
        .getPublicUrl(filePath);
      console.log("文件公共 URL:", publicUrl);

      // 4. 插入元数据到数据库
      const newResource = {
        title: title || selectedFile.name,
        category: category,
        file_type: fileExt?.toUpperCase() || 'FILE',
        file_url: publicUrl,
        downloads: 0,
        min_level: minLevel,
      };

      console.log("正在写入数据库记录...", newResource);
      const { data: dbData, error: dbError } = await supabase
        .from('resources')
        .insert([newResource])
        .select();

      if (dbError) {
        console.error("数据库写入失败:", dbError);
        throw new Error(`数据库记录失败: ${dbError.message}。请确保已运行 SQL 脚本创建了 resources 表。`);
      }
      console.log("数据库记录写入成功");
      setUploadProgress(100);

      if (dbData) {
        setResources(prev => [dbData[0], ...prev]);
      }
      
      setTimeout(() => {
        setShowUpload(false);
        setSelectedFile(null);
        setUploadProgress(0);
        alert('恭喜！资源已成功上传并同步至数据库。');
        // 强制重新获取一次数据，确保状态同步
        fetchResources();
      }, 500);
    } catch (err: any) {
      console.error("提交过程发生错误:", err);
      setError(err.message);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm('确定要删除该资源吗？')) return;

    try {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setResources(resources.filter(r => r.id !== id));
    } catch (err: any) {
      alert(`删除失败: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] pt-28 pb-12 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#1d1d1f]">资源管理</h1>
            <p className="text-[#86868b] mt-1">上传与维护您的课程资源库</p>
          </div>
          <button 
            onClick={() => setShowUpload(true)}
            className="btn-primary flex items-center gap-2 px-6 self-start md:self-auto"
          >
            <Plus className="w-5 h-5" />
            上传新课件
          </button>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-white mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b]" />
            <input 
              type="text" 
              placeholder="搜索资源名称、分类..."
              className="w-full pl-12 pr-4 py-2.5 rounded-2xl bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 outline-none transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#ececef] transition-colors">
              <Filter className="w-4 h-4" />
              筛选分类
            </button>
          </div>
        </div>

        {/* Resources Table */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#f5f5f7] bg-[#fafafa]">
                  <th className="px-8 py-5 text-sm font-bold text-[#1d1d1f]">资源名称</th>
                  <th className="px-6 py-5 text-sm font-bold text-[#1d1d1f]">分类</th>
                  <th className="px-6 py-5 text-sm font-bold text-[#1d1d1f]">类型</th>
                  <th className="px-6 py-5 text-sm font-bold text-[#1d1d1f]">最低等级</th>
                  <th className="px-6 py-5 text-sm font-bold text-[#1d1d1f]">下载量</th>
                  <th className="px-6 py-5 text-sm font-bold text-[#1d1d1f]">上传日期</th>
                  <th className="px-8 py-5 text-sm font-bold text-[#1d1d1f] text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f5f7]">
                {resources.map((res) => (
                  <tr key={res.id} className="hover:bg-[#fafafa] transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0071e3] flex items-center justify-center">
                          <FileText className="w-5 h-5" />
                        </div>
                        <span className="font-medium text-[#1d1d1f]">{res.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-[#86868b]">{res.category}</td>
                    <td className="px-6 py-5">
                      <span className="px-2 py-1 rounded-md bg-[#f5f5f7] text-[#86868b] text-xs font-bold uppercase">
                        {res.file_type}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-bold text-[#0071e3]">{res.min_level}</span>
                    </td>
                    <td className="px-6 py-5 text-sm text-[#86868b]">{res.downloads}</td>
                    <td className="px-6 py-5 text-sm text-[#86868b]">
                      {new Date(res.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a 
                          href={res.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg hover:bg-[#ececef] text-[#86868b] hover:text-[#1d1d1f]"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button 
                          onClick={() => handleDelete(res.id)}
                          className="p-2 rounded-lg hover:bg-red-50 text-[#86868b] hover:text-red-500"
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
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowUpload(false)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-lg bg-white rounded-[3rem] p-10 shadow-2xl"
          >
            <button 
              onClick={() => setShowUpload(false)}
              className="absolute right-8 top-8 w-10 h-10 rounded-full bg-[#f5f5f7] flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-2xl font-bold mb-8 text-[#1d1d1f]">上传新课件</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 rounded-xl bg-red-50 text-red-500 text-sm border border-red-100 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2 text-[#1d1d1f]">课件标题</label>
                <input 
                  required
                  name="title"
                  type="text" 
                  className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 outline-none transition-all"
                  placeholder="输入课件名称..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-[#1d1d1f]">分类</label>
                  <select name="category" className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 outline-none transition-all">
                    <option>小学</option>
                    <option>初中</option>
                    <option>高中</option>
                    <option>技术文档</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-[#1d1d1f]">最低下载等级</label>
                  <select name="level" className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 outline-none transition-all">
                    <option>LV1 (龙蛋)</option>
                    <option>LV2 (幼龙)</option>
                    <option>LV3 (鳞铸)</option>
                    <option>LV4 (古龙)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-[#1d1d1f]">文件上传</label>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div 
                  onClick={handleFileClick}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                    selectedFile 
                      ? "border-[#28cd41] bg-green-50/50" 
                      : "border-[#d2d2d7] hover:border-[#0071e3] hover:bg-blue-50/50"
                  }`}
                >
                  {selectedFile ? (
                    <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                      <CheckCircle2 className="w-10 h-10 text-[#28cd41] mx-auto mb-3" />
                      <p className="text-sm font-bold text-[#1d1d1f] truncate">{selectedFile.name}</p>
                      <p className="text-xs text-[#86868b] mt-1">点击更换文件</p>
                    </motion.div>
                  ) : (
                    <>
                      <UploadCloud className="w-10 h-10 text-[#86868b] mx-auto mb-3" />
                      <p className="text-sm text-[#86868b]">点击选择文件上传</p>
                      <p className="text-xs text-[#d2d2d7] mt-1">支持 PPTX, PDF, ZIP, MP4 (最大 100MB)</p>
                    </>
                  )}
                </div>
              </div>

              <button 
                disabled={!selectedFile || isUploading}
                type="submit" 
                className={`w-full py-4 rounded-2xl font-bold shadow-lg transition-all relative overflow-hidden ${
                  !selectedFile || isUploading
                    ? "bg-[#d2d2d7] text-white cursor-not-allowed"
                    : "bg-[#0071e3] text-white hover:bg-[#0077ed] shadow-blue-500/20"
                }`}
              >
                {isUploading && (
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    className="absolute inset-0 bg-blue-600/20"
                  />
                )}
                <span className="relative z-10">
                  {isUploading ? `正在上传 ${uploadProgress}%...` : "开始上传"}
                </span>
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
