import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Download,
  Trash2,
  UploadCloud,
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Zap,
  Check,
  Pencil, // Add Pencil icon for editing
  Folder,
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/store/useUserStore";
import { showToast, safeConfirm } from "@/lib/utils";

interface Resource {
  id: string;
  title: string;
  category: string;
  file_type: string;
  file_url: string;
  downloads: number;
  created_at: string;
  min_level: string;
  status?: 'draft' | 'published';
  folder_id?: string | null;
  order_index?: number;
  cover_url?: string | null;
}

interface FolderItem {
  id: string;
  name: string;
}

const statusMap: Record<string, { label: string; cls: string }> = {
  "published": { label: "已发布", cls: "bg-emerald-50 text-emerald-600 border border-emerald-100" },
  "draft": { label: "草稿", cls: "bg-[#0071e3]/10 text-[#0071e3] border border-[#0071e3]/20" },
};

export default function ResourceManager() {
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [resources, setResources] = useState<Resource[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  
  // New state for editing resources
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<string[]>(['unassigned']);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const generateCoverForResource = async (title: string, folderId: string | null | undefined, extraPrompt = "") => {
    let folderName = "";
    if (folderId) {
      const folder = folders.find(f => f.id === folderId);
      if (folder) folderName = folder.name;
    }
    const res = await requestResourceApi<{ url: string }>("/api/resources/generate-cover", {
      method: "POST",
      body: JSON.stringify({ folder_name: folderName, resource_title: title, extra_prompt: extraPrompt }),
    });
    return res?.url;
  };

  const handleGenerateSelectedCovers = async () => {
    const toGenerate = resources.filter(r => selectedIds.has(r.id));
    if (toGenerate.length === 0) return;

    if (!safeConfirm(`确定要为选中的 ${toGenerate.length} 个课件生成封面吗？这可能需要一些时间。`)) return;

    setIsBatchGenerating(true);
    let successCount = 0;
    for (const res of toGenerate) {
      try {
        const coverUrl = await generateCoverForResource(res.title, res.folder_id);
        if (coverUrl) {
          await requestResourceApi(`/api/resources/${res.id}`, {
            method: "PATCH",
            body: JSON.stringify({ cover_url: coverUrl }),
          });
          setResources(prev => prev.map(r => r.id === res.id ? { ...r, cover_url: coverUrl } : r));
          successCount++;
        }
      } catch (err: any) {
        console.error(`生成封面失败 [${res.title}]:`, err.message);
      }
    }
    setIsBatchGenerating(false);
    setSelectedIds(new Set()); // 清空选中状态
    showToast("success", `生成完毕，成功生成 ${successCount}/${toGenerate.length} 个封面。`);
  };

  useEffect(() => {
    fetchResources();
    fetchFolders();
  }, []);

  useEffect(() => {
    if (folders.length > 0) {
      setExpandedFolders(prev => [...new Set([...prev, ...folders.map(f => f.id)])]);
    }
  }, [folders]);

  const toggleFolderExpansion = (folderId: string) => {
    setExpandedFolders(prev => 
      prev.includes(folderId)
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };

  const handleMoveUp = async (index: number, resList: Resource[]) => {
    if (index === 0) return;
    const current = { ...resList[index] };
    const previous = { ...resList[index - 1] };

    let oCurr = current.order_index ?? Date.now();
    let oPrev = previous.order_index ?? Date.now();

    if (oCurr === oPrev) {
      oCurr = oPrev + 1; // Ensure current is mathematically larger before swap
    }

    // Swap
    current.order_index = oPrev;
    previous.order_index = oCurr;

    // Optimistic update
    setResources(prev => {
      const updated = prev.map(r => {
        if (r.id === current.id) return current;
        if (r.id === previous.id) return previous;
        return r;
      });
      
      // Re-sort the array so the UI reflects the change immediately
      return updated.sort((a, b) => {
        const oa = a.order_index ?? Number.MAX_SAFE_INTEGER;
        const ob = b.order_index ?? Number.MAX_SAFE_INTEGER;
        if (oa !== ob) return oa - ob;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    });

    try {
      await requestResourceApi("/api/resources/reorder", {
        method: "POST",
        body: JSON.stringify({
          updates: [
            { id: current.id, order_index: current.order_index },
            { id: previous.id, order_index: previous.order_index }
          ]
        })
      });
    } catch (err: any) {
      showToast("error", `排序更新失败: ${err.message}`);
      fetchResources(); // Revert on failure
    }
  };

  const handleMoveDown = async (index: number, resList: Resource[]) => {
    if (index === resList.length - 1) return;
    const current = { ...resList[index] };
    const next = { ...resList[index + 1] };

    let oCurr = current.order_index ?? Date.now();
    let oNext = next.order_index ?? Date.now();

    if (oCurr === oNext) {
      oNext = oCurr + 1; // Ensure next is mathematically larger before swap
    }

    // Swap
    current.order_index = oNext;
    next.order_index = oCurr;

    // Optimistic update
    setResources(prev => {
      const updated = prev.map(r => {
        if (r.id === current.id) return current;
        if (r.id === next.id) return next;
        return r;
      });
      
      // Re-sort the array so the UI reflects the change immediately
      return updated.sort((a, b) => {
        const oa = a.order_index ?? Number.MAX_SAFE_INTEGER;
        const ob = b.order_index ?? Number.MAX_SAFE_INTEGER;
        if (oa !== ob) return oa - ob;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    });

    try {
      await requestResourceApi("/api/resources/reorder", {
        method: "POST",
        body: JSON.stringify({
          updates: [
            { id: current.id, order_index: current.order_index },
            { id: next.id, order_index: next.order_index }
          ]
        })
      });
    } catch (err: any) {
      showToast("error", `排序更新失败: ${err.message}`);
      fetchResources(); // Revert on failure
    }
  };

  const renderResourceTable = (resList: Resource[]) => {
    if (resList.length === 0) {
      return (
        <div className="py-12 text-center flex flex-col items-center justify-center">
          <FileText className="w-12 h-12 text-gray-200 mb-3" />
          <p className="text-[#86868b] text-sm font-medium">该文件夹下暂无资源</p>
        </div>
      );
    }
    return (
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-[#f5f5f7] bg-white">
            <th className="px-6 py-5 w-14 text-center">
              <input 
                type="checkbox" 
                checked={resList.length > 0 && resList.every(r => selectedIds.has(r.id))}
                onChange={(e) => {
                  const newSet = new Set(selectedIds);
                  if (e.target.checked) {
                    resList.forEach(r => newSet.add(r.id));
                  } else {
                    resList.forEach(r => newSet.delete(r.id));
                  }
                  setSelectedIds(newSet);
                }}
                className="w-4 h-4 rounded border-gray-300 text-[#0071e3] focus:ring-[#0071e3] cursor-pointer"
              />
            </th>
            <th className="px-4 py-5 text-sm font-bold text-[#1d1d1f]">排序</th>
            <th className="px-8 py-5 text-sm font-bold text-[#1d1d1f]">资源名称</th>
            <th className="px-6 py-5 text-sm font-bold text-[#1d1d1f]">分类</th>
            <th className="px-6 py-5 text-sm font-bold text-[#1d1d1f]">类型</th>
            <th className="px-6 py-5 text-sm font-bold text-[#1d1d1f]">状态</th>
            <th className="px-6 py-5 text-sm font-bold text-[#1d1d1f]">最低等级</th>
            <th className="px-6 py-5 text-sm font-bold text-[#1d1d1f]">下载量</th>
            <th className="px-6 py-5 text-sm font-bold text-[#1d1d1f]">上传日期</th>
            <th className="px-8 py-5 text-sm font-bold text-[#1d1d1f] text-right">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f5f5f7]">
          {resList.map((res, index) => (
            <tr key={res.id} className="hover:bg-[#fafafa] transition-colors group bg-white">
              <td className="px-6 py-5 text-center" onClick={(e) => e.stopPropagation()}>
                <input 
                  type="checkbox"
                  checked={selectedIds.has(res.id)}
                  onChange={(e) => {
                    const newSet = new Set(selectedIds);
                    if (e.target.checked) newSet.add(res.id);
                    else newSet.delete(res.id);
                    setSelectedIds(newSet);
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-[#0071e3] focus:ring-[#0071e3] cursor-pointer"
                />
              </td>
              <td className="px-4 py-5">
                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleMoveUp(index, resList)}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-[#0071e3] hover:bg-blue-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    title="上移"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleMoveDown(index, resList)}
                    disabled={index === resList.length - 1}
                    className="p-1 text-gray-400 hover:text-[#0071e3] hover:bg-blue-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    title="下移"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
              </td>
              <td className="px-8 py-5">
                <div className="flex items-center gap-3">
                  {res.cover_url ? (
                    <img src={res.cover_url} alt={res.title} className="w-10 h-10 rounded-xl object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0071e3] flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                  )}
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
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${statusMap[res.status || 'published']?.cls || statusMap['published'].cls}`}>
                  {statusMap[res.status || 'published']?.label || res.status}
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
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => handleToggleStatus(res)}
                    title={(res.status || 'published') === 'published' ? '取消发布' : '发布'}
                    className={`p-2 rounded-lg transition-all ${
                      (res.status || 'published') === 'published'
                        ? "hover:bg-amber-50 text-[#86868b] hover:text-amber-600"
                        : "hover:bg-emerald-50 text-[#86868b] hover:text-emerald-600"
                    }`}
                  >
                    {(res.status || 'published') === 'published' ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                  <button 
                    onClick={() => handleEditResource(res)}
                    title="编辑资源"
                    className="p-2 rounded-lg hover:bg-blue-50 text-[#86868b] hover:text-blue-500"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
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
    );
  };

  const fetchFolders = async () => {
    try {
      const { data, error } = await supabase
        .from('folders')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) throw error;
      setFolders(data || []);
    } catch (err: any) {
      console.error('Error fetching folders:', err.message);
    }
  };

  const getAdminAccessToken = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      throw new Error(`获取登录状态失败: ${error.message}`);
    }

    const token = data.session?.access_token;
    if (!token) {
      throw new Error("登录状态已失效，请重新登录管理员账号后再试。");
    }

    return token;
  };

  const requestResourceApi = async <T,>(path: string, options: RequestInit = {}) => {
    const token = await getAdminAccessToken();
    const headers = new Headers(options.headers);
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";

    headers.set("Authorization", `Bearer ${token}`);
    if (options.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers,
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.error || "资源接口请求失败，请检查后端服务。");
    }

    return payload?.data as T;
  };

  const fetchResources = async () => {
    try {
      // For fetching resources, we don't need a user-specific client for now, assuming RLS allows read access
      // If RLS changes to restrict read access, this would need to be updated
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResources((data || []).map(r => ({
        ...r,
        status: r.status || 'published'
      })));
    } catch (err: any) {
      console.error('Error fetching resources:', err.message);
      setError(err.message || '加载资源失败，请检查数据库连接');
      setResources([]);
    }
  };

  const handleEditResource = (resource: Resource) => {
    setEditingResource(resource);
    setShowEditModal(true);
  };

  const handleUpdateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResource) return;

    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const newTitle = formData.get('title') as string;
    const newFolderId = formData.get('folder_id') as string || null;
    const coverUrl = formData.get('cover_url') as string;

    try {
      await requestResourceApi<Resource>(`/api/resources/${editingResource.id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: newTitle, folder_id: newFolderId, cover_url: coverUrl }),
      });

      setResources(prev => prev.map(r => 
        r.id === editingResource.id ? { ...r, title: newTitle, folder_id: newFolderId, cover_url: coverUrl } : r
      ));
      showToast("success", "资源文件夹更新成功");
      setShowEditModal(false);
      setEditingResource(null);
    } catch (err: any) {
      showToast("error", `更新失败: ${err.message}`);
    }
  };

  const handleToggleStatus = async (res: Resource) => {
    const newStatus: 'draft' | 'published' = (res.status || 'published') === 'published' ? 'draft' : 'published';
    const action = newStatus === 'published' ? '发布' : '取消发布';
    if (!safeConfirm(`确定要${action}「${res.title}」吗？`)) return;

    try {
      await requestResourceApi<Resource>(`/api/resources/${res.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });

      setResources(prev => prev.map(r => 
        r.id === res.id ? { ...r, status: newStatus } : r
      ));
      showToast("success", `已${action}「${res.title}」`);
    } catch (err: any) {
      showToast("error", `${action}失败: ${err.message}`);
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
    let uploadedFilePath: string | null = null;
    
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
      const folderId = formData.get('folder_id') as string;
      const autoGenerateCover = formData.get('auto_generate_cover') === 'on';

      // 2. 上传文件到 Supabase Storage (使用公共权限绕过 Auth Session 校验)
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `resources/${fileName}`;
      uploadedFilePath = filePath;

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

      // 4. Generate AI cover if selected
      let generatedCoverUrl = null;
      if (autoGenerateCover) {
        try {
          generatedCoverUrl = await generateCoverForResource(title || selectedFile.name, folderId);
          console.log("AI 封面生成成功:", generatedCoverUrl);
        } catch (err: any) {
          console.warn("AI 封面生成失败, 继续保存资源:", err.message);
        }
      }
      setUploadProgress(85);

      // 5. 插入元数据到数据库
      const newResource = {
        title: title || selectedFile.name,
        category: category,
        file_type: fileExt?.toUpperCase() || 'FILE',
        file_url: publicUrl,
        downloads: 0,
        min_level: minLevel,
        status: 'published',
        folder_id: folderId || null,
        cover_url: generatedCoverUrl
      };

      console.log("正在写入数据库记录...", newResource);
      const dbData = await requestResourceApi<Resource>("/api/resources", {
        method: "POST",
        body: JSON.stringify(newResource),
      });

      console.log("数据库记录写入成功");
      setUploadProgress(100);

      if (dbData) {
        setResources(prev => [{ ...dbData, status: dbData.status || 'published' }, ...prev]);
      }
      
      setTimeout(() => {
        setShowUpload(false);
        setSelectedFile(null);
        setUploadProgress(0);
        showToast("success", '恭喜！资源已成功上传并同步至数据库。');
        // 强制重新获取一次数据，确保状态同步
        fetchResources();
      }, 500);
    } catch (err: any) {
      console.error("提交过程发生错误:", err);
      if (uploadedFilePath) {
        const { error: cleanupError } = await supabase.storage
          .from('course-materials')
          .remove([uploadedFilePath]);

        if (cleanupError) {
          console.warn("资源上传失败后的文件清理失败:", cleanupError.message);
        }
      }
      setError(err.message);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setIsCreatingFolder(true);
    try {
      const dbData = await requestResourceApi<FolderItem>("/api/folders", {
        method: "POST",
        body: JSON.stringify({ name: newFolderName.trim() }),
      });

      if (dbData) {
        setFolders(prev => [...prev, dbData].sort((a, b) => a.name.localeCompare(b.name)));
        showToast("success", "文件夹创建成功");
        setShowFolderModal(false);
        setNewFolderName("");
      }
    } catch (err: any) {
      showToast("error", `创建文件夹失败: ${err.message}`);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!safeConfirm('确定要删除该资源吗？')) return;

    try {
      await requestResourceApi<{ id: string | number }>(`/api/resources/${id}`, {
        method: "DELETE",
      });

      setResources(resources.filter(r => r.id !== id));
    } catch (err: any) {
      showToast("error", `删除失败: ${err.message}`);
    }
  };

  const filteredResources = resources.filter(r => {
    const matchesSearch = searchQuery.trim() === ""
      ? true
      : r.title.toLowerCase().includes(searchQuery.toLowerCase())
        || r.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" ? true : (r.status || "published") === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#f5f5f7] pt-28 pb-12 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#1d1d1f]">资源管理</h1>
            <p className="text-[#86868b] mt-1">
              共 {resources.length} 份资源 ·
              草稿 {resources.filter(r => (r.status || 'published') === 'draft').length} 份 ·
              已发布 {resources.filter(r => (r.status || 'published') === 'published').length} 份
            </p>
          </div>
          <div className="flex items-center gap-3 self-start md:self-auto">
            {selectedIds.size > 0 && (
              <button 
                onClick={handleGenerateSelectedCovers}
                disabled={isBatchGenerating}
                className={`bg-white hover:bg-emerald-50 text-[#1d1d1f] flex items-center gap-2 px-6 py-3 rounded-full font-bold shadow-sm transition-all border border-emerald-200 ${isBatchGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Zap className="w-5 h-5 text-emerald-500" />
                {isBatchGenerating ? '生成中...' : `生成所选封面 (${selectedIds.size})`}
              </button>
            )}
            <button 
              onClick={() => setShowFolderModal(true)}
              className="bg-white hover:bg-gray-50 text-[#1d1d1f] flex items-center gap-2 px-6 py-3 rounded-full font-bold shadow-sm transition-all border border-gray-200"
            >
              <Plus className="w-5 h-5" />
              新建文件夹
            </button>
            <button 
              onClick={() => setShowUpload(true)}
              className="btn-primary flex items-center gap-2 px-6 shadow-lg shadow-blue-500/20"
            >
              <Plus className="w-5 h-5" />
              上传新课件
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-white mb-8 flex flex-col md:flex-row gap-4 shimmer-card group relative z-10">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b]" />
            <input 
              type="text" 
              placeholder="搜索资源名称、分类..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 outline-none transition-all"
            />
          </div>
          <div className="flex gap-2 items-center">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 rounded-2xl bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#ececef] transition-colors outline-none font-medium text-sm"
            >
              <option value="all">全部状态</option>
              <option value="published">已发布</option>
              <option value="draft">草稿</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#ececef] transition-colors">
              <Filter className="w-4 h-4" />
              筛选分类
            </button>
          </div>
        </div>

        {error && filteredResources.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 bg-rose-50/50 border border-rose-100 rounded-[2.5rem] mb-8">
            <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
            <h3 className="text-xl font-bold text-[#1d1d1f] mb-2">资源加载失败</h3>
            <p className="text-rose-600 mb-6 max-w-md text-center px-4">{error}</p>
            <button
              onClick={fetchResources}
              className="px-6 py-3 rounded-2xl bg-[#0071e3] text-white font-bold hover:bg-[#0077ed] transition-all ripple-target"
            >
              重新加载
            </button>
          </div>
        )}

        {filteredResources.length === 0 && !error ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2.5rem] shadow-sm border border-white shimmer-border group relative z-10">
            <FileText className="w-16 h-16 text-[#86868b]/20 mb-6" />
            <h3 className="text-2xl font-bold text-[#1d1d1f] mb-2">
              {resources.length === 0 ? "暂无资源数据" : "没有匹配的资源"}
            </h3>
            <p className="text-[#86868b] text-center max-w-md px-4">
              {resources.length === 0
                ? "请点击右上角「上传新课件」来添加第一份真实资源。"
                : "请尝试调整搜索关键词或状态过滤条件。"}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {folders.map(folder => {
              const folderResources = filteredResources.filter(r => r.folder_id === folder.id);
              const isExpanded = expandedFolders.includes(folder.id);
              
              if (folderResources.length === 0 && searchQuery !== "") return null;

              return (
                <div key={folder.id} className="bg-white rounded-[2.5rem] shadow-[0_0_20px_rgba(0,113,227,0.1)] hover:shadow-[0_0_30px_rgba(0,113,227,0.2)] hover:border-[#0071e3]/40 border border-[#0071e3]/20 overflow-hidden group/folder relative z-10 transition-all duration-300">
                  {/* 顶部流光渐变线 */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0071e3] via-[#32d74b] to-[#0071e3] opacity-70 group-hover/folder:opacity-100 transition-opacity duration-300"></div>
                  
                  <div 
                    className="px-8 py-6 bg-[#fafafa]/50 flex items-center justify-between cursor-pointer hover:bg-blue-50/50 transition-colors relative z-10"
                    onClick={() => toggleFolderExpansion(folder.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0071e3] flex items-center justify-center shadow-sm">
                        <Folder className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-[#1d1d1f]">{folder.name}</h2>
                        <p className="text-sm text-[#86868b] mt-1">{folderResources.length} 个资源</p>
                      </div>
                    </div>
                    <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white shadow-sm border border-transparent hover:border-gray-200 text-[#86868b] transition-all">
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  {isExpanded && (
                    <div className="overflow-x-auto border-t border-[#f5f5f7]">
                      {renderResourceTable(folderResources)}
                    </div>
                  )}
                </div>
              );
            })}

            {(() => {
              const unassignedResources = filteredResources.filter(r => !r.folder_id);
              if (unassignedResources.length === 0) return null;

              const isExpanded = expandedFolders.includes('unassigned');

              return (
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-white overflow-hidden shimmer-border group relative z-10">
                  <div 
                    className="px-8 py-6 bg-[#fafafa] flex items-center justify-between cursor-pointer hover:bg-[#f5f5f7] transition-colors"
                    onClick={() => toggleFolderExpansion('unassigned')}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gray-100 text-[#86868b] flex items-center justify-center shadow-sm">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-[#1d1d1f]">未分配资源</h2>
                        <p className="text-sm text-[#86868b] mt-1">{unassignedResources.length} 个资源</p>
                      </div>
                    </div>
                    <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white shadow-sm border border-transparent hover:border-gray-200 text-[#86868b] transition-all">
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  {isExpanded && (
                    <div className="overflow-x-auto border-t border-[#f5f5f7]">
                      {renderResourceTable(unassignedResources)}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
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
            className="relative w-full max-w-lg bg-white rounded-[3rem] p-10 shadow-2xl shimmer-border group relative z-10"
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
                <label className="block text-sm font-medium mb-2 text-[#1d1d1f]">所属文件夹 (可选)</label>
                <select name="folder_id" className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 outline-none transition-all">
                  <option value="">无文件夹 (直接显示)</option>
                  {folders.map(folder => (
                    <option key={folder.id} value={folder.id}>{folder.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-[#f5f5f7]">
                <input 
                  type="checkbox" 
                  id="auto_generate_cover"
                  name="auto_generate_cover" 
                  defaultChecked
                  className="w-5 h-5 rounded border-gray-300 text-[#0071e3] focus:ring-[#0071e3]"
                />
                <label htmlFor="auto_generate_cover" className="text-sm font-medium text-[#1d1d1f] flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-500" />
                  上传成功后使用 AI 自动生成课件封面
                </label>
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
                className={`w-full py-4 rounded-2xl font-bold shadow-lg transition-all relative overflow-hidden ripple-target ${
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
      {/* Edit Resource Modal */}
      {showEditModal && editingResource && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowEditModal(false)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-lg bg-white rounded-[3rem] p-10 shadow-2xl shimmer-border group relative z-10"
          >
            <button 
              onClick={() => setShowEditModal(false)}
              className="absolute right-8 top-8 w-10 h-10 rounded-full bg-[#f5f5f7] flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-2xl font-bold mb-8 text-[#1d1d1f]">编辑资源：{editingResource.title}</h2>
            
            <form onSubmit={handleUpdateResource} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-[#1d1d1f]">课件名称</label>
                <input 
                  required
                  name="title"
                  type="text" 
                  defaultValue={editingResource.title}
                  className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 outline-none transition-all"
                  placeholder="输入课件名称..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-[#1d1d1f]">课件封面</label>
                <div className="flex gap-4 items-end">
                  <div className="w-24 h-24 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 border border-gray-200">
                    {editingResource.cover_url ? (
                      <img src={editingResource.cover_url} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <FileText className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input 
                      name="cover_url"
                      type="text" 
                      defaultValue={editingResource.cover_url || ""}
                      className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 outline-none transition-all text-sm"
                      placeholder="封面图片 URL"
                    />
                    <button
                      type="button"
                      disabled={isGeneratingCover}
                      onClick={async () => {
                        setIsGeneratingCover(true);
                        try {
                          const url = await generateCoverForResource(editingResource.title, editingResource.folder_id);
                          if (url) {
                            setEditingResource({ ...editingResource, cover_url: url });
                          }
                        } catch (err: any) {
                          showToast("error", "生成失败: " + err.message);
                        } finally {
                          setIsGeneratingCover(false);
                        }
                      }}
                      className="flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-4 py-2 rounded-lg"
                    >
                      <Zap className="w-4 h-4" />
                      {isGeneratingCover ? "AI 生成中..." : "使用 AI 自动生成"}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-[#1d1d1f]">所属文件夹</label>
                <select 
                  name="folder_id"
                  defaultValue={editingResource.folder_id || ""}
                  className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 outline-none transition-all"
                >
                  <option value="">无文件夹 (直接显示)</option>
                  {folders.map(folder => (
                    <option key={folder.id} value={folder.id}>{folder.name}</option>
                  ))}
                </select>
              </div>

              <button 
                type="submit" 
                className="w-full py-4 rounded-2xl font-bold shadow-lg transition-all bg-[#0071e3] text-white hover:bg-[#0077ed] shadow-blue-500/20 ripple-target"
              >
                保存修改
              </button>
            </form>
          </motion.div>
        </div>
      )}
      {/* Create Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowFolderModal(false)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-md bg-white rounded-[3rem] p-10 shadow-2xl z-10"
          >
            <button 
              onClick={() => setShowFolderModal(false)}
              className="absolute right-8 top-8 w-10 h-10 rounded-full bg-[#f5f5f7] flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-2xl font-bold mb-8 text-[#1d1d1f]">新建文件夹</h2>
            
            <form onSubmit={handleCreateFolder} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-[#1d1d1f]">文件夹名称</label>
                <input 
                  required
                  autoFocus
                  type="text" 
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#f5f5f7] border-transparent focus:bg-white focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 outline-none transition-all"
                  placeholder="输入文件夹名称..."
                />
              </div>

              <button 
                disabled={!newFolderName.trim() || isCreatingFolder}
                type="submit" 
                className={`w-full py-4 rounded-2xl font-bold shadow-lg transition-all ${
                  !newFolderName.trim() || isCreatingFolder
                    ? "bg-[#d2d2d7] text-white cursor-not-allowed"
                    : "bg-[#0071e3] text-white hover:bg-[#0077ed] shadow-blue-500/20"
                }`}
              >
                {isCreatingFolder ? "正在创建..." : "创建"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
