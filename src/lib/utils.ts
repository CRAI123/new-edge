import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { useToastStore, type ToastType } from "@/store/useToastStore"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function showToast(type: ToastType, message: string, title?: string): void {
  try {
    useToastStore.getState().push({
      type,
      message,
      title,
      durationMs: type === "error" ? 6000 : 3500,
    })
  } catch (e) {
    console.warn(`[showToast:${type}]`, message, e)
  }
}

export function safeAlert(message: string): void {
  try {
    showToast("info", message)
  } catch (e) {
    console.warn("[safeAlert fallback]", message, e)
  }
}

export function safeConfirm(message: string): boolean {
  try {
    if (typeof window !== "undefined" && typeof window.confirm === "function") {
      return window.confirm(message) === true;
    }
    console.warn("[safeConfirm suppressed, defaulting to true]", message);
    return true;
  } catch (e) {
    console.warn("[safeConfirm fallback]", message, e);
    return true;
  }
}

export function safePrompt(message: string, defaultValue?: string): string | null {
  try {
    if (typeof window !== "undefined" && typeof window.prompt === "function") {
      return window.prompt(message, defaultValue);
    }
    console.warn("[safePrompt suppressed, defaulting to null]", message, defaultValue);
    return null;
  } catch (e) {
    console.warn("[safePrompt fallback]", message, defaultValue, e);
    return null;
  }
}
