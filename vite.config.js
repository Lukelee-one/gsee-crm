import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

**⑤ 우상단 초록색 `Commit changes` 클릭**

---

**⑥ `package.json` 파일도 클릭해서 확인**

아래 줄이 있으면 삭제:
```
"vite-plugin-pwa": "^1.2.0",
