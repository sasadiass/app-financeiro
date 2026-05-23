import { useState, useEffect } from "react";

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const STORES = [
  { name: "Shopee", emoji: "🛒", color: "#EE4D2D" },
  { name: "Shein", emoji: "👗", color: "#e91e8c" },
  { name: "Mercado Livre", emoji: "🛍️", color: "#f5a623" },
  { name: "TikTok Shop", emoji: "🎵", color: "#6c63ff" },
];

const fmt = (v) => v != null && v !== "" ? `R$ ${parseFloat(v || 0).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}` : "—";
const parseR = (v) => parseFloat((v || "0").toString().replace(/[^\d,.-]/g, "").replace(",", ".")) || 0;

function initMonth() {
  return {
    myCredit: Array(8).fill(null).map(() => ({ desc: "", value: "" })),
    thirdCredit: Array(6).fill(null).map(() => ({ desc: "", value: "", who: "" })),
    debit: Array(12).fill(null).map(() => ({ desc: "", value: "", store: "" })),
    income: "", cash: "", notes: "",
  };
}

function loadData() {
  try { const d = localStorage.getItem("finctrl2026"); if (d) return JSON.parse(d); } catch {}
  const months = {};
  MONTHS.forEach((m) => { months[m] = initMonth(); });
  return { months };
}

function saveData(data) { try { localStorage.setItem("finctrl2026", JSON.stringify(data)); } catch {} }

const lbl = { display:"block",color:"#c2758a",fontSize:11,textTransform:"uppercase",letterSpacing:1,marginBottom:5,marginTop:12 };
const inp = { width:"100%",boxSizing:"border-box",background:"#fff0f5",border:"1px solid #f7c5d5",borderRadius:8,padding:"9px 12px",color:"#5c2d3e",fontSize:13,outline:"none",fontFamily:"inherit" };

function InstallmentModal({ currentMonth, onConfirm, onClose }) {
  const [desc, setDesc] = useState("");
  const [total, setTotal] = useState("");
  const [installments, setInstallments] = useState("2");
  const [target, setTarget] = useState("myCredit");
  const [who, setWho] = useState("");
  const monthIdx = MONTHS.indexOf(currentMonth);
  const perInstallment = parseR(total) / (parseInt(installments) || 1);
  const preview = Array.from({ length: parseInt(installments) || 0 }, (_, i) => ({ month: MONTHS[(monthIdx + i) % 12], label: `${i + 1}/${installments}`, value: perInstallment }));
  function handleConfirm() {
    if (!desc || !total || parseInt(installments) < 1) return;
    onConfirm({ desc, total: parseR(total), installments: parseInt(installments), target, who, monthIdx });
    onClose();
  }
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(255,200,220,0.5)",backdropFilter:"blur(4px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div style={{ background:"#fff",border:"1px solid #f7c5d5",borderRadius:20,padding:28,width:440,maxWidth:"95vw",boxShadow:"0 8px 40px rgba(230,100,140,0.15)" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
          <span style={{ color:"#d6456e",fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700 }}>📦 Nova Compra Parcelada</span>
          <button onClick={onClose} style={{ background:"none",border:"none",color:"#c2758a",fontSize:20,cursor:"pointer" }}>✕</button>
        </div>
        <label style={lbl}>Descrição</label>
        <input style={inp} value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Ex: Tênis Nike" />
        <label style={lbl}>Valor Total (R$)</label>
        <input style={inp} type="number" value={total} onChange={e=>setTotal(e.target.value)} placeholder="0,00" />
        <label style={lbl}>Número de Parcelas</label>
        <input style={inp} type="number" min="1" max="24" value={installments} onChange={e=>setInstallments(e.target.value)} />
        <label style={lbl}>Tipo</label>
        <select style={inp} value={target} onChange={e=>setTarget(e.target.value)}>
          <option value="myCredit">Cartão de Crédito — Minhas Compras</option>
          <option value="thirdCredit">Cartão de Crédito — Terceiros</option>
          <option value="debit">Cartão de Débito</option>
        </select>
        {target === "thirdCredit" && (<><label style={lbl}>Quem vai pagar?</label><input style={inp} value={who} onChange={e=>setWho(e.target.value)} placeholder="Nome da pessoa" /></>)}
        {preview.length > 0 && (
          <div style={{ marginTop:16,background:"#fff0f5",borderRadius:10,padding:"12px 14px" }}>
            <div style={{ color:"#c2758a",fontSize:11,marginBottom:8,textTransform:"uppercase",letterSpacing:1 }}>Previsão de parcelas</div>
            {preview.map((p,i) => (
              <div key={i} style={{ display:"flex",justifyContent:"space-between",color:i===0?"#d6456e":"#c2758a",fontSize:13,padding:"3px 0",borderBottom:i<preview.length-1?"1px solid #f7c5d5":"none" }}>
                <span>{p.month} <span style={{ color:"#e8a0b4",fontSize:11 }}>({p.label})</span></span>
                <span style={{ fontWeight:600 }}>{fmt(p.value)}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop:20,display:"flex",gap:10 }}>
          <button onClick={onClose} style={{ flex:1,padding:"11px 0",borderRadius:9,border:"1px solid #f7c5d5",background:"none",color:"#c2758a",cursor:"pointer",fontSize:13 }}>Cancelar</button>
          <button onClick={handleConfirm} style={{ flex:2,padding:"11px 0",borderRadius:9,border:"none",background:"linear-gradient(135deg,#e8607a,#f4a0b8)",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:13 }}>Adicionar Parcelas ✓</button>
        </div>
      </div>
    </div>
  );
}

function Row({ item, idx, onChange, showWho, showStore }) {
  return (
    <div style={{ display:"grid",gridTemplateColumns:showWho?"1fr 1fr 120px":showStore?"1fr 130px":"1fr 120px",gap:6,marginBottom:5 }}>
      <input value={item.desc} onChange={e=>onChange(idx,"desc",e.target.value)} placeholder={`Item ${idx+1}`} style={{ ...inp,fontSize:12,padding:"7px 10px" }} />
      {showWho && <input value={item.who||""} onChange={e=>onChange(idx,"who",e.target.value)} placeholder="Quem vai pagar" style={{ ...inp,fontSize:12,padding:"7px 10px" }} />}
      {showStore && (
        <select value={item.store||""} onChange={e=>onChange(idx,"store",e.target.value)} style={{ ...inp,fontSize:12,padding:"7px 10px",color:item.store?"#5c2d3e":"#c2758a" }}>
          <option value="">Loja…</option>
          {STORES.map(s=><option key={s.name} value={s.name}>{s.emoji} {s.name}</option>)}
          <option value="Outro">Outro</option>
        </select>
      )}
      <input value={item.value} onChange={e=>onChange(idx,"value",e.target.value)} placeholder="R$ 0,00" type="number" style={{ ...inp,fontSize:12,padding:"7px 10px",textAlign:"right",color:"#d6456e" }} />
    </div>
  );
}

function Card({ title, accent, children, total, totalLabel="Total" }) {
  return (
    <div style={{ background:"#fff",border:`1px solid ${accent}44`,borderRadius:16,padding:"18px 18px 14px",marginBottom:16,boxShadow:`0 2px 12px ${accent}15` }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
        <span style={{ color:accent,fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700 }}>{title}</span>
        {total != null && <span style={{ color:accent,fontSize:13,fontWeight:700,background:`${accent}15`,padding:"3px 10px",borderRadius:20 }}>{totalLabel}: {fmt(total)}</span>}
      </div>
      {children}
    </div>
  );
}

function SumRow({ label, value, highlight, sub }) {
  return (
    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",borderRadius:8,marginBottom:5,background:highlight?"#ffe0eb":"#fff8fa",border:highlight?"1px solid #f7c5d5":"1px solid #fdeef3" }}>
      <span style={{ color:sub?"#e8a0b4":"#c2758a",fontSize:sub?11:13 }}>{label}</span>
      <span style={{ color:highlight?"#d6456e":"#5c2d3e",fontWeight:highlight?700:400,fontSize:highlight?15:13 }}>{value}</span>
    </div>
  );
}

function StoreQuickAdd({ onAdd }) {
  return (
    <div style={{ display:"flex",gap:8,flexWrap:"wrap",marginBottom:10 }}>
      {STORES.map(s => (
        <button key={s.name} onClick={()=>onAdd(s.name)} style={{ display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:20,border:`1px solid ${s.color}44`,background:`${s.color}12`,color:"#5c2d3e",fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>
          <span>{s.emoji}</span>{s.name}
        </button>
      ))}
    </div>
  );
}

export default function App() {
  const [data, setData] = useState(() => loadData());
  const [activeMonth, setActiveMonth] = useState(MONTHS[new Date().getMonth()]);
  const [showInstallment, setShowInstallment] = useState(false);
  const [tab, setTab] = useState("credit");

  useEffect(() => { saveData(data); }, [data]);

  const month = data.months[activeMonth] || initMonth();

  function updateMonth(updater) {
    setData(prev => {
      const next = { ...prev, months: { ...prev.months, [activeMonth]: { ...(prev.months[activeMonth] || initMonth()) } } };
      updater(next.months[activeMonth]);
      return next;
    });
  }

  function updateRow(section, idx, field, value) {
    updateMonth(m => { m[section] = [...m[section]]; m[section][idx] = { ...m[section][idx], [field]: value }; });
  }

  function addDebitWithStore(storeName) {
    const emptyIdx = month.debit.findIndex(r => !r.desc && !r.value);
    if (emptyIdx === -1) return;
    updateMonth(m => { m.debit = [...m.debit]; m.debit[emptyIdx] = { ...m.debit[emptyIdx], store: storeName }; });
    setTab("debit");
  }

  function handleInstallment({ desc, total, installments, target, who, monthIdx }) {
    const perInstall = total / installments;
    setData(prev => {
      const next = { ...prev, months: { ...prev.months } };
      for (let i = 0; i < installments; i++) {
        const mName = MONTHS[(monthIdx + i) % 12];
        const m = { ...(next.months[mName] || initMonth()) };
        const label = `${desc} (${i+1}/${installments})`;
        if (target === "myCredit") {
          m.myCredit = [...m.myCredit];
          const idx = m.myCredit.findIndex(r => !r.desc && !r.value);
          if (idx !== -1) m.myCredit[idx] = { desc: label, value: String(perInstall.toFixed(2)) };
          else m.myCredit = [...m.myCredit, { desc: label, value: String(perInstall.toFixed(2)) }];
        } else if (target === "thirdCredit") {
          m.thirdCredit = [...m.thirdCredit];
          const idx = m.thirdCredit.findIndex(r => !r.desc && !r.value);
          if (idx !== -1) m.thirdCredit[idx] = { desc: label, value: String(perInstall.toFixed(2)), who };
          else m.thirdCredit = [...m.thirdCredit, { desc: label, value: String(perInstall.toFixed(2)), who }];
        } else {
          m.debit = [...m.debit];
          const idx = m.debit.findIndex(r => !r.desc && !r.value);
          if (idx !== -1) m.debit[idx] = { desc: label, value: String(perInstall.toFixed(2)), store: "" };
          else m.debit = [...m.debit, { desc: label, value: String(perInstall.toFixed(2)), store: "" }];
        }
        next.months[mName] = m;
      }
      return next;
    });
  }

  const sumMy = month.myCredit.reduce((a,r) => a + parseR(r.value), 0);
  const sumThird = month.thirdCredit.reduce((a,r) => a + parseR(r.value), 0);
  const totalFatura = sumMy + sumThird;
  const totalDebit = month.debit.reduce((a,r) => a + parseR(r.value), 0);
  const income = parseR(month.income);
  const cash = parseR(month.cash);
  const totalOut = totalDebit + cash;
  const sobra = income - totalOut;
  const tabs = [{ id:"credit",label:"💳 Crédito" },{ id:"debit",label:"💸 Débito" },{ id:"summary",label:"📊 Resumo" },{ id:"notes",label:"📝 Notas" }];

  return (
    <div style={{ minHeight:"100vh",background:"linear-gradient(160deg,#fff5f8 0%,#ffe8f0 100%)",color:"#5c2d3e",fontFamily:"'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ background:"linear-gradient(135deg,#f9a8c0 0%,#f4c2d0 100%)",borderBottom:"1px solid #f7c5d5",padding:"16px 20px",boxShadow:"0 2px 16px rgba(230,100,140,0.12)" }}>
        <div style={{ maxWidth:700,margin:"0 auto" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10 }}>
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:"#fff" }}>💰 Controle Financeiro 2026</div>
              <div style={{ color:"#fff0f5",fontSize:12,marginTop:2,opacity:0.85 }}>Gerencie seus gastos com carinho 🌸</div>
            </div>
            <button onClick={()=>setShowInstallment(true)} style={{ display:"flex",alignItems:"center",gap:7,padding:"9px 16px",borderRadius:22,border:"none",background:"#fff",color:"#d6456e",fontWeight:700,fontSize:13,cursor:"pointer",whiteSpace:"nowrap" }}>📦 + Parcelar Compra</button>
          </div>
          <div style={{ display:"flex",gap:4,marginTop:16,overflowX:"auto",paddingBottom:4 }}>
            {MONTHS.map(m => {
              const isActive = m === activeMonth;
              const isNow = MONTHS.indexOf(m) === new Date().getMonth();
              const md = data.months[m] || initMonth();
              const hasData = md.myCredit.some(r=>r.value) || md.debit.some(r=>r.value) || md.income;
              return (
                <button key={m} onClick={()=>setActiveMonth(m)} style={{ flexShrink:0,padding:"5px 12px",borderRadius:20,border:isActive?"none":"1px solid rgba(255,255,255,0.5)",background:isActive?"#fff":"rgba(255,255,255,0.25)",color:isActive?"#d6456e":isNow?"#fff":"rgba(255,255,255,0.8)",fontSize:12,cursor:"pointer",fontWeight:isActive||isNow?700:400,position:"relative",fontFamily:"inherit" }}>
                  {m.slice(0,3)}
                  {hasData && !isActive && <span style={{ position:"absolute",top:2,right:4,width:4,height:4,borderRadius:"50%",background:"#fff" }} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div style={{ maxWidth:700,margin:"0 auto",padding:"0 16px" }}>
        <div style={{ display:"flex",marginTop:16,borderRadius:14,overflow:"hidden",border:"1px solid #f7c5d5",background:"#fff" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1,padding:"10px 4px",border:"none",background:tab===t.id?"linear-gradient(135deg,#ffe0eb,#ffd0e0)":"transparent",color:tab===t.id?"#d6456e":"#c2758a",fontSize:12,fontWeight:tab===t.id?700:400,cursor:"pointer",borderBottom:tab===t.id?"2px solid #e8607a":"2px solid transparent",fontFamily:"inherit" }}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ paddingBottom:40,marginTop:16 }}>
          {tab === "credit" && (
            <>
              <Card title="📌 Minhas Compras no Crédito" accent="#e8607a" total={sumMy}>
                <div style={{ color:"#e8a0b4",fontSize:11,marginBottom:10 }}>Não impacta o saldo do mês — será pago no mês seguinte</div>
                {month.myCredit.map((r,i) => <Row key={i} item={r} idx={i} onChange={(idx,f,v)=>updateRow("myCredit",idx,f,v)} />)}
                <button onClick={()=>updateMonth(m=>{m.myCredit=[...m.myCredit,{desc:"",value:""}]})} style={{ width:"100%",padding:"7px",borderRadius:8,border:"1px dashed #f7c5d5",background:"none",color:"#e8a0b4",cursor:"pointer",fontSize:12,marginTop:4,fontFamily:"inherit" }}>+ Adicionar linha</button>
              </Card>
              <Card title="👥 Terceiros (vão me reembolsar)" accent="#f4a0b8" total={sumThird}>
                {month.thirdCredit.map((r,i) => <Row key={i} item={r} idx={i} onChange={(idx,f,v)=>updateRow("thirdCredit",idx,f,v)} showWho />)}
                <button onClick={()=>updateMonth(m=>{m.thirdCredit=[...m.thirdCredit,{desc:"",value:"",who:""}]})} style={{ width:"100%",padding:"7px",borderRadius:8,border:"1px dashed #f7c5d5",background:"none",color:"#e8a0b4",cursor:"pointer",fontSize:12,marginTop:4,fontFamily:"inherit" }}>+ Adicionar linha</button>
              </Card>
              <div style={{ background:"linear-gradient(135deg,#ffe0eb,#ffd0e0)",border:"1px solid #f7c5d5",borderRadius:16,padding:"18px",textAlign:"center" }}>
                <div style={{ color:"#c2758a",fontSize:11,textTransform:"uppercase",letterSpacing:1,marginBottom:6 }}>🔢 Total da Fatura</div>
                <div style={{ color:"#d6456e",fontSize:28,fontFamily:"'Playfair Display',serif",fontWeight:700 }}>{fmt(totalFatura)}</div>
                <div style={{ display:"flex",justifyContent:"center",gap:24,marginTop:10 }}>
                  <span style={{ color:"#e8607a",fontSize:12 }}>Minhas: {fmt(sumMy)}</span>
                  <span style={{ color:"#f4a0b8",fontSize:12 }}>Terceiros: {fmt(sumThird)}</span>
                </div>
              </div>
            </>
          )}
          {tab === "debit" && (
            <Card title="💸 Gastos no Débito" accent="#e8607a" total={totalDebit}>
              <div style={{ color:"#e8a0b4",fontSize:11,marginBottom:10 }}>Esses gastos impactam o saldo do mês atual</div>
              <div style={{ marginBottom:8 }}>
                <div style={{ color:"#c2758a",fontSize:11,textTransform:"uppercase",letterSpacing:1,marginBottom:6 }}>Acesso rápido por loja</div>
                <StoreQuickAdd onAdd={addDebitWithStore} />
              </div>
              {month.debit.map((r,i) => <Row key={i} item={r} idx={i} onChange={(idx,f,v)=>updateRow("debit",idx,f,v)} showStore />)}
              <button onClick={()=>updateMonth(m=>{m.debit=[...m.debit,{desc:"",value:"",store:""}]})} style={{ width:"100%",padding:"7px",borderRadius:8,border:"1px dashed #f7c5d5",background:"none",color:"#e8a0b4",cursor:"pointer",fontSize:12,marginTop:4,fontFamily:"inherit" }}>+ Adicionar linha</button>
            </Card>
          )}
          {tab === "summary" && (
            <>
              <Card title={`📊 Resumo — ${activeMonth}`} accent="#e8607a">
                <label style={lbl}>💰 Renda Total</label>
                <input style={{...inp,marginBottom:14}} type="number" value={month.income} onChange={e=>updateMonth(m=>{m.income=e.target.value})} placeholder="R$ 0,00" />
                <label style={lbl}>💵 Dinheiro / Pix / Outros</label>
                <input style={{...inp,marginBottom:16}} type="number" value={month.cash} onChange={e=>updateMonth(m=>{m.cash=e.target.value})} placeholder="R$ 0,00" />
                <div style={{ borderTop:"1px solid #f7c5d5",paddingTop:14 }}>
                  <SumRow label="💰 Renda" value={fmt(income)} />
                  <div style={{ marginLeft:12 }}>
                    <SumRow label="💸 Débito" value={fmt(totalDebit)} sub />
                    <SumRow label="💵 Dinheiro / Outros" value={fmt(cash)} sub />
                  </div>
                  <SumRow label="🔻 Total de Saídas" value={fmt(totalOut)} />
                  <div style={{ borderTop:"1px solid #f7c5d5",marginTop:10,paddingTop:10 }}>
                    <SumRow label="✅ SOBRA DO MÊS" value={fmt(sobra)} highlight />
                  </div>
                </div>
              </Card>
              <Card title="💳 Crédito (referência)" accent="#f4a0b8">
                <div style={{ color:"#e8a0b4",fontSize:11,marginBottom:10 }}>Não entra na sobra — será pago mês que vem</div>
                <SumRow label="Minhas compras" value={fmt(sumMy)} sub />
                <SumRow label="A receber de terceiros" value={fmt(sumThird)} sub />
                <SumRow label="Total da fatura" value={fmt(totalFatura)} />
              </Card>
              {(() => {
                const byStore = {};
                month.debit.forEach(r => { if (r.store && r.value) byStore[r.store] = (byStore[r.store]||0) + parseR(r.value); });
                const entries = Object.entries(byStore);
                if (!entries.length) return null;
                return (
                  <Card title="🛒 Gastos por Loja" accent="#f4a0b8">
                    {entries.map(([store,val]) => { const s = STORES.find(x=>x.name===store); return <SumRow key={store} label={`${s?.emoji||"🏪"} ${store}`} value={fmt(val)} sub />; })}
                  </Card>
                );
              })()}
            </>
          )}
          {tab === "notes" && (
            <Card title={`📝 Bloco de Notas — ${activeMonth}`} accent="#f4a0b8">
              <textarea value={month.notes} onChange={e=>updateMonth(m=>{m.notes=e.target.value})} placeholder={`Anotações de ${activeMonth}... 🌸`} style={{ ...inp,minHeight:320,resize:"vertical",lineHeight:1.7,fontSize:14,padding:"14px" }} />
              <div style={{ color:"#e8a0b4",fontSize:11,marginTop:8,textAlign:"right" }}>{(month.notes||"").length} caracteres</div>
            </Card>
          )}
        </div>
      </div>
      {showInstallment && <InstallmentModal currentMonth={activeMonth} onConfirm={handleInstallment} onClose={()=>setShowInstallment(false)} />}
    </div>
  );
}
