import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const SUPABASE_URL = "https://rynoonrqshhzxpjumhbo.supabase.co";
const SUPABASE_KEY = "sb_publishable_wkEjmFDHBL88xjARM65LFg_uC9Wio_A";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const ADMIN_PASSWORD = "gsee2024!";

const C = {
  bg:"#f0f2f5", panel:"#f7f8fa", card:"#ffffff",
  border:"#e2e4e8", border2:"#d0d3da",
  t1:"#1a1d23", t2:"#4a5060", t3:"#8a909e", accent:"#0ea5e9",
};

const REGION_MAP = {
  "서울":    { lat:37.5665, lng:126.9780, zoom:12, c:"#0ea5e9" },
  "인천":    { lat:37.4563, lng:126.7052, zoom:11, c:"#38bdf8" },
  "경기도":  { lat:37.4138, lng:127.5183, zoom:10, c:"#3b82f6" },
  "강원도":  { lat:37.8228, lng:128.1555, zoom:9,  c:"#6366f1" },
  "충청북도":{ lat:36.6357, lng:127.4917, zoom:10, c:"#8b5cf6" },
  "충청남도":{ lat:36.5184, lng:126.8000, zoom:10, c:"#a855f7" },
  "세종":    { lat:36.4800, lng:127.2890, zoom:12, c:"#d946ef" },
  "대전":    { lat:36.3504, lng:127.3845, zoom:12, c:"#ec4899" },
  "전라북도":{ lat:35.7175, lng:127.1530, zoom:10, c:"#f43f5e" },
  "전라남도":{ lat:34.8679, lng:126.9910, zoom:9,  c:"#ef4444" },
  "광주":    { lat:35.1595, lng:126.8526, zoom:12, c:"#f97316" },
  "경상북도":{ lat:36.4919, lng:128.8889, zoom:9,  c:"#f59e0b" },
  "대구":    { lat:35.8714, lng:128.6014, zoom:12, c:"#eab308" },
  "울산":    { lat:35.5384, lng:129.3114, zoom:12, c:"#84cc16" },
  "경상남도":{ lat:35.4606, lng:128.2132, zoom:10, c:"#22c55e" },
  "부산":    { lat:35.1796, lng:129.0756, zoom:12, c:"#10b981" },
  "제주":    { lat:33.4996, lng:126.5312, zoom:11, c:"#06b6d4" },
  "기타":    { lat:36.5,    lng:127.5,    zoom:7,  c:"#94a3b8" },
};

const REGION_ORDER = [
  {key:"서울",label:"서울특별시"},{key:"인천",label:"인천광역시"},
  {key:"대전",label:"대전광역시"},{key:"대구",label:"대구광역시"},
  {key:"울산",label:"울산광역시"},{key:"부산",label:"부산광역시"},
  {key:"광주",label:"광주광역시"},{key:"경기도",label:"경기도"},
  {key:"충청남도",label:"충청남도"},{key:"충청북도",label:"충청북도"},
  {key:"경상남도",label:"경상남도"},{key:"경상북도",label:"경상북도"},
  {key:"전라남도",label:"전라남도"},{key:"전라북도",label:"전라북도"},
  {key:"강원도",label:"강원도"},{key:"세종",label:"세종시"},{key:"기타",label:"기타"},
];

function detectRegion(address="") {
  const a=address.trim();
  if(a.startsWith("서울")) return "서울";
  if(a.startsWith("인천")) return "인천";
  if(a.startsWith("부산")) return "부산";
  if(a.startsWith("대구")) return "대구";
  if(a.startsWith("광주")) return "광주";
  if(a.startsWith("대전")) return "대전";
  if(a.startsWith("울산")) return "울산";
  if(a.startsWith("세종")) return "세종";
  if(a.startsWith("경기")) return "경기도";
  if(a.startsWith("강원")) return "강원도";
  if(a.startsWith("충청북도")||a.startsWith("충북")) return "충청북도";
  if(a.startsWith("충청남도")||a.startsWith("충남")) return "충청남도";
  if(a.startsWith("전라북도")||a.startsWith("전북")) return "전라북도";
  if(a.startsWith("전라남도")||a.startsWith("전남")) return "전라남도";
  if(a.startsWith("경상북도")||a.startsWith("경북")) return "경상북도";
  if(a.startsWith("경상남도")||a.startsWith("경남")) return "경상남도";
  if(a.startsWith("제주")) return "제주";
  return "기타";
}

function mapRow(row) {
  const keys=Object.keys(row);
  const find=(...candidates)=>{
    for(const c of candidates){
      const k=keys.find(k=>k.replace(/\s/g,"").includes(c));
      if(k&&row[k]!==undefined&&row[k]!=="") return String(row[k]).trim();
    }
    return "";
  };
  return {
    company:find("회사명","거래처명","업체명","회사","거래처","업체"),
    contact:find("담당자이름","담당자명","담당자","성명","이름","name"),
    title:find("직책","직급","직위","역할"),
    phone:find("휴대전화","휴대폰","전화번호","연락처","핸드폰","mobile","phone"),
    address:find("주소","소재지","위치","address"),
    region:find("지역","시도","region")||detectRegion(find("주소","소재지","위치","address")),
  };
}

// 두 지점 거리 계산 (km)
function calcDist(lat1,lng1,lat2,lng2) {
  const R=6371, dLat=(lat2-lat1)*Math.PI/180, dLng=(lng2-lng1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

// 커스텀 마커 아이콘
function makeIcon(color, selected=false, label="") {
  const size=selected?18:10;
  const html=label
    ? `<div style="width:22px;height:22px;background:${color};border:2px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;box-shadow:0 2px 6px rgba(0,0,0,0.4)">${label}</div>`
    : `<div style="width:${size}px;height:${size}px;background:${color};border:2px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.35);${selected?"outline:3px solid "+color+"55;outline-offset:1px":""}"></div>`;
  return L.divIcon({html,className:"",iconSize:[selected?22:size,selected?22:size],iconAnchor:[selected?11:size/2,selected?11:size/2]});
}

// 지도 줌 컨트롤러
function MapController({selReg}) {
  const map=useMap();
  useEffect(()=>{
    const r=selReg?REGION_MAP[selReg]:null;
    if(r) map.flyTo([r.lat,r.lng],r.zoom,{duration:1.2});
    else map.flyTo([36.5,127.8],7,{duration:1.2});
  },[selReg,map]);
  return null;
}

// ── 지도 탭 ───────────────────────────────────────────────────
function MapView({filtered,selReg,selCos,onCoClick,distMode}) {
  const distances=useMemo(()=>{
    if(selCos.length<2) return [];
    const res=[];
    for(let i=0;i<selCos.length-1;i++){
      const a=selCos[i],b=selCos[i+1];
      const ra=REGION_MAP[a.region]||REGION_MAP["기타"], rb=REGION_MAP[b.region]||REGION_MAP["기타"];
      const lat1=a.lat||ra.lat, lng1=a.lng||ra.lng;
      const lat2=b.lat||rb.lat, lng2=b.lng||rb.lng;
      res.push({from:a.company,to:b.company,km:calcDist(lat1,lng1,lat2,lng2)});
    }
    return res;
  },[selCos]);

  const total=distances.reduce((s,d)=>s+d.km,0);

  return (
    <div style={{height:"100%",position:"relative"}}>
      <MapContainer center={[36.5,127.8]} zoom={7} style={{height:"100%",width:"100%"}}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
        <MapController selReg={selReg}/>
        {filtered.map(c=>{
          const rm=REGION_MAP[c.region]||REGION_MAP["기타"];
          const col=rm.c;
          const selIdx=selCos.findIndex(s=>s.id===c.id);
          const isSel=selIdx!==-1;
          // 실제 좌표 우선, 없으면 지역 중심 + 분산
          const seed1=((c.id*17+5)%100-50)*0.006;
          const seed2=((c.id*13+3)%100-50)*0.006;
          const lat=(c.lat&&c.lng)?c.lat:rm.lat+seed1;
          const lng=(c.lat&&c.lng)?c.lng:rm.lng+seed2;
          return (
            <Marker key={c.id} position={[lat,lng]}
              icon={makeIcon(isSel?"#f59e0b":col,isSel,isSel?String(selIdx+1):"")}
              eventHandlers={{click:()=>onCoClick(c)}}>
              <Popup>
                <div style={{minWidth:180,fontFamily:"'Malgun Gothic',sans-serif"}}>
                  <div style={{fontWeight:700,fontSize:14,color:col,marginBottom:6}}>{c.company}</div>
                  {c.contact&&<div style={{fontSize:12,marginBottom:2}}>👤 {c.contact}{c.title&&` · ${c.title}`}</div>}
                  {c.address&&<div style={{fontSize:11,color:"#666",marginBottom:6}}>📍 {c.address}</div>}
                  {c.phone&&<a href={`tel:${c.phone}`} style={{fontSize:12,color:"#0ea5e9",fontWeight:600,display:"block",marginBottom:8}}>📞 {c.phone}</a>}
                  {distMode&&<div style={{fontSize:11,padding:"4px 8px",background:isSel?"#fef3c7":"#f0f2f5",border:`1px solid ${isSel?"#f59e0b":"#d0d3da"}`,borderRadius:4,textAlign:"center",color:isSel?"#92400e":"#666"}}>
                    {isSel?`✓ ${selIdx+1}번째 선택됨`:"📏 거리측정 선택"}
                  </div>}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* 거리 계산 결과 패널 */}
      {distMode&&selCos.length>0&&(
        <div style={{position:"absolute",bottom:12,left:"50%",transform:"translateX(-50%)",zIndex:1000,background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 16px",boxShadow:"0 4px 20px rgba(0,0,0,0.15)",minWidth:280,maxWidth:"92vw"}}>
          <div style={{fontSize:12,fontWeight:700,color:C.t1,marginBottom:8}}>📍 선택 업체 ({selCos.length}개)</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
            {selCos.map((c,i)=>{
              const col=REGION_MAP[c.region]?.c||"#64748b";
              return <span key={c.id} style={{fontSize:11,background:col+"22",color:col,border:`1px solid ${col}55`,borderRadius:5,padding:"2px 8px"}}>{i+1}. {c.company}</span>;
            })}
          </div>
          {distances.length>0&&(
            <div style={{borderTop:`1px solid ${C.border}`,paddingTop:8}}>
              {distances.map((d,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3,color:C.t2}}>
                  <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"72%"}}>{i+1}→{i+2} {d.from.slice(0,10)}…→{d.to.slice(0,10)}…</span>
                  <span style={{fontWeight:700,color:C.accent,flexShrink:0,marginLeft:6}}>약 {Math.round(d.km)}km</span>
                </div>
              ))}
              {distances.length>1&&(
                <div style={{display:"flex",justifyContent:"space-between",fontSize:13,fontWeight:700,borderTop:`1px solid ${C.border}`,paddingTop:6,marginTop:4}}>
                  <span>총 거리</span>
                  <span style={{color:C.accent}}>약 {Math.round(total)}km</span>
                </div>
              )}
              <div style={{fontSize:10,color:C.t3,marginTop:4}}>※ 직선거리 기준</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── 통계 탭 ───────────────────────────────────────────────────
function StatsView({counts,total}) {
  const sorted=Object.entries(counts).sort((a,b)=>b[1]-a[1]);
  const maxVal=sorted[0]?.[1]||1;
  const GROUPS=[
    {name:"수도권",regions:["서울","경기도","인천"]},
    {name:"충청권",regions:["충청남도","충청북도","대전","세종"]},
    {name:"경상권",regions:["경상북도","경상남도","대구","부산","울산"]},
    {name:"전라권",regions:["전라북도","전라남도","광주"]},
    {name:"강원·제주",regions:["강원도","제주"]},
  ];
  const groups=GROUPS.map(g=>({...g,count:g.regions.reduce((s,r)=>s+(counts[r]||0),0),color:REGION_MAP[g.regions.find(r=>counts[r]>0)]?.c||"#94a3b8"}));
  return (
    <div style={{overflowY:"auto",height:"100%",padding:"16px",background:C.bg}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:8,marginBottom:20}}>
        {groups.map(({name,count,color})=>(
          <div key={name} style={{background:C.card,border:`1px solid ${C.border}`,borderTop:`3px solid ${color}`,borderRadius:10,padding:"12px 14px"}}>
            <div style={{color:C.t3,fontSize:10,marginBottom:4}}>{name}</div>
            <div style={{color,fontSize:22,fontWeight:700}}>{count}</div>
            <div style={{color:C.t3,fontSize:10}}>{total>0?Math.round(count/total*100):0}%</div>
          </div>
        ))}
      </div>
      <div style={{color:C.t3,fontSize:11,marginBottom:12,fontWeight:600}}>지역별 현황</div>
      {sorted.map(([reg,cnt])=>{
        const color=REGION_MAP[reg]?.c||"#64748b";
        return (
          <div key={reg} style={{marginBottom:10,background:C.card,borderRadius:8,padding:"10px 14px",border:`1px solid ${C.border}`}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:13}}>
              <span style={{color:C.t2,fontWeight:500}}>{reg}</span>
              <span style={{color:C.t3}}>{cnt}개 · {total>0?Math.round(cnt/total*100):0}%</span>
            </div>
            <div style={{height:6,background:C.bg,borderRadius:3,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${(cnt/maxVal)*100}%`,background:color,borderRadius:3}}/>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── 관리자 로그인 ─────────────────────────────────────────────
function AdminLogin({onLogin,onCancel}) {
  const [pw,setPw]=useState(""), [error,setError]=useState("");
  const tryLogin=()=>{
    if(pw===ADMIN_PASSWORD){sessionStorage.setItem("gsee_admin","1");onLogin();}
    else setError("비밀번호가 틀렸습니다.");
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,padding:20}}>
      <div style={{background:C.card,borderRadius:16,padding:"36px 32px",width:"100%",maxWidth:360,boxShadow:"0 8px 32px rgba(0,0,0,0.18)"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{width:48,height:48,background:C.accent,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:700,color:"#fff",margin:"0 auto 12px"}}>G</div>
          <div style={{fontSize:16,fontWeight:700,color:C.t1}}>관리자 로그인</div>
        </div>
        <input type="password" placeholder="관리자 비밀번호"
          value={pw} onChange={e=>{setPw(e.target.value);setError("");}}
          onKeyDown={e=>e.key==="Enter"&&tryLogin()}
          style={{width:"100%",padding:"12px 16px",border:`1px solid ${error?"#fca5a5":C.border}`,borderRadius:8,fontSize:14,color:C.t1,background:C.bg,boxSizing:"border-box",marginBottom:8,outline:"none"}}/>
        {error&&<div style={{color:"#dc2626",fontSize:12,marginBottom:8}}>⚠ {error}</div>}
        <button onClick={tryLogin} style={{width:"100%",padding:12,background:C.accent,color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:700,cursor:"pointer",marginBottom:8}}>로그인</button>
        <button onClick={onCancel} style={{width:"100%",padding:10,background:C.bg,color:C.t3,border:`1px solid ${C.border}`,borderRadius:8,fontSize:13,cursor:"pointer"}}>취소</button>
      </div>
    </div>
  );
}

// ── 관리자 패널 ───────────────────────────────────────────────
function AdminPanel({onLogout,onRefresh,total}) {
  const [drag,setDrag]=useState(false),[loading,setLoading]=useState(false),[msg,setMsg]=useState("");
  const inputRef=useRef();

  const geocode=async(address)=>{
    if(!address) return {lat:null,lng:null};
    try {
      const q=encodeURIComponent(address+" 대한민국");
      const res=await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,{
        headers:{"Accept-Language":"ko","User-Agent":"GSEE-TECH-CRM/1.0"}
      });
      const data=await res.json();
      if(data.length>0) return {lat:parseFloat(data[0].lat),lng:parseFloat(data[0].lon)};
    } catch {}
    return {lat:null,lng:null};
  };

  const process=useCallback(async(file)=>{
    if(!file) return;
    const ext=file.name.split(".").pop().toLowerCase();
    if(!["xlsx","xls","csv"].includes(ext)){setMsg("❌ 엑셀 파일만 가능합니다.");return;}
    setLoading(true);setMsg("");
    const reader=new FileReader();
    reader.onload=async(e)=>{
      try {
        const wb=XLSX.read(e.target.result,{type:"array"});
        const ws=wb.Sheets[wb.SheetNames[0]];
        const rows=XLSX.utils.sheet_to_json(ws,{defval:""});
        const mapped=rows.map(r=>mapRow(r)).filter(r=>r.company);
        if(mapped.length===0){setMsg("❌ 회사명 컬럼을 찾지 못했습니다.");setLoading(false);return;}

        // 주소 → 좌표 변환 (10개마다 1초 대기 - Nominatim 이용약관)
        for(let i=0;i<mapped.length;i++){
          if(mapped[i].address){
            const {lat,lng}=await geocode(mapped[i].address);
            mapped[i].lat=lat; mapped[i].lng=lng;
          }
          if(i%10===9) {
            setMsg(`⏳ 주소 변환 중... (${i+1}/${mapped.length})`);
            await new Promise(r=>setTimeout(r,1100));
          }
        }
        setMsg(`⏳ DB 저장 중...`);
        await supabase.from("companies").delete().neq("id","00000000-0000-0000-0000-000000000000");
        let hasError=false;
        for(let i=0;i<mapped.length;i+=500){
          const {error}=await supabase.from("companies").insert(mapped.slice(i,i+500));
          if(error){setMsg("❌ 업로드 실패: "+error.message);hasError=true;break;}
        }
        if(!hasError){setMsg(`✅ ${mapped.length}개 업체 업로드 완료!`);onRefresh();}
      } catch(err){setMsg("❌ 오류: "+err.message);}
      setLoading(false);
    };
    reader.readAsArrayBuffer(file);
  },[onRefresh]);

  const onDrop=useCallback((e)=>{e.preventDefault();setDrag(false);process(e.dataTransfer.files[0]);},[process]);

  return (
    <div style={{background:"#fffbeb",borderBottom:`2px solid #f59e0b`,padding:"10px 16px",display:"flex",flexWrap:"wrap",alignItems:"center",gap:10,flexShrink:0}}>
      <span style={{fontSize:11,fontWeight:700,color:"#92400e",background:"#fef3c7",border:"1px solid #f59e0b",borderRadius:5,padding:"3px 10px"}}>🔐 관리자</span>
      <div onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={onDrop}
        onClick={()=>!loading&&inputRef.current.click()}
        style={{flex:1,minWidth:200,padding:"8px 14px",border:`2px dashed ${drag?"#0ea5e9":C.border2}`,borderRadius:8,textAlign:"center",cursor:loading?"not-allowed":"pointer",background:drag?"#e0f2fe":C.card,fontSize:12,color:C.t3}}>
        {loading?"⏳ 처리 중... (시간이 걸릴 수 있습니다)":"📂 엑셀 파일 업로드"}
        <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" style={{display:"none"}} onChange={e=>process(e.target.files[0])}/>
      </div>
      {msg&&<span style={{fontSize:12,color:msg.startsWith("✅")?"#16a34a":msg.startsWith("⏳")?"#0ea5e9":"#dc2626",fontWeight:600,maxWidth:300}}>{msg}</span>}
      <span style={{fontSize:12,color:C.t3}}>총 <b style={{color:C.accent}}>{total}</b>개</span>
      <button onClick={onLogout} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:7,padding:"6px 12px",fontSize:11,color:C.t2,cursor:"pointer"}}>로그아웃</button>
    </div>
  );
}

// ── 업체 상세 모달 ────────────────────────────────────────────
function DetailModal({co,onClose}) {
  if(!co) return null;
  const color=REGION_MAP[co.region]?.c||C.accent;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:1500}} onClick={onClose}>
      <div style={{background:C.card,borderRadius:"20px 20px 0 0",padding:"24px 20px 36px",width:"100%",maxWidth:480,boxShadow:"0 -4px 24px rgba(0,0,0,0.15)"}} onClick={e=>e.stopPropagation()}>
        <div style={{width:40,height:4,background:C.border2,borderRadius:2,margin:"0 auto 20px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
          <div style={{fontSize:16,fontWeight:700,color,maxWidth:"85%",lineHeight:1.4}}>{co.company}</div>
          <button onClick={onClose} style={{background:C.bg,border:`1px solid ${C.border}`,color:C.t3,borderRadius:6,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0,cursor:"pointer"}}>×</button>
        </div>
        <div style={{background:C.bg,borderRadius:10,padding:"14px 16px",marginBottom:14}}>
          {[["📍 지역",co.region],["🏢 주소",co.address],["👤 담당자",co.contact],["💼 직책",co.title]].filter(([,v])=>v).map(([k,v])=>(
            <div key={k} style={{display:"flex",gap:12,marginBottom:8,fontSize:13}}>
              <span style={{color:C.t3,whiteSpace:"nowrap",minWidth:56}}>{k}</span>
              <span style={{color:C.t2,lineHeight:1.5}}>{v}</span>
            </div>
          ))}
        </div>
        {co.phone&&<a href={`tel:${co.phone}`} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:color,color:"#fff",borderRadius:10,padding:"14px",fontSize:15,fontWeight:700,textDecoration:"none"}}>📞 {co.phone} 전화하기</a>}
      </div>
    </div>
  );
}

// ── 메인 ──────────────────────────────────────────────────────
export default function App() {
  const [companies,setCompanies]=useState([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");
  const [selReg,setSelReg]=useState(null);
  const [selCo,setSelCo]=useState(null);
  const [selCos,setSelCos]=useState([]);
  const [tab,setTab]=useState("list");
  const [isAdmin,setIsAdmin]=useState(false);
  const [showLogin,setShowLogin]=useState(false);
  const [distMode,setDistMode]=useState(false);

  const fetchData=useCallback(async()=>{
    setLoading(true);
    const {data,error}=await supabase.from("companies").select("*");
    if(!error&&data) setCompanies(data.map((r,i)=>({...r,id:i+1})));
    setLoading(false);
  },[]);

  useEffect(()=>{
    fetchData();
    if(sessionStorage.getItem("gsee_admin")==="1") setIsAdmin(true);
  },[fetchData]);

  const counts=useMemo(()=>{
    const c={};
    companies.forEach(co=>{c[co.region]=(c[co.region]||0)+1;});
    return c;
  },[companies]);

  const filtered=useMemo(()=>{
    const q=search.toLowerCase();
    return companies.filter(c=>{
      const ms=!search||c.company?.toLowerCase().includes(q)||c.contact?.toLowerCase().includes(q)||c.address?.toLowerCase().includes(q)||c.title?.toLowerCase().includes(q);
      const mr=!selReg||c.region===selReg;
      return ms&&mr;
    });
  },[search,selReg,companies]);

  const handleCoClick=(c)=>{
    if(distMode){
      setSelCos(prev=>{
        const idx=prev.findIndex(s=>s.id===c.id);
        return idx!==-1?prev.filter(s=>s.id!==c.id):[...prev,c];
      });
    } else {
      setSelCo(c);
    }
  };

  return (
    <div style={{fontFamily:"'Malgun Gothic','맑은 고딕',sans-serif",background:C.bg,color:C.t1,height:"100dvh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <style>{`
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:${C.border2};border-radius:2px}
        .ccard:active{background:${C.bg}!important}
        input{outline:none;font-family:'Malgun Gothic',sans-serif;-webkit-appearance:none}
        input::placeholder{color:${C.t3}}
        button{cursor:pointer;font-family:'Malgun Gothic',sans-serif}
        .leaflet-container{font-family:'Malgun Gothic',sans-serif!important}
      `}</style>

      {isAdmin&&<AdminPanel onLogout={()=>{sessionStorage.removeItem("gsee_admin");setIsAdmin(false);}} onRefresh={fetchData} total={companies.length}/>}

      {/* 헤더 */}
      <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,padding:"10px 14px",display:"flex",alignItems:"center",gap:10,flexShrink:0,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
        <div style={{width:32,height:32,background:C.accent,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#fff",flexShrink:0}}>G</div>
        <div style={{flex:1,position:"relative"}}>
          <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:14,color:C.t3,pointerEvents:"none"}}>🔍</span>
          <input type="text" placeholder="회사명, 담당자 검색..."
            value={search} onChange={e=>setSearch(e.target.value)}
            style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 10px 8px 32px",color:C.t1,fontSize:13}}/>
        </div>
        <div style={{display:"flex",gap:14,flexShrink:0}}>
          <div style={{textAlign:"center"}}>
            <div style={{color:C.accent,fontSize:16,fontWeight:700,lineHeight:1}}>{companies.length}</div>
            <div style={{color:C.t3,fontSize:9}}>전체</div>
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{color:C.accent,fontSize:16,fontWeight:700,lineHeight:1}}>{filtered.length}</div>
            <div style={{color:C.t3,fontSize:9}}>검색</div>
          </div>
        </div>
        {!isAdmin&&<button onClick={()=>setShowLogin(true)} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:7,padding:"7px 10px",fontSize:11,color:C.t3,flexShrink:0}}>🔐</button>}
      </div>

      {/* 지역 필터 */}
      <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,padding:"8px 14px",display:"flex",gap:6,overflowX:"auto",flexShrink:0}}>
        <button onClick={()=>setSelReg(null)}
          style={{background:!selReg?C.accent:C.bg,color:!selReg?"#fff":C.t3,border:`1px solid ${!selReg?C.accent:C.border}`,borderRadius:6,padding:"4px 12px",fontSize:11,fontWeight:!selReg?700:400,whiteSpace:"nowrap",flexShrink:0}}>
          전체
        </button>
        {REGION_ORDER.filter(({key})=>counts[key]>0).map(({key,label})=>{
          const col=REGION_MAP[key]?.c||"#64748b",active=selReg===key;
          return (
            <button key={key} onClick={()=>{setSelReg(active?null:key);setTab("map");}}
              style={{background:active?col+"22":C.bg,color:active?col:C.t3,border:`1px solid ${active?col:C.border}`,borderRadius:6,padding:"4px 12px",fontSize:11,fontWeight:active?700:400,whiteSpace:"nowrap",flexShrink:0}}>
              {label} {counts[key]}
            </button>
          );
        })}
      </div>

      {/* 탭 */}
      <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,display:"flex",flexShrink:0}}>
        {[["list","📋 목록"],["map","🗺 지도"],["stats","📊 통계"]].map(([t,label])=>(
          <button key={t} onClick={()=>setTab(t)}
            style={{flex:1,background:"none",border:"none",borderBottom:tab===t?`2px solid ${C.accent}`:"2px solid transparent",color:tab===t?C.accent:C.t3,padding:"10px 4px",fontSize:13,fontWeight:tab===t?700:400}}>
            {label}
          </button>
        ))}
      </div>

      {loading?(
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:C.t3}}>데이터 불러오는 중...</div>
      ):companies.length===0?(
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:C.t3,gap:12}}>
          <div style={{fontSize:48}}>📭</div>
          <div style={{fontSize:15,fontWeight:600,color:C.t2}}>등록된 거래처가 없습니다</div>
          <div style={{fontSize:12}}>관리자가 엑셀 파일을 업로드하면 표시됩니다</div>
        </div>
      ):(
        <div style={{flex:1,overflow:"hidden",position:"relative"}}>

          {/* 목록 */}
          {tab==="list"&&(
            <div style={{height:"100%",overflowY:"auto"}}>
              {filtered.length===0
                ?<div style={{padding:40,textAlign:"center",color:C.t3}}>검색 결과 없음</div>
                :filtered.map(c=>{
                  const col=REGION_MAP[c.region]?.c||"#64748b";
                  return (
                    <div key={c.id} className="ccard" onClick={()=>setSelCo(c)}
                      style={{padding:"13px 16px",borderBottom:`1px solid ${C.border}`,cursor:"pointer",background:C.card,borderLeft:`3px solid ${col}`}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                        <div style={{fontSize:14,fontWeight:600,color:C.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"70%"}}>{c.company}</div>
                        <span style={{fontSize:10,padding:"2px 8px",borderRadius:5,background:col+"22",color:col,border:`1px solid ${col}55`,flexShrink:0}}>{c.region}</span>
                      </div>
                      {c.contact&&<div style={{fontSize:12,color:C.t3,marginBottom:2}}>👤 {c.contact}{c.title?` · ${c.title}`:""}</div>}
                      {c.phone&&<div style={{fontSize:12,color:C.accent,fontWeight:600}}>📞 {c.phone}</div>}
                      {c.address&&<div style={{fontSize:11,color:C.t3,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>📍 {c.address}</div>}
                    </div>
                  );
                })
              }
            </div>
          )}

          {/* 지도 */}
          {tab==="map"&&(
            <div style={{height:"100%",display:"flex",flexDirection:"column"}}>
              {/* 거리계산 토글 */}
              <div style={{padding:"8px 14px",background:C.card,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
                <button onClick={()=>{setDistMode(!distMode);if(distMode)setSelCos([]);}}
                  style={{background:distMode?"#0ea5e9":"#fff",color:distMode?"#fff":C.t2,border:`1px solid ${distMode?"#0ea5e9":C.border}`,borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>
                  📏 {distMode?"거리계산 모드 ON (해제)":"거리계산 모드"}
                </button>
                {distMode&&<span style={{fontSize:12,color:C.t3}}>지도에서 업체를 순서대로 클릭하세요</span>}
                {distMode&&selCos.length>0&&<button onClick={()=>setSelCos([])} style={{fontSize:11,color:"#dc2626",background:"#fee2e2",border:"none",borderRadius:5,padding:"4px 8px",cursor:"pointer"}}>전체 해제</button>}
              </div>
              <div style={{flex:1}}>
                <MapView filtered={filtered} selReg={selReg} selCos={selCos} onCoClick={handleCoClick} distMode={distMode}/>
              </div>
            </div>
          )}

          {tab==="stats"&&<StatsView counts={counts} total={companies.length}/>}
        </div>
      )}

      {!distMode&&<DetailModal co={selCo} onClose={()=>setSelCo(null)}/>}
      {showLogin&&!isAdmin&&<AdminLogin onLogin={()=>{setIsAdmin(true);setShowLogin(false);}} onCancel={()=>setShowLogin(false)}/>}
    </div>
  );
}
