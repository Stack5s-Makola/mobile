import { ApiResponse } from "@types/api";
import { SellerNotification } from "@types/seller";
import { authedApiRequest } from "./client";

// Seller notifications. All verified live except markRead, which needs a real
// notification to act on - none are created by anything the app can do (they
// appear when an admin approves or rejects a listing).

export function getNotifications(
  unreadOnly = false
): Promise<ApiResponse<SellerNotification[]>> {
  const query = unreadOnly ? "?unread=true" : "";
  return authedApiRequest(`/api/seller/notifications${query}`);
}

export function getUnreadCount(): Promise<ApiResponse<{ unread: number }>> {
  return authedApiRequest("/api/seller/notifications/unread-count");
}

export function markRead(id: string): Promise<ApiResponse<unknown>> {
  return authedApiRequest(`/api/seller/notifications/${id}/read`, { method: "PATCH" });
}

export function markAllRead(): Promise<ApiResponse<{ marked: number }>> {
  return authedApiRequest("/api/seller/notifications/read-all", { method: "PATCH" });
}
