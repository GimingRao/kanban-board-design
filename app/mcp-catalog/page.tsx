import { redirect } from "next/navigation"

// 该页面入口已下线，统一跳转回首页，避免通过直接访问 URL 进入。
export default function McpCatalogPage() {
  redirect("/")
}
