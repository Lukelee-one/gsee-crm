import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

<<<<<<< HEAD
---

## STEP 2 — package.json에서 vite-plugin-pwa 제거

`gsee-crm\package.json` 메모장으로 열고 아래 줄 찾아서 **삭제**:
```
"vite-plugin-pwa": "^1.2.0",
```

---

## STEP 3 — GitHub에 다시 업로드

cmd에서:
```
cd %USERPROFILE%\Desktop\gsee-crm
git add .
git commit -m "pwa 제거 후 재배포"
git push
=======
**⑤ 우상단 초록색 `Commit changes` 클릭**

---

**⑥ `package.json` 파일도 클릭해서 확인**

아래 줄이 있으면 삭제:
```
"vite-plugin-pwa": "^1.2.0",
>>>>>>> edd6f37ef168bc3db491e15d71739de197b5b45a
