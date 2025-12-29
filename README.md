# Kairosync (Chronos & Kairos)

**Kairosync** 是為遠距離情侶設計的下一代時間同步與即時互動平台。它將抽象的時區差異轉化為可感知的、流動的共享空間（Helix View），讓使用者感受到彼此的時間交織，而非僅僅是數字上的差異。

## 核心功能

1.  **雙螺旋時間視圖 (Helix View)**
    *   將兩個時區的時間流可視化為 DNA 般的雙螺旋結構。
    *   直觀顯示重疊的「黃金時間 (Golden Window)」，即雙方都有空的時段。
    *   支援拖曳滑動來預覽未來時間點。

2.  **時間羅盤 (Time Wheel)**
    *   提供圓形的互動式介面來快速調整時間。
    *   直觀顯示日夜變化與太陽/月亮位置。
    *   支援點擊數字直接輸入精確時間。

3.  **沉浸式環境 (Ambient Environment)**
    *   根據當地時間與模擬天氣（晴天、雨天、陰天、夜晚）動態改變背景。
    *   包含流星、雨滴、雲層飄動等細膩動畫。

4.  **個性化身份 (Identity & Avatar)**
    *   **雙模式頭貼**：支援選擇 Emoji 或上傳自定義照片。
    *   **圖片編輯**：內建圖片裁切、縮放與拖曳工具。
    *   **心情共鳴**：設定當前狀態（專注、想你、休息中等），並在介面上產生光暈特效。
    *   **位置與睡眠設定**：設定城市座標與作息時間，自動計算忙碌/休息狀態。

5.  **共享時間軸 (Shared Timeline)**
    *   建立共同事件（通話、約會、睡眠同步）。
    *   可視化雙方在事件發生時的當地時間與天色。

## 技術棧

*   **Framework**: React 19 (TypeScript)
*   **Styling**: Tailwind CSS
*   **Animation**: Framer Motion (用於複雜的轉場與物理手勢模擬)
*   **Icons**: Lucide React
*   **Build Tool**: Vite (Recommended)

## 安裝與執行

確保您已安裝 Node.js (v18+)。

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev
```

## 部署 (Deployment)

本專案為純靜態 React 應用 (SPA)，可輕鬆部署至 Vercel、Netlify 或 GitHub Pages。

**Vercel 部署步驟 (推薦):**
1.  安裝 Vercel CLI: `npm i -g vercel`
2.  執行部署: `vercel`
3.  設定 Build Command: `npm run build`
4.  設定 Output Directory: `dist`

## 專案結構

*   `App.tsx`: 應用程式入口與全域狀態管理。
*   `components/`: UI 組件（HelixView, TimeWheel, SettingsModal 等）。
*   `utils/`: 時間計算核心演算法 (UTC 轉換、黃金時間判斷)。
*   `types.ts`: TypeScript 接口定義。

---
*Created for the "Chronos & Kairos" Project.*
