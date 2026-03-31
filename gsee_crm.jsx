import { useState, useMemo, useRef, useCallback } from "react";
import * as XLSX from "xlsx";

// ── 색상 테마 (CSS 변수 없이 직접 지정) ──────────────────────
const C = {
  bg:       "#f0f2f5",
  panel:    "#f7f8fa",
  card:     "#ffffff",
  border:   "#e2e4e8",
  border2:  "#d0d3da",
  t1:       "#1a1d23",
  t2:       "#4a5060",
  t3:       "#8a909e",
  accent:   "#0ea5e9",
  mapBg:    "#dde8f5",
  mapLand:  "#ffffff",
  mapBord:  "#b8c8dc",
};

// ── 지역 자동감지 ─────────────────────────────────────────────
function detectRegion(address = "") {
  const a = address.trim();
  if (a.startsWith("서울")) return "서울";
  if (a.startsWith("인천")) return "인천";
  if (a.startsWith("부산")) return "부산";
  if (a.startsWith("대구")) return "대구";
  if (a.startsWith("광주")) return "광주";
  if (a.startsWith("대전")) return "대전";
  if (a.startsWith("울산")) return "울산";
  if (a.startsWith("세종")) return "세종";
  if (a.startsWith("경기")) return "경기도";
  if (a.startsWith("강원")) return "강원도";
  if (a.startsWith("충청북도") || a.startsWith("충북")) return "충청북도";
  if (a.startsWith("충청남도") || a.startsWith("충남")) return "충청남도";
  if (a.startsWith("전라북도") || a.startsWith("전북")) return "전라북도";
  if (a.startsWith("전라남도") || a.startsWith("전남")) return "전라남도";
  if (a.startsWith("경상북도") || a.startsWith("경북")) return "경상북도";
  if (a.startsWith("경상남도") || a.startsWith("경남")) return "경상남도";
  if (a.startsWith("제주")) return "제주";
  return "기타";
}

// ── 엑셀 컬럼 매핑 ───────────────────────────────────────────
function mapRow(row, idx) {
  const keys = Object.keys(row);
  const find = (...candidates) => {
    for (const c of candidates) {
      const k = keys.find(k => k.replace(/\s/g, "").includes(c));
      if (k && row[k] !== undefined && row[k] !== "") return String(row[k]).trim();
    }
    return "";
  };
  const company = find("회사명","거래처명","업체명","회사","거래처","업체");
  const contact = find("담당자이름","담당자명","담당자","성명","이름","name");
  const title   = find("직책","직급","직위","역할");
  const phone   = find("휴대전화","휴대폰","전화번호","연락처","핸드폰","mobile","phone");
  const address = find("주소","소재지","위치","address");
  const region  = find("지역","시도","region") || detectRegion(address);
  return { id: idx + 1, company, contact, title, phone, address, region };
}

// ── 지도 데이터 ───────────────────────────────────────────────
const RM = {
  "서울":    { x:95,  y:86,  c:"#0ea5e9" },
  "인천":    { x:71,  y:95,  c:"#38bdf8" },
  "경기도":  { x:134, y:104, c:"#3b82f6" },
  "강원도":  { x:198, y:91,  c:"#6366f1" },
  "충청북도":{ x:166, y:158, c:"#8b5cf6" },
  "충청남도":{ x:87,  y:174, c:"#a855f7" },
  "세종":    { x:117, y:170, c:"#d946ef" },
  "대전":    { x:130, y:187, c:"#ec4899" },
  "전라북도":{ x:103, y:232, c:"#f43f5e" },
  "전라남도":{ x:87,  y:307, c:"#ef4444" },
  "광주":    { x:80,  y:286, c:"#f97316" },
  "경상북도":{ x:245, y:191, c:"#f59e0b" },
  "대구":    { x:221, y:227, c:"#eab308" },
  "울산":    { x:277, y:253, c:"#84cc16" },
  "경상남도":{ x:198, y:282, c:"#22c55e" },
  "부산":    { x:261, y:284, c:"#10b981" },
  "제주":    { x:88,  y:420, c:"#06b6d4" },
  "기타":    { x:160, y:200, c:"#94a3b8" },
};

const OUTLINE = "55,25 205,25 245,66 284,208 253,291 213,315 150,324 63,332 47,315 71,216 63,91 55,66";

const GROUPS = [
  { name:"수도권",    regions:["서울","경기도","인천"] },
  { name:"충청권",    regions:["충청남도","충청북도","대전","세종"] },
  { name:"경상권",    regions:["경상북도","경상남도","대구","부산","울산"] },
  { name:"전라권",    regions:["전라북도","전라남도","광주"] },
  { name:"강원·제주", regions:["강원도","제주"] },
];

// ── 업로드 화면 ───────────────────────────────────────────────
function UploadScreen({ onData }) {
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef();

  const process = useCallback((file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["xlsx","xls","csv"].includes(ext)) {
      setError("엑셀 파일(.xlsx, .xls) 또는 CSV 파일만 가능합니다."); return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type:"array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval:"" });
        if (rows.length === 0) { setError("데이터가 없습니다."); return; }
        const mapped = rows.map((r,i) => mapRow(r,i)).filter(r => r.company);
        if (mapped.length === 0) { setError("회사명 컬럼을 찾지 못했습니다."); return; }
        onData(mapped, file.name);
      } catch { setError("파일을 읽는 중 오류가 발생했습니다."); }
    };
    reader.readAsArrayBuffer(file);
  }, [onData]);

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDrag(false);
    process(e.dataTransfer.files[0]);
  }, [process]);

  return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:C.bg, gap:24, fontFamily:"'Malgun Gothic','맑은 고딕',sans-serif" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:44, height:44, background:C.accent, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:700, color:"#fff" }}>G</div>
        <div>
          <div style={{ fontSize:16, fontWeight:700, color:C.t1 }}>GSEE-TECH KOREA</div>
          <div style={{ fontSize:11, color:C.t3, letterSpacing:"0.1em" }}>거래처 관리 시스템</div>
        </div>
      </div>

      <div
        onDragOver={e=>{ e.preventDefault(); setDrag(true); }}
        onDragLeave={()=>setDrag(false)}
        onDrop={onDrop}
        onClick={()=>inputRef.current.click()}
        style={{ width:420, padding:"48px 32px", textAlign:"center", cursor:"pointer", background:drag?"#e0f2fe":C.card, border:`2px dashed ${drag?C.accent:C.border2}`, borderRadius:16, transition:"all 0.2s", boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize:40, marginBottom:16 }}>📂</div>
        <div style={{ fontSize:15, fontWeight:600, color:C.t1, marginBottom:8 }}>엑셀 파일을 여기에 드래그하거나 클릭하세요</div>
        <div style={{ fontSize:12, color:C.t3 }}>.xlsx · .xls · .csv 지원</div>
        <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display:"none" }} onChange={e=>process(e.target.files[0])}/>
      </div>

      {error && <div style={{ color:"#dc2626", fontSize:13, background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:8, padding:"10px 20px" }}>⚠ {error}</div>}

      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"20px 28px", width:420, boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
        <div style={{ fontSize:12, fontWeight:600, color:C.t2, marginBottom:12 }}>📋 엑셀 첫 행(헤더)에 아래 컬럼명이 있어야 합니다</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px 20px" }}>
          {[["회사명","회사명 / 거래처명 / 업체명"],["담당자","담당자이름 / 담당자 / 성명"],["직책","직책 / 직급 / 직위"],["전화","휴대전화 / 연락처 / 전화번호"],["주소","주소 / 소재지 / 위치"],["지역","주소에서 자동 인식"]].map(([k,v])=>(
            <div key={k}><span style={{ fontSize:11, color:C.t3 }}>{k}: </span><span style={{ fontSize:11, color:C.t2 }}>{v}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 지도 컴포넌트 ─────────────────────────────────────────────
function KoreaMap({ counts, selReg, onReg, filtered, selCo, onCo }) {
  const [hov, setHov] = useState(null);
  const max = Math.max(...Object.values(counts), 1);
  return (
    <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", background:C.bg }}>
      <svg viewBox="0 0 320 455" style={{ height:"94%", width:"auto", filter:"drop-shadow(0 4px 16px rgba(0,0,0,0.10))" }}>
        {/* 바다 배경 */}
        <rect x="0" y="0" width="320" height="455" fill={C.mapBg} rx="10"/>
        {/* 한반도 */}
        <polygon points={OUTLINE} fill={C.mapLand} stroke={C.mapBord} strokeWidth="1.5"/>
        {/* 제주도 */}
        <ellipse cx="88" cy="422" rx="28" ry="12" fill={C.mapLand} stroke={C.mapBord} strokeWidth="1.5"/>

        {/* 지역 버블 */}
        {Object.entries(RM).filter(([r])=>r!=="기타").map(([reg,pos])=>{
          const cnt=counts[reg]||0, isSel=selReg===reg, isHov=hov===reg;
          const r=10+(cnt/max)*16;
          return (
            <g key={reg} style={{ cursor:"pointer" }}
              onClick={()=>onReg(isSel?null:reg)}
              onMouseEnter={()=>setHov(reg)}
              onMouseLeave={()=>setHov(null)}>
              {/* 선택 후광 */}
              {(isSel||isHov)&&<circle cx={pos.x} cy={pos.y} r={r+8} fill={pos.c} opacity={0.2}/>}
              {/* 메인 버블 */}
              <circle cx={pos.x} cy={pos.y} r={r}
                fill={pos.c}
                opacity={isSel?1:isHov?0.85:cnt>0?0.65:0.25}
                stroke={"#fff"}
                strokeWidth={isSel?2:1}
              />
              {/* 업체 수 */}
              {cnt>0&&(
                <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
                  style={{ fontSize:9, fill:"#fff", fontWeight:700, pointerEvents:"none", fontFamily:"'Malgun Gothic',sans-serif" }}>
                  {cnt}
                </text>
              )}
              {/* 지역명 */}
              <text x={pos.x} y={pos.y+r+11} textAnchor="middle"
                style={{ fontSize:8, fill:isSel?pos.c:C.t3, fontWeight:isSel?700:500, pointerEvents:"none", fontFamily:"'Malgun Gothic',sans-serif" }}>
                {reg}
              </text>
            </g>
          );
        })}

        {/* 업체 위치 점 */}
        {filtered.map(c=>{
          const pos=RM[c.region]||RM["기타"], isSel=selCo?.id===c.id;
          const dx=(((c.id*17+5)%28)-14)*0.55, dy=(((c.id*11+3)%28)-14)*0.55;
          return (
            <circle key={c.id} cx={pos.x+dx} cy={pos.y+dy}
              r={isSel?5:3}
              fill={isSel?"#fbbf24":C.t1}
              opacity={isSel?1:0.5}
              stroke={isSel?"#f59e0b":"#fff"}
              strokeWidth={isSel?2:1}
              style={{ cursor:"pointer" }}
              onClick={e=>{ e.stopPropagation(); onCo(isSel?null:c); }}
            />
          );
        })}
      </svg>

      {/* 호버 툴팁 */}
      {hov&&counts[hov]>0&&(
        <div style={{ position:"absolute", top:16, left:16, background:C.card, border:`1.5px solid ${RM[hov]?.c||"#64748b"}`, borderRadius:10, padding:"10px 16px", pointerEvents:"none", zIndex:10, boxShadow:"0 4px 12px rgba(0,0,0,0.12)" }}>
          <div style={{ color:RM[hov]?.c||"#64748b", fontWeight:700, fontSize:15 }}>{hov}</div>
          <div style={{ color:C.t2, fontSize:12, marginTop:2 }}>{counts[hov]}개 거래처</div>
        </div>
      )}

      {/* 범례 */}
      <div style={{ position:"absolute", bottom:16, right:16, background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 16px", boxShadow:"0 2px 8px rgba(0,0,0,0.08)" }}>
        {[{bg:C.accent,op:0.65,label:"지역 버블 (크기=업체수)"},{bg:"#fbbf24",op:1,label:"선택된 업체"},{bg:C.t1,op:0.5,label:"검색 업체"}].map(({bg,op,label})=>(
          <div key={label} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, color:C.t3 }}>
            <div style={{ width:10, height:10, borderRadius:"50%", background:bg, opacity:op, flexShrink:0 }}/>
            <span style={{ fontSize:11 }}>{label}</span>
          </div>
        ))}
        <div style={{ color:C.t3, fontSize:10, marginTop:6, borderTop:`1px solid ${C.border}`, paddingTop:6 }}>버블 클릭 → 지역 필터</div>
      </div>
    </div>
  );
}

// ── 통계 탭 ───────────────────────────────────────────────────
function StatsView({ counts, selReg, total }) {
  const sorted=Object.entries(counts).sort((a,b)=>b[1]-a[1]);
  const maxVal=sorted[0]?.[1]||1;
  const groups=GROUPS.map(g=>({ ...g, count:g.regions.reduce((s,r)=>s+(counts[r]||0),0), color:RM[g.regions.find(r=>counts[r]>0)]?.c||"#94a3b8" }));
  return (
    <div style={{ overflowY:"auto", height:"100%", padding:"24px 28px", background:C.bg }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10, marginBottom:28 }}>
        {groups.map(({name,count,color})=>(
          <div key={name} style={{ background:C.card, border:`1px solid ${C.border}`, borderTop:`3px solid ${color}`, borderRadius:10, padding:"14px 16px", boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ color:C.t3, fontSize:11, marginBottom:6 }}>{name}</div>
            <div style={{ color, fontSize:24, fontWeight:700 }}>{count}</div>
            <div style={{ color:C.t3, fontSize:11, marginTop:2 }}>{total>0?Math.round(count/total*100):0}%</div>
          </div>
        ))}
      </div>
      <div style={{ color:C.t3, fontSize:12, marginBottom:16, fontWeight:600, letterSpacing:"0.04em" }}>지역별 세부 현황</div>
      {sorted.map(([reg,cnt])=>{
        const color=RM[reg]?.c||"#64748b", isSel=reg===selReg;
        return (
          <div key={reg} style={{ marginBottom:14, background:C.card, borderRadius:8, padding:"12px 16px", border:`1px solid ${isSel?color:C.border}`, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8, fontSize:13 }}>
              <span style={{ color:isSel?color:C.t2, fontWeight:isSel?700:500 }}>{reg}</span>
              <span style={{ color:C.t3 }}>{cnt}개 · {total>0?Math.round(cnt/total*100):0}%</span>
            </div>
            <div style={{ height:7, background:C.bg, borderRadius:4, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${(cnt/maxVal)*100}%`, background:color, borderRadius:4, transition:"width 0.5s ease" }}/>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── 메인 앱 ───────────────────────────────────────────────────
export default function App() {
  const [companies, setCompanies] = useState(() => {
    try { const s=localStorage.getItem("gsee_companies"); return s?JSON.parse(s):[]; } catch { return []; }
  });
  const [fileName, setFileName] = useState(() => localStorage.getItem("gsee_filename")||"");
  const [search, setSearch]     = useState("");
  const [selReg, setSelReg]     = useState(null);
  const [selCo, setSelCo]       = useState(null);
  const [tab, setTab]           = useState("map");

  const handleData = useCallback((data, name) => {
    localStorage.setItem("gsee_companies", JSON.stringify(data));
    localStorage.setItem("gsee_filename", name);
    setCompanies(data); setFileName(name);
    setSearch(""); setSelReg(null); setSelCo(null);
  }, []);

  const handleReset = useCallback(() => {
    localStorage.removeItem("gsee_companies");
    localStorage.removeItem("gsee_filename");
    setCompanies([]); setFileName("");
  }, []);

  const counts = useMemo(()=>{
    const c={};
    companies.forEach(co=>{ c[co.region]=(c[co.region]||0)+1; });
    return c;
  },[companies]);

  const filtered = useMemo(()=>{
    const q=search.toLowerCase();
    return companies.filter(c=>{
      const ms=!search||c.company.toLowerCase().includes(q)||c.contact.toLowerCase().includes(q)||c.address.toLowerCase().includes(q)||c.title.toLowerCase().includes(q);
      const mr=!selReg||c.region===selReg;
      return ms&&mr;
    });
  },[search,selReg,companies]);

  if (companies.length===0) return <UploadScreen onData={handleData}/>;

  const selColor=selCo?(RM[selCo.region]?.c||C.accent):C.accent;

  return (
    <div style={{ fontFamily:"'Malgun Gothic','맑은 고딕',sans-serif", background:C.bg, color:C.t1, height:"100vh", display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <style>{`
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:${C.bg}}
        ::-webkit-scrollbar-thumb{background:${C.border2};border-radius:3px}
        .ccard{transition:background 0.12s}
        .ccard:hover{background:${C.bg}!important}
        input{outline:none;font-family:'Malgun Gothic',sans-serif}
        input::placeholder{color:${C.t3}}
        button{cursor:pointer;font-family:'Malgun Gothic',sans-serif}
      `}</style>

      {/* 헤더 */}
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:"10px 20px", display:"flex", alignItems:"center", gap:16, flexShrink:0, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, background:C.accent, borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:700, color:"#fff" }}>G</div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:C.t1, letterSpacing:"0.03em" }}>GSEE-TECH KOREA</div>
            <div style={{ fontSize:10, color:C.t3, letterSpacing:"0.1em" }}>거래처 관리 시스템</div>
          </div>
        </div>

        {/* 검색창 */}
        <div style={{ flex:1, maxWidth:380 }}>
          <div style={{ position:"relative" }}>
            <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:15, color:C.t3, pointerEvents:"none" }}>🔍</span>
            <input type="text" placeholder="회사명, 담당자, 주소, 직책 검색..."
              value={search} onChange={e=>{ setSearch(e.target.value); setSelCo(null); }}
              style={{ width:"100%", background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, padding:"8px 14px 8px 36px", color:C.t1, fontSize:13 }}/>
          </div>
        </div>

        {/* 통계 숫자 */}
        <div style={{ display:"flex", gap:28, marginLeft:"auto" }}>
          {[["전체 거래처",companies.length],["등록 지역",Object.keys(counts).length],["검색 결과",filtered.length]].map(([label,val])=>(
            <div key={label} style={{ textAlign:"center" }}>
              <div style={{ color:C.accent, fontSize:20, fontWeight:700, lineHeight:1 }}>{val}</div>
              <div style={{ color:C.t3, fontSize:10, marginTop:3 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* 파일 교체 버튼 */}
        <button onClick={handleReset}
          style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, padding:"8px 16px", fontSize:12, color:C.t2, display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
          📂 파일 교체
          {fileName&&<span style={{ color:C.t3, fontSize:10 }}>({fileName})</span>}
        </button>
      </div>

      {/* 바디 */}
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

        {/* 좌측 목록 패널 */}
        <div style={{ width:320, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", overflow:"hidden", background:C.panel }}>

          {/* 지역 필터 칩 */}
          <div style={{ padding:"10px 12px", borderBottom:`1px solid ${C.border}`, display:"flex", flexWrap:"wrap", gap:5, background:C.card }}>
            <button onClick={()=>{ setSelReg(null); setSelCo(null); }}
              style={{ background:!selReg?C.accent:C.bg, color:!selReg?"#fff":C.t3, border:`1px solid ${!selReg?C.accent:C.border}`, borderRadius:6, padding:"4px 12px", fontSize:11, fontWeight:!selReg?700:400 }}>
              전체
            </button>
            {Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([r,cnt])=>{
              const col=RM[r]?.c||"#64748b", active=selReg===r;
              return (
                <button key={r} onClick={()=>{ setSelReg(active?null:r); setSelCo(null); }}
                  style={{ background:active?col+"22":C.bg, color:active?col:C.t3, border:`1px solid ${active?col:C.border}`, borderRadius:6, padding:"4px 12px", fontSize:11, fontWeight:active?700:400 }}>
                  {r} <span style={{ fontSize:10 }}>{cnt}</span>
                </button>
              );
            })}
          </div>

          {/* 목록 헤더 */}
          <div style={{ padding:"6px 16px", fontSize:11, color:C.t3, borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", background:C.card }}>
            <span>{filtered.length}개 업체</span>
            {selReg&&<span style={{ color:C.accent, fontWeight:600 }}>📍 {selReg}</span>}
          </div>

          {/* 업체 목록 */}
          <div style={{ flex:1, overflowY:"auto" }}>
            {filtered.length===0
              ? <div style={{ padding:40, textAlign:"center", color:C.t3, fontSize:13 }}>검색 결과 없음</div>
              : filtered.map(c=>{
                  const active=selCo?.id===c.id, col=RM[c.region]?.c||"#64748b";
                  return (
                    <div key={c.id} className="ccard" onClick={()=>setSelCo(active?null:c)}
                      style={{ padding:"11px 16px", borderBottom:`1px solid ${C.border}`, cursor:"pointer", background:active?"#f0f9ff":C.card, borderLeft:`3px solid ${active?col:"transparent"}` }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:active?col:C.t1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"66%" }}>{c.company||"(회사명 없음)"}</div>
                        <span style={{ fontSize:10, padding:"2px 8px", borderRadius:5, background:active?col+"22":C.bg, color:active?col:C.t3, border:`1px solid ${active?col:C.border}`, flexShrink:0 }}>{c.region}</span>
                      </div>
                      {c.contact&&<div style={{ fontSize:11, color:C.t3, marginBottom:2 }}>👤 {c.contact}{c.title?` · ${c.title}`:""}</div>}
                      {c.address&&<div style={{ fontSize:11, color:C.t3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>📍 {c.address}</div>}
                    </div>
                  );
                })
            }
          </div>

          {/* 하단 상세 카드 */}
          {selCo&&(
            <div style={{ background:C.card, borderTop:`3px solid ${selColor}`, padding:16, flexShrink:0, boxShadow:"0 -2px 8px rgba(0,0,0,0.06)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                <div style={{ fontSize:13, fontWeight:700, color:selColor, maxWidth:"85%", lineHeight:1.4 }}>{selCo.company}</div>
                <button onClick={()=>setSelCo(null)} style={{ background:C.bg, border:`1px solid ${C.border}`, color:C.t3, borderRadius:5, width:24, height:24, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0 }}>×</button>
              </div>
              {[["지역",selCo.region],["주소",selCo.address],["담당자",selCo.contact],["직책",selCo.title]].filter(([,v])=>v).map(([k,v])=>(
                <div key={k} style={{ display:"flex", gap:12, marginBottom:6, fontSize:12 }}>
                  <span style={{ color:C.t3, whiteSpace:"nowrap", minWidth:36 }}>{k}</span>
                  <span style={{ color:C.t2, lineHeight:1.5 }}>{v}</span>
                </div>
              ))}
              {selCo.phone&&(
                <div style={{ display:"flex", gap:12, fontSize:12, marginTop:4 }}>
                  <span style={{ color:C.t3, whiteSpace:"nowrap", minWidth:36 }}>연락처</span>
                  <a href={`tel:${selCo.phone}`} style={{ color:selColor, fontWeight:700, fontSize:13, textDecoration:"none" }}>📞 {selCo.phone}</a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 우측 지도/통계 패널 */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={{ borderBottom:`1px solid ${C.border}`, padding:"0 20px", display:"flex", background:C.card }}>
            {[["map","🗺  지도 보기"],["stats","📊  지역 통계"]].map(([t,label])=>(
              <button key={t} onClick={()=>setTab(t)}
                style={{ background:"none", border:"none", borderBottom:tab===t?`2px solid ${C.accent}`:"2px solid transparent", color:tab===t?C.accent:C.t3, padding:"11px 20px", fontSize:13, fontWeight:tab===t?700:400, marginBottom:-1 }}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ flex:1, overflow:"hidden" }}>
            {tab==="map"
              ? <KoreaMap counts={counts} selReg={selReg} onReg={r=>{ setSelReg(r); setSelCo(null); }} filtered={filtered} selCo={selCo} onCo={setSelCo}/>
              : <StatsView counts={counts} selReg={selReg} total={companies.length}/>}
          </div>
        </div>
      </div>
    </div>
  );
}
