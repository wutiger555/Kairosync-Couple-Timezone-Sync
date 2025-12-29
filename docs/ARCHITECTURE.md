# 系統架構與功能規格書

本文檔詳細記錄 Kairosync 的內部邏輯與設計決策，供後續開發與維護參考。

## 1. 核心數據模型 (Data Model)

### 時間處理哲學
系統核心依賴 **UTC Minutes (0-1440)** 作為單一真值來源 (Single Source of Truth)。
*   所有組件顯示時間時，皆透過 `UTC + UserOffset` 動態計算。
*   `App.tsx` 中的 `currentTimeUTC` 控制整個應用的時間狀態。
*   **同步狀態**: 當使用者未進行互動時，時間隨真實世界秒數推進 (`isLive = true`)。
*   **非同步狀態**: 當使用者拖曳螺旋或轉動羅盤時，進入「時光旅行」模式 (`isLive = false`)。

### 用戶資料 (UserProfile)
```typescript
interface UserProfile {
  id: string;
  name: string;
  location: string;
  timezoneOffset: number;
  avatarColor: string;
  avatarEmoji?: string;
  avatarImage?: string; // Base64 字串，優先於 Emoji 顯示
  busySlots: number[];  // 忙碌時段 (0-23 小時制)
  sleepSlots: number[]; // 睡眠時段 (0-23 小時制)
  mood?: string;        // 影響頭像周圍的光暈顏色與動畫
}
```

## 2. 關鍵組件邏輯

### HelixView (雙螺旋視圖)
*   **渲染邏輯**: 透過 `renderBackgroundItem` 渲染上下各 3 小時的時間刻度。
*   **視差效果**: 利用 CSS `transform` 與 `opacity` 根據距離中心的遠近產生景深效果。
*   **手勢**: 監聽 `onPointerMove` 計算垂直位移量 (`deltaY`)，將其轉換為時間增量 (`minutesDelta`) 更新 UTC 時間。

### TimeWheel (時間羅盤)
*   **數學模型**: 將 24 小時 (1440 分鐘) 映射為 360 度圓周。
*   **角度計算**: 使用 `Math.atan2` 計算滑鼠/手指位置與圓心的角度。
*   **被動更新**: 左下角的「對應時間 (Corresponding Time)」會即時計算另一位使用者的當地時間，並顯示天數差異 (+1 Day / -1 Day)。

### SettingsModal (設定與頭像裁切)
*   **圖片處理**: 
    *   使用 `FileReader` 讀取使用者上傳的圖片為 DataURL。
    *   **裁切視窗**: 使用 Framer Motion 的 `drag` 屬性模擬圖片拖曳。
    *   **輸出**: 利用 HTML5 `<canvas>` 根據拖曳座標 (x, y) 與縮放比例 (zoom) 繪製最終的 200x200 正方形圖片，並轉為 Base64 儲存。
    *   **注意**: React Native 遷移時需重寫此邏輯（詳見遷移文檔）。

### BackgroundEffects (天氣系統)
*   **模擬演算法**: 目前未使用真實天氣 API。天氣狀況由 `(Location.length + Hour)` 的偽隨機演算法決定，確保同一地點在同一時間的天氣是固定的，但隨時間變化。
*   **視覺層**: 使用 CSS Mask 與 Radial Gradient 混合兩地的天空顏色 (例如：左邊台北是晚上/深藍，右邊倫敦是下午/天藍)。

## 3. 狀態管理流 (State Flow)

1.  **Tick Loop**: `App.tsx` 中的 `useEffect` 每秒執行一次，若 `isLive === true`，則更新 `currentTimeUTC`。
2.  **User Interaction**: 
    *   拖曳 Helix -> `setIsLive(false)` -> 更新 `currentTimeUTC`。
    *   點擊 "Return to Sync" -> `setIsLive(true)` -> 重置為 `new Date()`。
3.  **Event Creation**: 
    *   點擊 ActionMenu -> 產生暫存 Event -> 開啟 `EventEditor`。
    *   Save -> 寫入 `events` 陣列 -> 關閉 Modal。

## 4. UI/UX 設計規範
*   **字體**: 
    *   標題/數字: *Cinzel* (Serif, 營造時間的神聖感)。
    *   內文/UI: *Inter* (Sans-serif, 確保易讀性)。
*   **配色**: 
    *   基底: Slate-950 (深色宇宙感)。
    *   User A: Indigo (紫/藍)。
    *   User B: Rose (粉/紅)。
    *   Golden Window: Amber (琥珀金)。
