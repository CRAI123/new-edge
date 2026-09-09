import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Edit, Trash2, Calendar, DollarSign, Package, XCircle, Clock,
  Info, CheckCircle, Truck, ExternalLink, X, FileText, User, Phone,
  Layers, Printer as PrinterIcon, Share2, Download, Copy,
  ChevronRight, RefreshCw, QrCode, Sparkles, MapPin, ArrowLeftRight
} from "lucide-react";
import QRCode from "qrcode";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import EmbeddedLogisticsViewer from "@/components/EmbeddedLogisticsViewer";
import { showToast } from "@/lib/utils";
import { useUserStore } from "@/store/useUserStore";

type OrderStatus =
  | "model_check"
  | "production_prep"
  | "printing"
  | "print_done"
  | "post_processing"
  | "ready_to_ship"
  | "cancelled";

type OrderChannel = "wechat_manual" | "wechat_online";
type DrawerTab = "detail" | "logistics" | "share";

interface Order {
  id: string;
  order_no: string;
  customer_name: string;
  customer_wechat?: string;
  model_name: string;
  quantity: number;
  channel: OrderChannel;
  price: number;
  status: OrderStatus;
  created_at: string;
  estimated_print_hours?: number;
  tracking_no?: string;
  status_timestamps: Record<string, string>;
}

const orderStatusMap: Record<OrderStatus, { label: string; color: string; bg: string; desc: string }> = {
  model_check: { label: "准备检查模型", color: "#f59e0b", bg: "#FFFBF0", desc: "订单已创建，等待技术人员检查3D模型的可打印性" },
  production_prep: { label: "准备排产", color: "#8b5cf6", bg: "#F5F3FF", desc: "模型检查通过，正在安排打印排产计划" },
  printing: { label: "打印中", color: "#0071e3", bg: "#E6F4FF", desc: "3D打印机正在工作中，请耐心等待" },
  print_done: { label: "打印完成等待后处理", color: "#06b6d4", bg: "#ECFEFF", desc: "打印已完成，准备进行支撑拆除与打磨" },
  post_processing: { label: "后期处理结束准备打包", color: "#84cc16", bg: "#F7FEE7", desc: "后处理已完成，准备进行质检与打包" },
  ready_to_ship: { label: "等待发货", color: "#28cd41", bg: "#F6FFED", desc: "已打包完成，等待快递揽收" },
  cancelled: { label: "已取消", color: "#ef4444", bg: "#FEF2F2", desc: "订单已取消" },
};

const STATUS_ORDER: OrderStatus[] = [
  "model_check",
  "production_prep",
  "printing",
  "print_done",
  "post_processing",
  "ready_to_ship",
];

const STATUS_STEPS = STATUS_ORDER.map((s) => ({
  key: s,
  ...orderStatusMap[s],
  icon: STATUS_ICON(s),
}));

function STATUS_ICON(status: OrderStatus) {
  const map: Record<OrderStatus, React.ReactNode> = {
    model_check: <Search className="w-4 h-4" />,
    production_prep: <Layers className="w-4 h-4" />,
    printing: <PrinterIcon className="w-4 h-4" />,
    print_done: <CheckCircle className="w-4 h-4" />,
    post_processing: <Sparkles className="w-4 h-4" />,
    ready_to_ship: <Package className="w-4 h-4" />,
    cancelled: <XCircle className="w-4 h-4" />,
  };
  return map[status];
}

const getApiBaseUrl = () => {
  const explicitBase = import.meta.env.VITE_API_BASE_URL;
  if (explicitBase) return explicitBase;
  return "";
};

const getAdminAccessToken = async () => {
  const { data: sessData, error: sessError } = await supabase.auth.getSession();
  if (sessError) throw new Error(`获取登录状态失败: ${sessError.message}`);
  const token = sessData.session?.access_token;
  if (token) return token;

  const user = useUserStore.getState().user;
  if (user && user.role === "admin") {
    const fakeToken = `dev-admin-mock:${encodeURIComponent(user.email || "admin")}:${encodeURIComponent(user.id || "local")}`;
    return fakeToken;
  }

  throw new Error("登录状态已失效，请重新登录管理员账号。");
};

const requestOrderApi = async <T,>(
  path: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${getApiBaseUrl()}${path}`;
  const token = await getAdminAccessToken();

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, { ...options, headers });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error || "订单接口请求失败，请检查后端服务。");
  }
  return payload as T;
};

export default function AdminOrderManager() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddOrderModal, setShowAddOrderModal] = useState(false);
  const [newOrder, setNewOrder] = useState<Partial<Order>>({
    customer_name: "",
    customer_wechat: "",
    model_name: "",
    price: 0,
    estimated_print_hours: 0,
    quantity: 1,
    tracking_no: "",
  });

  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [currentOrderToUpdateStatus, setCurrentOrderToUpdateStatus] =
    useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus | string>("");

  const [showUpdateTrackingModal, setShowUpdateTrackingModal] = useState(false);
  const [currentOrderToUpdateTracking, setCurrentOrderToUpdateTracking] =
    useState<Order | null>(null);
  const [newTrackingNumber, setNewTrackingNumber] = useState("");

  const [showShareMaterialModal, setShowShareMaterialModal] = useState(false);
  const [shareMaterialImageUrl, setShareMaterialImageUrl] = useState<
    string | null
  >(null);
  const [generatingShareMaterial, setGeneratingShareMaterial] = useState(false);

  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("detail");
  const [drawerShareLoading, setDrawerShareLoading] = useState(false);
  const [drawerShareUrl, setDrawerShareUrl] = useState<string | null>(null);
  const [drawerQRUrl, setDrawerQRUrl] = useState<string | null>(null);

  const generateDrawerQR = useCallback(async (orderNo: string) => {
    try {
      const url = `${window.location.origin}/order/${orderNo}`;
      const canvas = qrCanvasRef.current || document.createElement("canvas");
      await QRCode.toCanvas(canvas, url, {
        width: 320,
        margin: 2,
        color: { dark: "#1d1d1f", light: "#ffffff" },
        errorCorrectionLevel: "H",
      });
      qrCanvasRef.current = canvas;
      setDrawerQRUrl(canvas.toDataURL("image/png", 0.95));
    } catch {
      setDrawerQRUrl(null);
    }
  }, []);

  const handleUpdateStatus = async (orderId: string) => {
    try {
      await requestOrderApi(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      setShowUpdateStatusModal(false);
      setCurrentOrderToUpdateStatus(null);
      setNewStatus("");
      fetchOrders();
      showToast("success", "订单状态已更新");
    } catch (err: any) {
      showToast("error", err.message || "更新状态失败");
      setError(err.message);
    }
  };

  const handleUpdateTrackingNumber = async (orderId: string) => {
    try {
      await requestOrderApi(`/api/orders/${orderId}/tracking`, {
        method: "PATCH",
        body: JSON.stringify({ tracking_no: newTrackingNumber }),
      });
      setShowUpdateTrackingModal(false);
      setCurrentOrderToUpdateTracking(null);
      setNewTrackingNumber("");
      fetchOrders();
      showToast("success", "运单号已更新");
    } catch (err: any) {
      showToast("error", err.message || "更新运单号失败");
      setError(err.message);
    }
  };

  const handleGenerateShareMaterial = async (order: Order) => {
    setGeneratingShareMaterial(true);
    setError(null);
    try {
      const result = await requestOrderApi<{ imageUrl: string }>(
        `/api/orders/${order.id}/generate-share-material`,
        { method: "PATCH" }
      );
      setShareMaterialImageUrl(result.imageUrl);
      setShowShareMaterialModal(true);
    } catch (err: any) {
      showToast("error", `生成分享图失败: ${err.message}`);
    } finally {
      setGeneratingShareMaterial(false);
    }
  };

  const handleDrawerGenerateShare = async () => {
    if (!selectedOrder) return;
    setDrawerShareLoading(true);
    setDrawerShareUrl(null);
    try {
      const result = await requestOrderApi<{ imageUrl: string }>(
        `/api/orders/${selectedOrder.id}/generate-share-material`,
        { method: "PATCH" }
      );
      setDrawerShareUrl(result.imageUrl);
      showToast("success", "分享图生成成功");
    } catch (err: any) {
      showToast("error", `生成分享图失败: ${err.message}`);
    } finally {
      setDrawerShareLoading(false);
    }
  };

  const openDrawer = (order: Order, tab: DrawerTab = "detail") => {
    setSelectedOrder(order);
    setDrawerTab(tab);
    setDrawerShareUrl(null);
    setDrawerQRUrl(null);
    setDrawerOpen(true);
    setTimeout(() => generateDrawerQR(order.order_no), 50);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => {
      setSelectedOrder(null);
      setDrawerShareUrl(null);
      setDrawerQRUrl(null);
    }, 300);
  };

  const downloadDrawerQR = () => {
    if (!drawerQRUrl || !selectedOrder) return;
    const a = document.createElement("a");
    a.href = drawerQRUrl;
    a.download = `订单二维码_${selectedOrder.order_no}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast("success", "二维码已下载");
  };

  const copyDrawerQRImage = async () => {
    if (!drawerQRUrl) return;
    try {
      const blob = await fetch(drawerQRUrl).then(r => r.blob());
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob })
      ]);
      showToast("success", "二维码图片已复制");
    } catch {
      showToast("error", "浏览器不支持直接复制图片，请下载后复制");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await requestOrderApi<{ success: boolean; data: Order[] }>("/api/orders");
      setOrders(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewOrder((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddOrder = async () => {
    try {
      const orderToCreate = {
        ...newOrder,
        price: parseFloat(newOrder.price.toString()),
        quantity: parseInt(newOrder.quantity?.toString() || "1", 10),
        estimated_print_hours: parseFloat(
          newOrder.estimated_print_hours?.toString() || "0"
        ),
        created_at: new Date().toISOString(),
        status: "model_check" as OrderStatus,
        channel: "wechat_manual" as OrderChannel,
        status_timestamps: { model_check: new Date().toISOString() },
      };
      await requestOrderApi("/api/orders", {
        method: "POST",
        body: JSON.stringify(orderToCreate),
      });
      setShowAddOrderModal(false);
      setNewOrder({
        customer_name: "",
        customer_wechat: "",
        model_name: "",
        price: 0,
        estimated_print_hours: 0,
        quantity: 1,
        tracking_no: "",
      });
      fetchOrders();
      showToast("success", "订单创建成功");
    } catch (err: any) {
      showToast("error", err.message || "创建订单失败");
    }
  };

  const getCurrentStepIndex = (order: Order) =>
    order.status === "cancelled"
      ? -1
      : STATUS_ORDER.findIndex((s) => s === order.status);

  const getProgressPercent = (order: Order) => {
    const idx = getCurrentStepIndex(order);
    if (idx < 0) return 0;
    return Math.round(((idx + 1) / STATUS_ORDER.length) * 100);
  };

  const copyValue = (val: string, label: string = "内容") => {
    navigator.clipboard
      .writeText(val)
      .then(() => showToast("success", `${label}已复制`))
      .catch(() => showToast("error", "复制失败"));
  };

  if (loading)
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center text-xl">
        Loading orders...
      </div>
    );
  if (error)
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center text-xl text-red-500">
        Error: {error}
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f5f5f7] pt-28 pb-12 px-6 md:px-12">
      <canvas ref={qrCanvasRef} className="hidden" />
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#1d1d1f]">订单管理</h1>
            <p className="text-[#86868b] mt-1">
              管理所有客户订单，包括手动录入和线上订单
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddOrderModal(true)}
              className="btn-primary flex items-center gap-2 px-6"
            >
              <Plus className="w-4 h-4" />
              添加新订单
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-white shimmer-border group relative z-10">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#f5f5f7]">
              <thead className="bg-[#f5f5f7]">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-[#86868b] uppercase tracking-wider"
                  >
                    订单ID
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-[#86868b] uppercase tracking-wider"
                  >
                    客户名称
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-[#86868b] uppercase tracking-wider"
                  >
                    微信ID
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-[#86868b] uppercase tracking-wider"
                  >
                    金额
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-[#86868b] uppercase tracking-wider"
                  >
                    状态
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-[#86868b] uppercase tracking-wider"
                  >
                    创建时间
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-[#86868b] uppercase tracking-wider"
                  >
                    单号
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">操作</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#f5f5f7]">
                {orders && orders.length > 0 ? (
                  orders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-[#fafafa] transition-colors cursor-pointer group/row"
                      onClick={() => openDrawer(order, "detail")}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#1d1d1f] font-mono">
                        {order.order_no}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#1d1d1f]">
                        {order.customer_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#1d1d1f]">
                        {order.customer_wechat}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[#1d1d1f]">
                        ¥{order.price}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#1d1d1f]">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                          style={{
                            backgroundColor: orderStatusMap[order.status].bg,
                            color: orderStatusMap[order.status].color,
                          }}
                        >
                          {STATUS_ICON(order.status)}
                          {orderStatusMap[order.status].label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#1d1d1f]">
                        {new Date(order.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#1d1d1f] font-mono">
                        {order.tracking_no || (
                          <span className="text-[#c7c7cc]">未录入</span>
                        )}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            setCurrentOrderToUpdateStatus(order);
                            setShowUpdateStatusModal(true);
                            setNewStatus(order.status);
                          }}
                          className="text-[#0071e3] hover:text-[#005bb5] mr-3 text-xs font-semibold inline-flex items-center gap-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          更新状态
                        </button>
                        <button
                          onClick={() => {
                            setCurrentOrderToUpdateTracking(order);
                            setShowUpdateTrackingModal(true);
                            setNewTrackingNumber(order.tracking_no || "");
                          }}
                          className="text-[#0071e3] hover:text-[#005bb5] mr-3 text-xs font-semibold inline-flex items-center gap-1"
                        >
                          <Info className="w-4 h-4" />
                          录入单号
                        </button>
                        {order.tracking_no && (
                          <button
                            onClick={() => openDrawer(order, "logistics")}
                            className="text-[#8b5cf6] hover:text-[#7c3aed] mr-3 text-xs font-bold inline-flex items-center gap-1"
                          >
                            <Truck className="w-4 h-4" />
                            轨迹查询
                          </button>
                        )}
                        <button
                          onClick={() => openDrawer(order, "share")}
                          className="text-[#28cd41] hover:text-[#1e9a34] mr-3 text-xs font-semibold inline-flex items-center gap-1"
                        >
                          <Package className="w-4 h-4" />
                          生成分享图
                        </button>
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="text-[#0071e3] hover:text-[#005bb5] text-xs font-semibold inline-flex items-center gap-1"
                        >
                          <Edit className="w-4 h-4" />
                          编辑
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-6 py-16 text-center"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <FileText className="w-12 h-12 text-[#c7c7cc]/30 mb-4" />
                        <p className="text-[#86868b] font-medium">
                          暂无订单数据
                        </p>
                        <p className="text-sm text-[#c7c7cc] mt-1">
                          点击右上角「添加新订单」开始
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ============ Drawer - Order Detail Drawer ============ */}
        <AnimatePresence>
          {drawerOpen && selectedOrder && (
            <>
              {/* Backdrop */}
              <motion.div
                key="drawer-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                onClick={closeDrawer}
              />
              {/* Drawer Panel */}
              <motion.div
                key="drawer-panel"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{
                  type: "spring",
                  stiffness: 280,
                  damping: 30,
                }}
                className="fixed top-0 right-0 h-full md:w-1/2 w-full bg-[#f5f5f7] z-50 shadow-2xl flex flex-col md:rounded-l-[2.5rem] overflow-hidden"
              >
                {/* Header */}
                <div className="bg-white px-6 md:px-8 pt-6 pb-4 border-b border-[#f5f5f7] flex-shrink-0">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor:
                            orderStatusMap[selectedOrder.status].bg,
                          color: orderStatusMap[selectedOrder.status].color,
                        }}
                      >
                        {STATUS_ICON(selectedOrder.status)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#86868b] uppercase tracking-wider mb-0.5">
                          订单号
                        </p>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-black text-[#1d1d1f] font-mono truncate">
                            {selectedOrder.order_no}
                          </h2>
                          <button
                            onClick={() =>
                              copyValue(selectedOrder.order_no, "订单号")
                            }
                            className="p-1.5 rounded-lg hover:bg-[#f5f5f7] text-[#86868b] hover:text-[#0071e3] transition-colors flex-shrink-0"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={closeDrawer}
                      className="p-2.5 rounded-2xl hover:bg-[#f5f5f7] text-[#86868b] hover:text-[#1d1d1f] transition-colors flex-shrink-0"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-2 p-1.5 rounded-2xl bg-[#f5f5f7]">
                    {(
                      [
                        {
                          key: "detail",
                          label: "订单详情",
                          icon: <FileText className="w-4 h-4" />,
                        },
                        {
                          key: "logistics",
                          label: "物流追踪",
                          icon: <Truck className="w-4 h-4" />,
                        },
                        {
                          key: "share",
                          label: "分享生成",
                          icon: <Share2 className="w-4 h-4" />,
                        },
                      ] as { key: DrawerTab; label: string; icon: React.ReactNode }[]
                    ).map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setDrawerTab(tab.key)}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                          drawerTab === tab.key
                            ? "bg-white text-[#0071e3] shadow-sm"
                            : "text-[#86868b] hover:text-[#1d1d1f]"
                        }`}
                      >
                        {tab.icon}
                        <span className="hidden sm:inline">{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6">
                  <AnimatePresence mode="wait">
                    {/* Tab: Detail */}
                    {drawerTab === "detail" && (
                      <motion.div
                        key="tab-detail"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-6"
                      >
                        {/* Status Card */}
                        <div
                          className="rounded-[2rem] p-6 relative overflow-hidden shimmer-border"
                          style={{
                            backgroundColor:
                              orderStatusMap[selectedOrder.status].bg,
                            border: `1px solid ${orderStatusMap[selectedOrder.status].color}15`,
                          }}
                        >
                          <div
                            className="absolute -top-16 -right-16 w-52 h-52 rounded-full blur-3xl opacity-20"
                            style={{
                              backgroundColor:
                                orderStatusMap[selectedOrder.status].color,
                            }}
                          />
                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <div
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-2"
                                  style={{
                                    backgroundColor: "white",
                                    color: orderStatusMap[selectedOrder.status]
                                      .color,
                                  }}
                                >
                                  {STATUS_ICON(selectedOrder.status)}
                                  <span className="text-xs font-bold">
                                    {orderStatusMap[selectedOrder.status].label}
                                  </span>
                                </div>
                                <p className="text-sm text-[#1d1d1f]/70">
                                  {
                                    orderStatusMap[selectedOrder.status].desc
                                  }
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-[#86868b] font-bold uppercase tracking-wider mb-1">
                                  进度
                                </p>
                                <p className="text-2xl font-black gradient-text-dual">
                                  {getProgressPercent(selectedOrder)}%
                                </p>
                              </div>
                            </div>
                            <div className="relative h-2.5 rounded-full bg-white/60 overflow-hidden">
                              <motion.div
                                className="absolute inset-y-0 left-0 rounded-full"
                                style={{
                                  backgroundColor:
                                    orderStatusMap[selectedOrder.status].color,
                                }}
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${getProgressPercent(selectedOrder)}%`,
                                }}
                                transition={{ duration: 0.6 }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <button
                            onClick={() => {
                              setCurrentOrderToUpdateStatus(selectedOrder);
                              setShowUpdateStatusModal(true);
                              setNewStatus(selectedOrder.status);
                              closeDrawer();
                            }}
                            className="p-4 rounded-2xl bg-white hover:bg-[#0071e3] hover:text-white text-[#0071e3] transition-all group shimmer-border flex flex-col items-center gap-2"
                          >
                            <CheckCircle className="w-5 h-5" />
                            <span className="text-xs font-bold">更新状态</span>
                          </button>
                          <button
                            onClick={() => {
                              setCurrentOrderToUpdateTracking(selectedOrder);
                              setShowUpdateTrackingModal(true);
                              setNewTrackingNumber(
                                selectedOrder.tracking_no || ""
                              );
                              closeDrawer();
                            }}
                            className="p-4 rounded-2xl bg-white hover:bg-[#28cd41] hover:text-white text-[#28cd41] transition-all group shimmer-border flex flex-col items-center gap-2"
                          >
                            <MapPin className="w-5 h-5" />
                            <span className="text-xs font-bold">录入单号</span>
                          </button>
                          {selectedOrder.tracking_no && (
                            <button
                              onClick={() => setDrawerTab("logistics")}
                              className="p-4 rounded-2xl bg-white hover:bg-[#8b5cf6] hover:text-white text-[#8b5cf6] transition-all group shimmer-border flex flex-col items-center gap-2"
                            >
                              <Truck className="w-5 h-5" />
                              <span className="text-xs font-bold">
                                轨迹查询
                              </span>
                            </button>
                          )}
                          <button
                            onClick={() => setDrawerTab("share")}
                            className="p-4 rounded-2xl bg-white hover:bg-[#f59e0b] hover:text-white text-[#f59e0b] transition-all group shimmer-border flex flex-col items-center gap-2"
                          >
                            <QrCode className="w-5 h-5" />
                            <span className="text-xs font-bold">生成分享</span>
                          </button>
                        </div>

                        {/* Order Info */}
                        <div className="bg-white rounded-[2rem] p-6 shimmer-border">
                          <h3 className="font-bold text-[#1d1d1f] mb-5 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center">
                              <FileText className="w-4 h-4" />
                            </div>
                            订单信息
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                              {
                                k: "客户姓名",
                                v: selectedOrder.customer_name,
                                icon: <User className="w-4 h-4" />,
                                copy: true,
                              },
                              {
                                k: "微信ID",
                                v: selectedOrder.customer_wechat || "—",
                                icon: <Phone className="w-4 h-4" />,
                                copy: true,
                              },
                              {
                                k: "模型名称",
                                v: selectedOrder.model_name,
                                icon: <PrinterIcon className="w-4 h-4" />,
                              },
                              {
                                k: "打印数量",
                                v: `${selectedOrder.quantity} 件`,
                                icon: <Layers className="w-4 h-4" />,
                              },
                              {
                                k: "订单金额",
                                v: `¥${selectedOrder.price}`,
                                icon: <DollarSign className="w-4 h-4" />,
                                bold: true,
                              },
                              {
                                k: "预估时长",
                                v: `${selectedOrder.estimated_print_hours || 0} 小时`,
                                icon: <Clock className="w-4 h-4" />,
                              },
                              {
                                k: "创建时间",
                                v: new Date(
                                  selectedOrder.created_at
                                ).toLocaleString(),
                                icon: <Calendar className="w-4 h-4" />,
                              },
                              {
                                k: "运单号",
                                v: selectedOrder.tracking_no || (
                                  <span className="text-[#c7c7cc]">
                                    未录入
                                  </span>
                                ),
                                icon: <Truck className="w-4 h-4" />,
                                copy: !!selectedOrder.tracking_no,
                              },
                            ].map((row, i) => (
                              <div
                                key={i}
                                className="p-4 rounded-2xl bg-[#f5f5f7] hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-[#e5e5ea]"
                              >
                                <div className="flex items-center gap-1.5 mb-2 text-[#86868b]">
                                  <span className="text-[#0071e3]">
                                    {row.icon}
                                  </span>
                                  <span className="text-xs font-bold">
                                    {row.k}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                  <p
                                    className={`text-sm break-all ${
                                      row.bold
                                        ? "font-black text-[#1d1d1f] text-lg"
                                        : "font-bold text-[#1d1d1f]"
                                    }`}
                                  >
                                    {row.v}
                                  </p>
                                  {row.copy && typeof row.v === "string" && row.v !== "—" && (
                                    <button
                                      onClick={() => copyValue(row.v as string, row.k)}
                                      className="p-1.5 rounded-lg hover:bg-[#f5f5f7] text-[#86868b] hover:text-[#0071e3] transition-colors flex-shrink-0"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Status Timeline */}
                        <div className="bg-white rounded-[2rem] p-6 shimmer-border">
                          <h3 className="font-bold text-[#1d1d1f] mb-6 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-[#28cd41]/10 text-[#28cd41] flex items-center justify-center">
                              <Clock className="w-4 h-4" />
                            </div>
                            状态时间线
                            <span className="ml-auto text-xs font-bold text-[#86868b] px-2.5 py-1 rounded-full bg-[#f5f5f7]">
                              {getCurrentStepIndex(selectedOrder) < 0
                                ? "已取消"
                                : `第 ${getCurrentStepIndex(selectedOrder) + 1} / ${STATUS_ORDER.length} 步`}
                            </span>
                          </h3>

                          {selectedOrder.status === "cancelled" ? (
                            <div className="flex items-center gap-4 p-5 rounded-2xl bg-[#FEF2F2] border border-[#ef4444]/15">
                              <div className="w-12 h-12 rounded-2xl bg-[#ef4444]/10 text-[#ef4444] flex items-center justify-center flex-shrink-0">
                                <XCircle className="w-6 h-6" />
                              </div>
                              <div>
                                <p className="font-bold text-[#1d1d1f]">
                                  订单已取消
                                </p>
                                <p className="text-sm text-[#86868b]">
                                  此订单已被取消，不再进行后续流程
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="relative pl-8">
                              <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gradient-to-b from-[#28cd41] via-[#0071e3] to-[#e5e5ea]" />
                              {STATUS_STEPS.map((step, i) => {
                                const currentIdx = getCurrentStepIndex(
                                  selectedOrder
                                );
                                const done = i <= currentIdx;
                                const isCurrent = i === currentIdx;
                                const ts =
                                  selectedOrder.status_timestamps?.[step.key];
                                return (
                                  <motion.div
                                    key={step.key}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="relative mb-5 last:mb-0"
                                  >
                                    <div
                                      className={`absolute -left-1.5 w-6 h-6 rounded-full flex items-center justify-center border-[3px] border-white shadow-md ${
                                        isCurrent ? "ring-4 ring-offset-2" : ""
                                      }`}
                                      style={{
                                        backgroundColor: done
                                          ? step.color
                                          : "#d2d2d7",
                                        boxShadow: isCurrent
                                          ? `0 0 0 8px ${step.color}22`
                                          : undefined,
                                      }}
                                    >
                                      {isCurrent ? (
                                        <div className="text-white">
                                          {step.icon}
                                        </div>
                                      ) : done ? (
                                        <CheckCircle className="w-3.5 h-3.5 text-white" />
                                      ) : (
                                        <div className="w-2 h-2 rounded-full bg-white" />
                                      )}
                                    </div>
                                    <div
                                      className={`rounded-2xl p-4 transition-all ${
                                        isCurrent
                                          ? "bg-gradient-to-br from-white to-[#F6FFED] border border-[#28cd41]/20 shadow-sm"
                                          : done
                                          ? "bg-[#fafafa] border border-transparent"
                                          : "bg-white border border-dashed border-[#e5e5ea] opacity-60"
                                      }`}
                                    >
                                      <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                                        <div className="flex items-center gap-2">
                                          <span
                                            className={`text-sm font-bold ${
                                              done
                                                ? "text-[#1d1d1f]"
                                                : "text-[#c7c7cc]"
                                            }`}
                                          >
                                            {step.label}
                                          </span>
                                          {isCurrent && (
                                            <span
                                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black text-white animate-pulse"
                                              style={{ backgroundColor: step.color }}
                                            >
                                              <Sparkles className="w-3 h-3" />
                                              当前
                                            </span>
                                          )}
                                        </div>
                                        {ts && done && (
                                          <span className="text-[11px] font-mono text-[#86868b] font-bold whitespace-nowrap bg-white px-2.5 py-1 rounded-full border border-[#e5e5ea]">
                                            {new Date(ts).toLocaleString()}
                                          </span>
                                        )}
                                      </div>
                                      <p
                                        className={`text-xs leading-relaxed ${
                                          done
                                            ? "text-[#86868b]"
                                            : "text-[#c7c7cc]"
                                        }`}
                                      >
                                        {step.desc}
                                      </p>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Bottom Actions */}
                        <div className="flex gap-3 pt-2">
                          <Link
                            to={`/order/${selectedOrder.order_no}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-3 rounded-2xl bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] font-bold flex items-center justify-center gap-2 border border-[#e5e5ea] transition-all ripple-target"
                          >
                            <ExternalLink className="w-4 h-4" />
                            预览客户页
                          </Link>
                          <Link
                            to={`/admin/orders/${selectedOrder.id}`}
                            className="flex-1 py-3 rounded-2xl btn-primary font-bold flex items-center justify-center gap-2 ripple-target"
                          >
                            <Edit className="w-4 h-4" />
                            编辑订单
                          </Link>
                        </div>
                      </motion.div>
                    )}

                    {/* Tab: Logistics */}
                    {drawerTab === "logistics" && (
                      <motion.div
                        key="tab-logistics"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                        className="h-full"
                      >
                        {selectedOrder.tracking_no ? (
                          <EmbeddedLogisticsViewer
                            initialTrackingNo={selectedOrder.tracking_no}
                            compact
                          />
                        ) : (
                          <div className="bg-white rounded-[2.5rem] p-12 shadow-sm border border-white shimmer-border text-center">
                            <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-[#f59e0b]/10 via-[#0071e3]/5 to-[#28cd41]/10 flex items-center justify-center mx-auto mb-6">
                              <Truck className="w-10 h-10 text-[#f59e0b]" />
                            </div>
                            <h3 className="text-xl font-bold text-[#1d1d1f] mb-3">
                              暂无运单号
                            </h3>
                            <p className="text-sm text-[#86868b] max-w-sm mx-auto mb-8 leading-relaxed">
                              请先在「订单详情」Tab 中点击「录入单号」按钮，或使用下方快捷操作录入快递运单号码后再查询轨迹。
                            </p>
                            <button
                              onClick={() => {
                                setCurrentOrderToUpdateTracking(selectedOrder);
                                setShowUpdateTrackingModal(true);
                                setNewTrackingNumber("");
                                closeDrawer();
                              }}
                              className="px-8 py-3 rounded-2xl btn-primary font-bold flex items-center gap-2 mx-auto ripple-target"
                            >
                              <MapPin className="w-4 h-4" />
                              立即录入运单号
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Tab: Share */}
                    {drawerTab === "share" && (
                      <motion.div
                        key="tab-share"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-6"
                      >
                        {/* Share Link Card */}
                        <div className="bg-gradient-to-br from-[#0a1628] via-[#0f1f3d] to-[#1a1a2e] rounded-[2rem] p-6 text-white relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-52 h-52 rounded-full bg-[#0071e3]/20 blur-3xl" />
                          <div className="absolute bottom-0 left-0 w-44 h-44 rounded-full bg-[#28cd41]/15 blur-3xl" />
                          <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-5">
                              <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
                                <QrCode className="w-5 h-5" />
                              </div>
                              <div>
                                <h3 className="text-lg font-bold">
                                  客户分享链接
                                </h3>
                                <p className="text-xs text-white/60 font-bold">
                                  发送链接或生成二维码给客户
                                </p>
                              </div>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-5">
                              <p className="text-xs font-mono text-white/70 mb-1">
                                订单追踪页 URL
                              </p>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-white break-all flex-1">
                                  {`${window.location.origin}/order/${selectedOrder.order_no}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-3">
                              <button
                                onClick={() =>
                                  copyValue(
                                    `${window.location.origin}/order/${selectedOrder.order_no}`,
                                    "分享链接"
                                  )
                                }
                                className="flex-1 py-3 rounded-2xl bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] font-bold flex items-center justify-center gap-2 transition-colors ripple-target"
                              >
                                <Copy className="w-4 h-4" />
                                复制链接
                              </button>
                              <Link
                                to={`/order/${selectedOrder.order_no}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-5 py-3 rounded-2xl bg-[#0071e3] hover:bg-[#0077ED] text-white font-bold flex items-center gap-2 transition-colors ripple-target"
                              >
                                <ExternalLink className="w-4 h-4" />
                                打开
                              </Link>
                            </div>
                          </div>
                        </div>

                        {/* Quick QR Code Preview */}
                        <div className="bg-white rounded-[2rem] p-6 shimmer-border overflow-hidden relative">
                          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-[#0071e3]/5 blur-3xl" />
                          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-[#28cd41]/5 blur-3xl" />
                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-5">
                              <h3 className="font-bold text-[#1d1d1f] flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center">
                                  <QrCode className="w-4 h-4" />
                                </div>
                                追踪二维码
                                <span className="ml-1 text-[10px] font-bold text-[#28cd41] px-2 py-0.5 rounded-full bg-[#28cd41]/10">
                                  即时生成
                                </span>
                              </h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center">
                              <div className="bg-gradient-to-br from-[#fafafa] to-[#f5f5f7] rounded-2xl p-5 flex flex-col items-center relative overflow-hidden">
                                <div className="absolute inset-0 opacity-[0.02]" style={{
                                  backgroundImage: `radial-gradient(circle at 30% 30%, #0071e3 0%, transparent 50%), radial-gradient(circle at 70% 70%, #28cd41 0%, transparent 50%)`
                                }} />
                                <div className="relative z-10">
                                  {drawerQRUrl ? (
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ duration: 0.3, type: "spring" }}
                                      className="bg-white rounded-2xl p-3 shadow-md border border-[#e5e5ea]/60 relative"
                                    >
                                      <div className="absolute -top-0.5 -left-0.5 w-4 h-4 border-t-[3px] border-l-[3px] rounded-tl-lg" style={{ borderColor: "#0071e3" }} />
                                      <div className="absolute -top-0.5 -right-0.5 w-4 h-4 border-t-[3px] border-r-[3px] rounded-tr-lg" style={{ borderColor: "#28cd41" }} />
                                      <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 border-b-[3px] border-l-[3px] rounded-bl-lg" style={{ borderColor: "#28cd41" }} />
                                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 border-b-[3px] border-r-[3px] rounded-br-lg" style={{ borderColor: "#0071e3" }} />
                                      <img
                                        src={drawerQRUrl}
                                        alt="订单追踪二维码"
                                        className="w-40 h-40 object-contain"
                                      />
                                    </motion.div>
                                  ) : (
                                    <div className="w-40 h-40 rounded-2xl bg-white flex items-center justify-center shadow-inner border border-[#e5e5ea]">
                                      <div className="w-8 h-8 rounded-full border-4 border-[#e5e5ea] border-t-[#0071e3] animate-spin" />
                                    </div>
                                  )}
                                  <p className="mt-3 text-center text-xs font-bold text-[#1d1d1f]">扫码追踪订单</p>
                                  <p className="mt-1 text-center text-[11px] text-[#86868b]">微信 / 相机扫一扫</p>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <button
                                  onClick={copyDrawerQRImage}
                                  disabled={!drawerQRUrl}
                                  className="w-full py-3 rounded-2xl bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] font-bold border border-[#e5e5ea] flex items-center justify-center gap-2 transition-all disabled:opacity-50 ripple-target"
                                >
                                  <Copy className="w-4 h-4" />
                                  复制二维码图片
                                </button>
                                <button
                                  onClick={downloadDrawerQR}
                                  disabled={!drawerQRUrl}
                                  className="w-full py-3 rounded-2xl bg-[#0071e3]/10 hover:bg-[#0071e3]/15 text-[#0071e3] font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 ripple-target"
                                >
                                  <Download className="w-4 h-4" />
                                  下载二维码
                                </button>
                                <button
                                  onClick={() => generateDrawerQR(selectedOrder.order_no)}
                                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#0071e3] to-[#28cd41] hover:shadow-lg text-white font-bold flex items-center justify-center gap-2 transition-all ripple-target"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                  重新生成
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Share Image Generator */}
                        <div className="bg-white rounded-[2rem] p-6 shimmer-border">
                          <div className="flex items-center justify-between mb-5">
                            <h3 className="font-bold text-[#1d1d1f] flex items-center gap-2">
                              <div className="w-8 h-8 rounded-xl bg-[#8b5cf6]/10 text-[#8b5cf6] flex items-center justify-center">
                                <Sparkles className="w-4 h-4" />
                              </div>
                              订单分享图
                            </h3>
                            {!drawerShareUrl && (
                              <button
                                onClick={handleDrawerGenerateShare}
                                disabled={drawerShareLoading}
                                className="px-5 py-2.5 rounded-2xl bg-gradient-to-br from-violet-50 to-white hover:from-[#8b5cf6] hover:to-[#7c3aed] text-[#8b5cf6] hover:text-white border border-violet-100 hover:border-transparent text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-60 ripple-target"
                              >
                                {drawerShareLoading ? (
                                  <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    生成中...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-4 h-4" />
                                    生成图片
                                  </>
                                )}
                              </button>
                            )}
                          </div>

                          {drawerShareLoading && !drawerShareUrl && (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                              <div className="w-14 h-14 rounded-full border-4 border-[#e5e5ea] border-t-[#8b5cf6] animate-spin mb-5" />
                              <p className="font-semibold text-[#86868b]">
                                正在生成高清分享图，请稍候...
                              </p>
                              <p className="text-xs text-[#c7c7cc] mt-2">
                                包含订单号二维码与状态信息
                              </p>
                            </div>
                          )}

                          {drawerShareUrl ? (
                            <div className="space-y-5">
                              <div className="rounded-[1.5rem] overflow-hidden border border-[#e5e5ea] bg-[#f5f5f7]">
                                <img
                                  src={drawerShareUrl}
                                  alt="订单分享图"
                                  className="w-full h-auto"
                                />
                              </div>
                              <div className="flex gap-3">
                                <button
                                  onClick={handleDrawerGenerateShare}
                                  disabled={drawerShareLoading}
                                  className="flex-1 py-3 rounded-2xl bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] font-bold border border-[#e5e5ea] flex items-center justify-center gap-2 transition-all disabled:opacity-60 ripple-target"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                  重新生成
                                </button>
                                <a
                                  href={drawerShareUrl}
                                  download={`订单分享图_${selectedOrder.order_no}.png`}
                                  className="flex-1 py-3 rounded-2xl btn-primary font-bold flex items-center justify-center gap-2 ripple-target"
                                >
                                  <Download className="w-4 h-4" />
                                  下载图片
                                </a>
                              </div>
                            </div>
                          ) : (
                            !drawerShareLoading && (
                              <div className="flex flex-col items-center justify-center py-12 text-center rounded-[1.5rem] bg-gradient-to-br from-violet-50/50 via-white to-white border border-dashed border-[#8b5cf6]/20">
                                <div className="w-16 h-16 rounded-[1.5rem] bg-[#8b5cf6]/10 flex items-center justify-center mb-4">
                                  <Share2 className="w-8 h-8 text-[#8b5cf6]" />
                                </div>
                                <p className="text-[#1d1d1f] font-bold mb-1">
                                  还未生成分享图
                                </p>
                                <p className="text-sm text-[#86868b] max-w-xs">
                                  点击右上角「生成图片」按钮，即可生成包含订单状态、二维码的精美分享图
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ============ Add Order Modal ============ */}
        <AnimatePresence>
          {showAddOrderModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative p-8 bg-white rounded-[2.5rem] shadow-xl w-full max-w-lg"
              >
                <h3 className="text-2xl font-bold mb-6 text-[#1d1d1f]">
                  添加新订单
                </h3>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="customer_name"
                      className="block text-sm font-medium text-[#1d1d1f] mb-1"
                    >
                      客户名称
                    </label>
                    <input
                      type="text"
                      name="customer_name"
                      id="customer_name"
                      value={newOrder.customer_name}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-[#0071e3] focus:ring-[#0071e3] px-4 py-3 bg-[#f5f5f7] border-transparent focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="customer_wechat"
                      className="block text-sm font-medium text-[#1d1d1f] mb-1"
                    >
                      微信ID
                    </label>
                    <input
                      type="text"
                      name="customer_wechat"
                      id="customer_wechat"
                      value={newOrder.customer_wechat}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-[#0071e3] focus:ring-[#0071e3] px-4 py-3 bg-[#f5f5f7] border-transparent focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="model_name"
                      className="block text-sm font-medium text-[#1d1d1f] mb-1"
                    >
                      模型名称
                    </label>
                    <input
                      type="text"
                      name="model_name"
                      id="model_name"
                      value={newOrder.model_name || ""}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-[#0071e3] focus:ring-[#0071e3] px-4 py-3 bg-[#f5f5f7] border-transparent focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="price"
                        className="block text-sm font-medium text-[#1d1d1f] mb-1"
                      >
                        金额 (¥)
                      </label>
                      <input
                        type="number"
                        name="price"
                        id="price"
                        value={newOrder.price}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-[#0071e3] focus:ring-[#0071e3] px-4 py-3 bg-[#f5f5f7] border-transparent focus:bg-white outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="quantity"
                        className="block text-sm font-medium text-[#1d1d1f] mb-1"
                      >
                        数量
                      </label>
                      <input
                        type="number"
                        name="quantity"
                        id="quantity"
                        value={newOrder.quantity}
                        onChange={handleInputChange}
                        min="1"
                        className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-[#0071e3] focus:ring-[#0071e3] px-4 py-3 bg-[#f5f5f7] border-transparent focus:bg-white outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="estimated_print_hours"
                      className="block text-sm font-medium text-[#1d1d1f] mb-1"
                    >
                      预估打印时长 (小时)
                    </label>
                    <input
                      type="number"
                      name="estimated_print_hours"
                      id="estimated_print_hours"
                      value={newOrder.estimated_print_hours}
                      onChange={handleInputChange}
                      min="0"
                      step="0.5"
                      className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-[#0071e3] focus:ring-[#0071e3] px-4 py-3 bg-[#f5f5f7] border-transparent focus:bg-white outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="mt-8 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddOrderModal(false)}
                    className="px-6 py-3 rounded-xl text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e5e5ea] transition-colors font-semibold"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={handleAddOrder}
                    className="btn-primary px-6 py-3 font-semibold ripple-target"
                  >
                    添加订单
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ============ Update Status Modal ============ */}
        <AnimatePresence>
          {showUpdateStatusModal && currentOrderToUpdateStatus && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative p-8 bg-white rounded-[2.5rem] shadow-xl w-full max-w-lg"
              >
                <h3 className="text-2xl font-bold mb-2 text-[#1d1d1f]">
                  更新订单状态
                </h3>
                <p className="text-[#86868b] mb-6 font-mono text-sm">
                  订单号: {currentOrderToUpdateStatus.order_no}
                </p>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="orderStatus"
                      className="block text-sm font-medium text-[#1d1d1f] mb-2"
                    >
                      选择新状态
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {[...STATUS_ORDER, "cancelled"].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setNewStatus(s as OrderStatus)}
                          className={`text-left px-4 py-3 rounded-xl border-2 transition-all ${
                            newStatus === s
                              ? "border-[#0071e3] bg-[#E6F4FF]"
                              : "border-transparent bg-[#f5f5f7] hover:bg-white hover:border-[#e5e5ea]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{
                                backgroundColor:
                                  orderStatusMap[s as OrderStatus].bg,
                                color: orderStatusMap[s as OrderStatus].color,
                              }}
                            >
                              {STATUS_ICON(s as OrderStatus)}
                            </div>
                            <div>
                              <p
                                className="text-sm font-bold"
                                style={{
                                  color:
                                    orderStatusMap[s as OrderStatus].color,
                                }}
                              >
                                {orderStatusMap[s as OrderStatus].label}
                              </p>
                              <p className="text-xs text-[#86868b]">
                                {orderStatusMap[s as OrderStatus].desc}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-8 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowUpdateStatusModal(false)}
                    className="px-6 py-3 rounded-xl text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e5e5ea] transition-colors font-semibold"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateStatus(currentOrderToUpdateStatus.id)
                    }
                    className="btn-primary px-6 py-3 font-semibold ripple-target"
                  >
                    确认更新
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ============ Update Tracking Modal ============ */}
        <AnimatePresence>
          {showUpdateTrackingModal && currentOrderToUpdateTracking && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative p-8 bg-white rounded-[2.5rem] shadow-xl w-full max-w-lg"
              >
                <h3 className="text-2xl font-bold mb-2 text-[#1d1d1f]">
                  更新运单号
                </h3>
                <p className="text-[#86868b] mb-6 font-mono text-sm">
                  订单号: {currentOrderToUpdateTracking.order_no}
                </p>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="trackingNumber"
                      className="block text-sm font-medium text-[#1d1d1f] mb-2"
                    >
                      运单号
                    </label>
                    <input
                      type="text"
                      name="trackingNumber"
                      id="trackingNumber"
                      value={newTrackingNumber}
                      onChange={(e) => setNewTrackingNumber(e.target.value)}
                      placeholder="例如 SF1234567890"
                      className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-[#0071e3] focus:ring-[#0071e3] px-4 py-3 bg-[#f5f5f7] border-transparent focus:bg-white outline-none transition-all text-lg font-mono"
                    />
                  </div>
                </div>
                <div className="mt-8 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowUpdateTrackingModal(false)}
                    className="px-6 py-3 rounded-xl text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e5e5ea] transition-colors font-semibold"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateTrackingNumber(
                        currentOrderToUpdateTracking.id
                      )
                    }
                    className="btn-primary px-6 py-3 font-semibold ripple-target"
                  >
                    更新运单号
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ============ Share Material Modal (Legacy) ============ */}
        <AnimatePresence>
          {showShareMaterialModal && shareMaterialImageUrl && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative p-8 bg-white rounded-[2.5rem] shadow-xl w-full max-w-lg text-center"
              >
                <h3 className="text-2xl font-bold mb-6 text-[#1d1d1f]">
                  订单分享素材
                </h3>
                <img
                  src={shareMaterialImageUrl}
                  alt="订单分享图"
                  className="max-w-full h-auto rounded-2xl mb-6"
                />
                <p className="text-[#86868b] mb-6">
                  右键保存图片或分享给客户
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowShareMaterialModal(false)}
                    className="px-6 py-3 rounded-xl text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e5e5ea] transition-colors font-semibold"
                  >
                    关闭
                  </button>
                  <a
                    href={shareMaterialImageUrl}
                    download="order_share_material.png"
                    className="btn-primary px-6 py-3 flex items-center gap-2 font-semibold ripple-target"
                  >
                    <Download className="w-4 h-4" />
                    下载
                  </a>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
