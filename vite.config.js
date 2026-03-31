import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'GSEE-TECH 거래처 관리',
        short_name: 'GSEE CRM',
        description: 'GSEE-TECH KOREA 거래처 관리 시스템',
        theme_color: '#0ea5e9',
        background_color: '#f0f2f5',
        display: 'standalone',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
})
```

---

## STEP 3 — 앱 아이콘 생성

cmd에서:
```
cd %USERPROFILE%\Desktop\gsee-crm\public
```
아래 명령어로 임시 아이콘 생성:
```
echo. > icon-192.png
echo. > icon-512.png
```

---

## STEP 4 — GitHub에 업로드

**① GitHub에서 새 저장소 만들기**
- https://github.com 접속 → 우상단 `+` → `New repository`
- Repository name: `gsee-crm`
- **Private** 선택 (회사 데이터 보호)
- `Create repository` 클릭

**② cmd에서 업로드**
```
cd %USERPROFILE%\Desktop\gsee-crm
git init
git add .
git commit -m "GSEE-TECH CRM 초기 배포"
git branch -M main
git remote add origin https://github.com/여기에본인아이디/gsee-crm.git
git push -u origin main