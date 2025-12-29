# React Native (iOS) 遷移指南

本指南旨在協助將 Kairosync 網頁版遷移至 React Native (Expo) 以發布至 Apple App Store。

## 1. 核心架構調整

### 專案初始化 (推薦)
建議使用 **Expo** 進行開發，它對 Web/iOS 的兼容性最好，且方便處理原生模組（如相機、觸覺回饋）。

```bash
npx create-expo-app@latest kairosync-mobile --template blank-typescript
```

### 樣式系統 (Styling)
目前的 Web 版使用 Tailwind CSS。
*   **遷移方案**: 使用 **NativeWind (v4)**。它允許在 React Native 中使用幾乎相同的 Tailwind class 用法 (`className="..."`)。
*   **注意**: 部分 CSS 屬性如 `backdrop-blur` (毛玻璃) 在 Android 上支援度有限，但在 iOS 上可使用 `expo-blur` 組件替代。

## 2. 關鍵組件替換

| Web 技術 | React Native 替代方案 | 備註 |
| :--- | :--- | :--- |
| `<div>`, `<span>` | `<View>`, `<Text>` | 基礎結構需全面替換。 |
| HTML5 `<canvas>` | `react-native-skia` 或 `expo-image-manipulator` | **重點難點**：頭像裁切功能需重寫。Skia 效能極佳，適合繪圖。 |
| Framer Motion | `react-native-reanimated` + `react-native-gesture-handler` | 用於 HelixView 的慣性滾動與 TimeWheel 的旋轉手勢。 |
| `<img>` | `<Image>` (from `expo-image`) | `expo-image` 支援快取與更好的效能。 |
| CSS Animations (`@keyframes`) | `react-native-reanimated` | 天氣動畫（下雨、星星）需用 Reanimated 重寫。 |
| Lucide React | `lucide-react-native` | 圖標庫可直接遷移，API 幾乎一致。 |

## 3. 功能模組遷移細節

### A. 雙螺旋視圖 (HelixView)
*   **Web**: 監聽 `onPointerMove` + CSS Transform。
*   **RN**: 使用 `GestureDetector` (from `react-native-gesture-handler`) 監聽 Pan 手勢。
*   **動畫**: 使用 `useSharedValue` 和 `useAnimatedStyle` (Reanimated) 來驅動位移，這能跑在 UI Thread 上，保證 60/120fps 流暢度。

### B. 頭像裁切 (Avatar Cropping)
*   Web 版使用了 DOM Canvas API。
*   **RN 方案**: 
    1.  使用 `expo-image-picker` 讓用戶選圖。
    2.  使用 `react-native-gesture-handler` (Pinch + Pan) 實作縮放與拖曳預覽。
    3.  按下確認時，使用 `expo-image-manipulator` 根據座標進行實際裁切與壓縮。

### C. 觸覺回饋 (Haptics)
*   這是 App 的優勢。在轉動 TimeWheel 或滑動 Helix 時，加入 `expo-haptics` (如 `Haptics.selectionAsync()`)，能大幅提升「實體感」。

## 4. 數據持久化
*   Web 使用 `localStorage` (尚未實作，但通常會用)。
*   **RN**: 使用 `AsyncStorage` 或 `expo-sqlite` 儲存用戶設定。
*   **雲端同步**: 若要讓雙方即時看到對方的修改，需引入後端服務 (如 Firebase Realtime Database 或 Supabase)。目前的 Web 版是模擬數據，上架前必須實作後端。

## 5. 上架 App Store 準備清單
1.  **Apple Developer Account**: 需付費註冊 ($99/year)。
2.  **App Icons & Splash Screen**: 需設計各尺寸圖示 (Expo 可自動生成)。
3.  **Privacy Policy**: 需撰寫隱私權條款（特別是如果使用了位置權限）。
4.  **Permissions**: 在 `app.json` 中設定權限說明 (如「我們需要相簿權限以上傳您的頭像」)。

---
*Migration Strategy Prepared for Kairosync*
