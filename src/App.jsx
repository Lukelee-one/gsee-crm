import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://rynoonrqshhzxpjumhbo.supabase.co";
const SUPABASE_KEY = "sb_publishable_wkEjmFDHBL88xjARM65LFg_uC9Wio_A";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const ADMIN_PASSWORD = "gsee2024!";

const C = {
  bg:      "#f0f2f5",
  panel:   "#f7f8fa",
  card:    "#ffffff",
  border:  "#e2e4e8",
  border2: "#d0d3da",
  t1:      "#1a1d23",
  t2:      "#4a5060",
  t3:      "#8a909e",
  accent:  "#0ea5e9",
  mapBg:   "#dde8f5",
  mapLand: "#ffffff",
  mapBord: "#b8c8dc",
};

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

function mapRow(row) {
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
  return { company, contact, title, phone, address, region };
}

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

// ── 관리자 로그인 ─────────────────────────────────────────────
function AdminLogin({ onLogin, onCancel }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const tryLogin = () => {
    if (pw === ADMIN_PASSWORD) { sessionStorage.setItem("gsee_admin","1"); onLogin(); }
    else setError("비밀번호가 틀렸습니다.");
  };
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:20 }}>
      <div style={{ background:C.card, borderRadius:16, padding:"36px 32px", width:"100%", maxWidth:360, boxShadow:"0 8px 32px rgba(0,0,0,0.18)" }}>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ width:48, height:48, background:C.accent, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:700, color:"#fff", margin:"0 auto 12px" }}>G</div>
          <div style={{ fontSize:16, fontWeight:700, color:C.t1 }}>관리자 로그인</div>
          <div style={{ fontSize:12, color:C.t3, marginTop:4 }}>GSEE-TECH KOREA</div>
        </div>
        <input type="password" placeholder="관리자 비밀번호"
          value={pw} onChange={e=>{ setPw(e.target.value); setError(""); }}
          onKeyDown={e=>e.key==="Enter"&&tryLogin()}
          style={{ width:"100%", padding:"12px 16px", border:`1px solid ${error?"#fca5a5":C.border}`, borderRadius:8, fontSize:14, color:C.t1, background:C.bg, boxSizing:"border-box", marginBottom:8, outline:"none" }}
        />
        {error && <div style={{ color:"#dc2626", fontSize:12, marginBottom:8 }}>⚠ {error}</div>}
        <button onClick={tryLogin} style={{ width:"100%", padding:12, background:C.accent, color:"#fff", border:"none", borderRadius:8, fontSize:14, fontWeight:700, cursor:"pointer", marginBottom:8 }}>로그인</button>
        <button onClick={onCancel} style={{ width:"100%", padding:10, background:C.bg, color:C.t3, border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, cursor:"pointer" }}>취소</button>
      </div>
    </div>
  );
}

// ── 관리자 업로드 패널 ────────────────────────────────────────
function AdminPanel({ onLogout, onRefresh, total }) {
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const inputRef = useRef();

  const process = useCallback(async (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["xlsx","xls","csv"].includes(ext)) { setMsg("❌ 엑셀 파일만 가능합니다."); return; }
    setLoading(true); setMsg("");
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type:"array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval:"" });
        const mapped = rows.map(r => mapRow(r)).filter(r => r.company);
        if (mapped.length === 0) { setMsg("❌ 회사명 컬럼을 찾지 못했습니다."); setLoading(false); return; }
        await supabase.from("companies").delete().neq("id","00000000-0000-0000-0000-000000000000");
        const chunkSize = 500;
        let hasError = false;
        for (let i = 0; i < mapped.length; i += chunkSize) {
          const { error } = await supabase.from("companies").insert(mapped.slice(i, i + chunkSize));
          if (error) { setMsg("❌ 업로드 실패: " + error.message); hasError = true; break; }
        }
        if (!hasError) { setMsg(`✅ ${mapped.length}개 업체 업로드 완료!`); onRefresh(); }
      } catch { setMsg("❌ 파일 처리 중 오류가 발생했습니다."); }
      setLoading(false);
    };
    reader.readAsArrayBuffer(file);
  }, [onRefresh]);

  const onDrop = useCallback((e) => { e.preventDefault(); setDrag(false); process(e.dataTransfer.files[0]); }, [process]);

  return (
    <div style={{ background:"#fffbeb", borderBottom:`2px solid #f59e0b`, padding:"10px 16px", display:"flex", flexWrap:"wrap", alignItems:"center", gap:10, flexShrink:0 }}>
      <span style={{ fontSize:11, fontWeight:700, color:"#92400e", background:"#fef3c7", border:"1px solid #f59e0b", borderRadius:5, padding:"3px 10px" }}>🔐 관리자</span>
      <div onDragOver={e=>{ e.preventDefault(); setDrag(true); }} onDragLeave={()=>setDrag(false)} onDrop={onDrop}
        onClick={()=>inputRef.current.click()}
        style={{ flex:1, minWidth:200, padding:"8px 14px", border:`2px dashed ${drag?"#0ea5e9":C.border2}`, borderRadius:8, textAlign:"center", cursor:"pointer", background:drag?"#e0f2fe":C.card, fontSize:12, color:C.t3 }}>
        {loading ? "⏳ 업로드 중..." : "📂 엑셀 파일 업로드 (드래그 또는 클릭)"}
        <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display:"none" }} onChange={e=>process(e.target.files[0])}/>
      </div>
      {msg && <span style={{ fontSize:12, color:msg.startsWith("✅")?"#16a34a":"#dc2626", fontWeight:600 }}>{msg}</span>}
      <span style={{ fontSize:12, color:C.t3 }}>총 <b style={{ color:C.accent }}>{total}</b>개</span>
      <button onClick={onLogout} style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:7, padding:"6px 12px", fontSize:11, color:C.t2, cursor:"pointer" }}>로그아웃</button>
    </div>
  );
}

// ── 지도 ──────────────────────────────────────────────────────
function KoreaMap({ counts, selReg, onReg, filtered, selCo, onCo }) {
  const [hov, setHov] = useState(null);
  const max = Math.max(...Object.values(counts), 1);
  return (
    <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", background:C.bg }}>
      <svg viewBox="0 0 320 455" style={{ height:"96%", width:"auto", maxWidth:"100%", filter:"drop-shadow(0 4px 16px rgba(0,0,0,0.10))" }}>
        <rect x="0" y="0" width="320" height="455" fill={C.mapBg} rx="10"/>
        <polygon points={OUTLINE} fill={C.mapLand} stroke={C.mapBord} strokeWidth="1.5"/>
        <ellipse cx="88" cy="422" rx="28" ry="12" fill={C.mapLand} stroke={C.mapBord} strokeWidth="1.5"/>
        {Object.entries(RM).filter(([r])=>r!=="기타").map(([reg,pos])=>{
          const cnt=counts[reg]||0, isSel=selReg===reg, isHov=hov===reg, r=10+(cnt/max)*16;
          return (
            <g key={reg} style={{ cursor:"pointer" }} onClick={()=>onReg(isSel?null:reg)} onMouseEnter={()=>setHov(reg)} onMouseLeave={()=>setHov(null)}>
              {(isSel||isHov)&&<circle cx={pos.x} cy={pos.y} r={r+8} fill={pos.c} opacity={0.2}/>}
              <circle cx={pos.x} cy={pos.y} r={r} fill={pos.c} opacity={isSel?1:isHov?0.85:cnt>0?0.65:0.25} stroke="#fff" strokeWidth={isSel?2:1}/>
              {cnt>0&&<text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central" style={{ fontSize:9, fill:"#fff", fontWeight:700, pointerEvents:"none", fontFamily:"sans-serif" }}>{cnt}</text>}
              <text x={pos.x} y={pos.y+r+11} textAnchor="middle" style={{ fontSize:8, fill:isSel?pos.c:C.t3, fontWeight:isSel?700:500, pointerEvents:"none", fontFamily:"sans-serif" }}>{reg}</text>
            </g>
          );
        })}
        {filtered.map(c=>{
          const pos=RM[c.region]||RM["기타"], isSel=selCo?.id===c.id;
          const dx=(((c.id*17+5)%28)-14)*0.55, dy=(((c.id*11+3)%28)-14)*0.55;
          return <circle key={c.id} cx={pos.x+dx} cy={pos.y+dy} r={isSel?5:3} fill={isSel?"#fbbf24":C.t1} opacity={isSel?1:0.5} stroke={isSel?"#f59e0b":"#fff"} strokeWidth={isSel?2:1} style={{ cursor:"pointer" }} onClick={e=>{ e.stopPropagation(); onCo(isSel?null:c); }}/>;
        })}
      </svg>
      {hov&&counts[hov]>0&&(
        <div style={{ position:"absolute", top:12, left:12, background:C.card, border:`1.5px solid ${RM[hov]?.c}`, borderRadius:10, padding:"8px 14px", pointerEvents:"none", zIndex:10, boxShadow:"0 4px 12px rgba(0,0,0,0.12)" }}>
          <div style={{ color:RM[hov]?.c, fontWeight:700, fontSize:14 }}>{hov}</div>
          <div style={{ color:C.t2, fontSize:12 }}>{counts[hov]}개 거래처</div>
        </div>
      )}
      {selReg && (
        <div style={{ position:"absolute", top:12, right:12 }}>
          <button onClick={()=>onReg(null)} style={{ background:C.accent, color:"#fff", border:"none", borderRadius:7, padding:"6px 12px", fontSize:12, fontWeight:600, cursor:"pointer" }}>
            {selReg} ✕
          </button>
        </div>
      )}
    </div>
  );
}

// ── 통계 ──────────────────────────────────────────────────────
function StatsView({ counts, total }) {
  const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]);
  const maxVal = sorted[0]?.[1]||1;
  const groups = GROUPS.map(g=>({ ...g, count:g.regions.reduce((s,r)=>s+(counts[r]||0),0), color:RM[g.regions.find(r=>counts[r]>0)]?.c||"#94a3b8" }));
  return (
    <div style={{ overflowY:"auto", height:"100%", padding:"16px", background:C.bg }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:8, marginBottom:20 }}>
        {groups.map(({name,count,color})=>(
          <div key={name} style={{ background:C.card, border:`1px solid ${C.border}`, borderTop:`3px solid ${color}`, borderRadius:10, padding:"12px 14px", boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ color:C.t3, fontSize:10, marginBottom:4 }}>{name}</div>
            <div style={{ color, fontSize:22, fontWeight:700 }}>{count}</div>
            <div style={{ color:C.t3, fontSize:10 }}>{total>0?Math.round(count/total*100):0}%</div>
          </div>
        ))}
      </div>
      <div style={{ color:C.t3, fontSize:11, marginBottom:12, fontWeight:600 }}>지역별 현황</div>
      {sorted.map(([reg,cnt])=>{
        const color=RM[reg]?.c||"#64748b";
        return (
          <div key={reg} style={{ marginBottom:10, background:C.card, borderRadius:8, padding:"10px 14px", border:`1px solid ${C.border}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, fontSize:13 }}>
              <span style={{ color:C.t2, fontWeight:500 }}>{reg}</span>
              <span style={{ color:C.t3 }}>{cnt}개 · {total>0?Math.round(cnt/total*100):0}%</span>
            </div>
            <div style={{ height:6, background:C.bg, borderRadius:3, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${(cnt/maxVal)*100}%`, background:color, borderRadius:3, transition:"width 0.5s ease" }}/>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── 업체 상세 모달 ────────────────────────────────────────────
function DetailModal({ co, onClose }) {
  if (!co) return null;
  const color = RM[co.region]?.c||C.accent;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:500, padding:"0" }}
      onClick={onClose}>
      <div style={{ background:C.card, borderRadius:"20px 20px 0 0", padding:"24px 20px 36px", width:"100%", maxWidth:480, boxShadow:"0 -4px 24px rgba(0,0,0,0.15)" }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ width:40, height:4, background:C.border2, borderRadius:2, margin:"0 auto 20px" }}/>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
          <div style={{ fontSize:16, fontWeight:700, color, maxWidth:"85%", lineHeight:1.4 }}>{co.company}</div>
          <button onClick={onClose} style={{ background:C.bg, border:`1px solid ${C.border}`, color:C.t3, borderRadius:6, width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0, cursor:"pointer" }}>×</button>
        </div>
        <div style={{ background:C.bg, borderRadius:10, padding:"14px 16px", marginBottom:14 }}>
          {[["📍 지역",co.region],["🏢 주소",co.address],["👤 담당자",co.contact],["💼 직책",co.title]].filter(([,v])=>v).map(([k,v])=>(
            <div key={k} style={{ display:"flex", gap:12, marginBottom:8, fontSize:13 }}>
              <span style={{ color:C.t3, whiteSpace:"nowrap", minWidth:56 }}>{k}</span>
              <span style={{ color:C.t2, lineHeight:1.5 }}>{v}</span>
            </div>
          ))}
        </div>
        {co.phone && (
          <a href={`tel:${co.phone}`} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, background:color, color:"#fff", borderRadius:10, padding:"14px", fontSize:15, fontWeight:700, textDecoration:"none" }}>
            📞 {co.phone} 전화하기
          </a>
        )}
      </div>
    </div>
  );
}

// ── 메인 ──────────────────────────────────────────────────────
export default function App() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [selReg, setSelReg]       = useState(null);
  const [selCo, setSelCo]         = useState(null);
  const [tab, setTab]             = useState("list");
  const [isAdmin, setIsAdmin]     = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("companies").select("*");
    if (!error && data) setCompanies(data.map((r,i)=>({ ...r, id:i+1 })));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    if (sessionStorage.getItem("gsee_admin")==="1") setIsAdmin(true);
  }, [fetchData]);

  const counts = useMemo(()=>{
    const c={};
    companies.forEach(co=>{ c[co.region]=(c[co.region]||0)+1; });
    return c;
  },[companies]);

  const filtered = useMemo(()=>{
    const q=search.toLowerCase();
    return companies.filter(c=>{
      const ms=!search||c.company?.toLowerCase().includes(q)||c.contact?.toLowerCase().includes(q)||c.address?.toLowerCase().includes(q)||c.title?.toLowerCase().includes(q);
      const mr=!selReg||c.region===selReg;
      return ms&&mr;
    });
  },[search,selReg,companies]);

  const handleLogout = () => { sessionStorage.removeItem("gsee_admin"); setIsAdmin(false); };

  return (
    <div style={{ fontFamily:"'Malgun Gothic','맑은 고딕',sans-serif", background:C.bg, color:C.t1, height:"100dvh", display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <style>{`
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:${C.border2};border-radius:2px}
        .ccard{transition:background 0.1s}
        .ccard:active{background:${C.bg}!important}
        input{outline:none;font-family:'Malgun Gothic',sans-serif;-webkit-appearance:none}
        input::placeholder{color:${C.t3}}
        button{cursor:pointer;font-family:'Malgun Gothic',sans-serif;-webkit-appearance:none}
        a{-webkit-tap-highlight-color:transparent}
      `}</style>

      {/* 관리자 패널 */}
      {isAdmin && <AdminPanel onLogout={handleLogout} onRefresh={fetchData} total={companies.length}/>}

      {/* 헤더 */}
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:"10px 14px", display:"flex", alignItems:"center", gap:10, flexShrink:0, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
          <div style={{ width:32, height:32, background:C.accent, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:"#fff" }}>G</div>
          <div style={{ display:"none" }} className="desktop-logo">
            <div style={{ fontSize:12, fontWeight:700, color:C.t1 }}>GSEE-TECH KOREA</div>
            <div style={{ fontSize:9, color:C.t3 }}>거래처 관리 시스템</div>
          </div>
        </div>

        {/* 검색 */}
        <div style={{ flex:1, position:"relative" }}>
          <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:14, color:C.t3, pointerEvents:"none" }}>🔍</span>
          <input type="text" placeholder="회사명, 담당자 검색..."
            value={search} onChange={e=>{ setSearch(e.target.value); setSelCo(null); }}
            style={{ width:"100%", background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, padding:"8px 10px 8px 32px", color:C.t1, fontSize:13 }}/>
        </div>

        {/* 통계 */}
        <div style={{ display:"flex", gap:14, flexShrink:0 }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ color:C.accent, fontSize:16, fontWeight:700, lineHeight:1 }}>{companies.length}</div>
            <div style={{ color:C.t3, fontSize:9 }}>전체</div>
          </div>
          <div style={{ textAlign:"center" }}>
            <div style={{ color:C.accent, fontSize:16, fontWeight:700, lineHeight:1 }}>{filtered.length}</div>
            <div style={{ color:C.t3, fontSize:9 }}>검색</div>
          </div>
        </div>

        {/* 관리자 버튼 */}
        {!isAdmin && (
          <button onClick={()=>setShowLogin(true)}
            style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:7, padding:"7px 10px", fontSize:11, color:C.t3, flexShrink:0 }}>
            🔐
          </button>
        )}
      </div>

      {/* 지역 필터 */}
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:"8px 14px", display:"flex", gap:6, overflowX:"auto", flexShrink:0 }}>
        <button onClick={()=>{ setSelReg(null); setSelCo(null); }}
          style={{ background:!selReg?C.accent:C.bg, color:!selReg?"#fff":C.t3, border:`1px solid ${!selReg?C.accent:C.border}`, borderRadius:6, padding:"4px 12px", fontSize:11, fontWeight:!selReg?700:400, whiteSpace:"nowrap", flexShrink:0 }}>
          전체
        </button>
        {[
          {key:"서울",    label:"서울특별시"},
          {key:"인천",    label:"인천광역시"},
          {key:"대전",    label:"대전광역시"},
          {key:"대구",    label:"대구광역시"},
          {key:"울산",    label:"울산광역시"},
          {key:"부산",    label:"부산광역시"},
          {key:"광주",    label:"광주광역시"},
          {key:"경기도",  label:"경기도"},
          {key:"충청남도",label:"충청남도"},
          {key:"충청북도",label:"충청북도"},
          {key:"경상남도",label:"경상남도"},
          {key:"경상북도",label:"경상북도"},
          {key:"전라남도",label:"전라남도"},
          {key:"전라북도",label:"전라북도"},
          {key:"강원도",  label:"강원도"},
          {key:"세종",    label:"세종시"},
          {key:"기타",    label:"기타"},
        ].filter(({key})=>counts[key]>0).map(({key,label})=>{
          const col=RM[key]?.c||"#64748b", active=selReg===key;
          return (
            <button key={key} onClick={()=>{ setSelReg(active?null:key); setSelCo(null); setTab("list"); }}
              style={{ background:active?col+"22":C.bg, color:active?col:C.t3, border:`1px solid ${active?col:C.border}`, borderRadius:6, padding:"4px 12px", fontSize:11, fontWeight:active?700:400, whiteSpace:"nowrap", flexShrink:0 }}>
              {label} {counts[key]}
            </button>
          );
        })}
      </div>

      {/* 탭 메뉴 */}
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, display:"flex", flexShrink:0 }}>
        {[["list","📋 목록"],["map","🗺 지도"],["stats","📊 통계"]].map(([t,label])=>(
          <button key={t} onClick={()=>setTab(t)}
            style={{ flex:1, background:"none", border:"none", borderBottom:tab===t?`2px solid ${C.accent}`:"2px solid transparent", color:tab===t?C.accent:C.t3, padding:"10px 4px", fontSize:13, fontWeight:tab===t?700:400 }}>
            {label}
          </button>
        ))}
      </div>

      {/* 콘텐츠 */}
      {loading ? (
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", color:C.t3, fontSize:14 }}>
          데이터 불러오는 중...
        </div>
      ) : companies.length === 0 ? (
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:C.t3, gap:12, padding:24 }}>
          <div style={{ fontSize:48 }}>📭</div>
          <div style={{ fontSize:15, fontWeight:600, color:C.t2 }}>등록된 거래처가 없습니다</div>
          <div style={{ fontSize:12, textAlign:"center" }}>관리자가 엑셀 파일을 업로드하면{"\n"}여기에 표시됩니다</div>
        </div>
      ) : (
        <div style={{ flex:1, overflow:"hidden" }}>

          {/* 목록 탭 */}
          {tab==="list" && (
            <div style={{ height:"100%", overflowY:"auto" }}>
              {filtered.length===0
                ? <div style={{ padding:40, textAlign:"center", color:C.t3, fontSize:13 }}>검색 결과 없음</div>
                : filtered.map(c=>{
                    const col=RM[c.region]?.c||"#64748b";
                    return (
                      <div key={c.id} className="ccard" onClick={()=>setSelCo(c)}
                        style={{ padding:"13px 16px", borderBottom:`1px solid ${C.border}`, cursor:"pointer", background:C.card, borderLeft:`3px solid ${col}` }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                          <div style={{ fontSize:14, fontWeight:600, color:C.t1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"70%" }}>{c.company}</div>
                          <span style={{ fontSize:10, padding:"2px 8px", borderRadius:5, background:col+"22", color:col, border:`1px solid ${col}55`, flexShrink:0 }}>{c.region}</span>
                        </div>
                        {c.contact&&<div style={{ fontSize:12, color:C.t3, marginBottom:2 }}>👤 {c.contact}{c.title?` · ${c.title}`:""}</div>}
                        {c.phone&&<div style={{ fontSize:12, color:C.accent, fontWeight:600 }}>📞 {c.phone}</div>}
                        {c.address&&<div style={{ fontSize:11, color:C.t3, marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>📍 {c.address}</div>}
                      </div>
                    );
                  })
              }
            </div>
          )}

          {/* 지도 탭 */}
          {tab==="map" && (
            <KoreaMap counts={counts} selReg={selReg} onReg={r=>{ setSelReg(r); setTab("list"); }} filtered={filtered} selCo={selCo} onCo={setSelCo}/>
          )}

          {/* 통계 탭 */}
          {tab==="stats" && <StatsView counts={counts} total={companies.length}/>}
        </div>
      )}

      {/* 상세 모달 */}
      <DetailModal co={selCo} onClose={()=>setSelCo(null)}/>

      {/* 관리자 로그인 모달 */}
      {showLogin && !isAdmin && (
        <AdminLogin onLogin={()=>{ setIsAdmin(true); setShowLogin(false); }} onCancel={()=>setShowLogin(false)}/>
      )}
    </div>
  );
}
