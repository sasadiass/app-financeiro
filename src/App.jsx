import { useState, useEffect, useRef } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const STORES = ["Shopee","Shein","Mercado Livre","TikTok Shop","Outro"];
const STORE_EMOJI = { "Shopee":"🛒","Shein":"👗","Mercado Livre":"🛍️","TikTok Shop":"🎵","Outro":"🏪" };

const CATEGORIES = [
  { id:"comida", label:"Comida", emoji:"🍔", color:"#f97316" },
  { id:"roupas", label:"Roupas/Acessórios/Sapatos", emoji:"👠", color:"#ec4899" },
  { id:"cosmeticos", label:"Cosméticos", emoji:"💄", color:"#e879f9" },
  { id:"cuidados", label:"Cuidados Pessoais", emoji:"🧴", color:"#a855f7" },
  { id:"academia", label:"Academia", emoji:"💪", color:"#3b82f6" },
  { id:"farmacia", label:"Farmácia", emoji:"💊", color:"#22c55e" },
  { id:"eletronicos", label:"Eletrônicos", emoji:"📱", color:"#06b6d4" },
  { id:"transporte", label:"App de Transporte", emoji:"🚗", color:"#f59e0b" },
  { id:"cabelo", label:"Produtos de Cabelo", emoji:"💇", color:"#f472b6" },
  { id:"shopee", label:"Shopee", emoji:"🛒", color:"#EE4D2D" },
  { id:"shein", label:"Shein", emoji:"👗", color:"#e91e8c" },
  { id:"mercadolivre", label:"Mercado Livre", emoji:"🛍️", color:"#f5a623" },
  { id:"tiktok", label:"TikTok Shop", emoji:"🎵", color:"#6c63ff" },
  { id:"pix", label:"Pix", emoji:"📲", color:"#14b8a6" },
  { id:"credito", label:"Crédito", emoji:"💳", color:"#6366f1" },
  { id:"faturas", label:"Faturas", emoji:"🧾", color:"#ef4444" },
  { id:"contas", label:"Contas", emoji:"🏠", color:"#eab308" },
  { id:"outros", label:"Outros", emoji:"📦", color:"#94a3b8" },
];

const C = {
  bg: "#fff5f8",
  bg2: "#ffe8f0",
  pink: "#e8607a",
  pink2: "#f4a0b8",
  pink3: "#f9c8d8",
  dark: "#5c2d3e",
  mid: "#c2758a",
  light: "#e8a0b4",
  white: "#ffffff",
  card: "#ffffff",
  border: "#f7c5d5",
  highlight: "#ffe0eb",
  grad: "linear-gradient(135deg,#f9a8c0 0%,#f4c2d0 100%)",
  gradCard: "linear-gradient(135deg,#ffe0eb,#ffd0e0)",
};

const FOOD = "#f97316";

const fmt = (v) => {
  const n = parseFloat(v || 0);
  return `R$ ${n.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
};
const parseR = (v) => parseFloat((v || "0").toString().replace(/[^\d,.-]/g, "").replace(",", ".")) || 0;

// Divisão de gastos: "value" é o total do gasto, "splitValue" é a parte da outra pessoa.
// A minha parte = total - parte dele.
const theirs = (r) => Math.max(0, parseR(r.splitValue));
const mine = (r) => Math.max(0, parseR(r.value) - theirs(r));

function initMonth() {
  return {
    myCredit: Array(8).fill(null).map(() => ({ desc:"", value:"", category:"", installmentId:"" })),
    thirdCredit: Array(6).fill(null).map(() => ({ desc:"", value:"", who:"", category:"", installmentId:"" })),
    otherCardSpend: Array(4).fill(null).map(() => ({ desc:"", value:"", cardOwner:"", category:"", isPaid:false })),
    debit: Array(12).fill(null).map(() => ({ desc:"", value:"", category:"" })),
    food: Array(8).fill(null).map(() => ({ desc:"", value:"", category:"" })),
    income:"", carryover:"", cash:"", notes:"",
  };
}

function initYear() {
  const y = {};
  MONTHS.forEach(m => { y[m] = initMonth(); });
  return y;
}

function initInstallment() {
  return { id:"", desc:"", totalValue:"", totalInstallments:"", paidInstallments:"0", startMonth:"", startYear:String(new Date().getFullYear()), target:"myCredit", who:"", category:"" };
}

// Mês anterior (janeiro volta para dezembro do ano anterior)
function prevOf(year, monthName) {
  const idx = MONTHS.indexOf(monthName);
  if (idx > 0) return { y: String(year), m: MONTHS[idx - 1] };
  return { y: String(parseInt(year) - 1), m: "Dezembro" };
}

function loadData() {
  try {
    const d = localStorage.getItem("finctrl2026v2");
    if (d) {
      const parsed = JSON.parse(d);
      // Dados antigos (sem anos) viram o ano de 2026
      const src = parsed.years || { "2026": parsed.months || {} };
      const years = {};
      Object.keys(src).forEach(y => {
        years[y] = {};
        MONTHS.forEach(m => { years[y][m] = { ...initMonth(), ...((src[y] || {})[m] || {}) }; });
      });
      return { years, installments: parsed.installments || [] };
    }
  } catch {}
  const years = {};
  years[String(new Date().getFullYear())] = initYear();
  return { years, installments:[] };
}

function saveData(d) { try { localStorage.setItem("finctrl2026v2", JSON.stringify(d)); } catch {} }

const lbl = { display:"block", color:C.mid, fontSize:11, textTransform:"uppercase", letterSpacing:1, marginBottom:5, marginTop:12 };
const inp = { width:"100%", boxSizing:"border-box", background:"#fff0f5", border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 12px", color:C.dark, fontSize:13, outline:"none", fontFamily:"inherit" };

// ── Category selector ──────────────────────────────────────────────────────
function CatSelect({ value, onChange, style }) {
  return (
    <select value={value||""} onChange={e=>onChange(e.target.value)}
      style={{ ...inp, fontSize:11, padding:"6px 8px", color: value ? C.dark : C.light, ...style }}>
      <option value="">Categoria…</option>
      {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
    </select>
  );
}

// ── Row ────────────────────────────────────────────────────────────────────
function Row({ item, idx, onChange, showWho, showOwner, canSplit }) {
  const [open, setOpen] = useState(false);
  const hasSplit = theirs(item) > 0;
  const baseCols = showWho ? "1fr 100px 110px 100px" : showOwner ? "1fr 110px 110px 100px" : "1fr 110px 100px";
  const cols = canSplit ? `${baseCols} 30px` : baseCols;
  const total = parseR(item.value);

  return (
    <div style={{ marginBottom:5 }}>
      <div style={{ display:"grid", gridTemplateColumns: cols, gap:5 }}>
        <input value={item.desc||""} onChange={e=>onChange(idx,"desc",e.target.value)}
          placeholder={`Item ${idx+1}`} style={{ ...inp,fontSize:12,padding:"7px 9px" }} />
        {showWho && <input value={item.who||""} onChange={e=>onChange(idx,"who",e.target.value)}
          placeholder="Quem paga" style={{ ...inp,fontSize:12,padding:"7px 9px" }} />}
        {showOwner && <input value={item.cardOwner||""} onChange={e=>onChange(idx,"cardOwner",e.target.value)}
          placeholder="Dono cartão" style={{ ...inp,fontSize:12,padding:"7px 9px" }} />}
        <CatSelect value={item.category||""} onChange={v=>onChange(idx,"category",v)} />
        <input value={item.value||""} onChange={e=>onChange(idx,"value",e.target.value)}
          placeholder="R$ 0,00" type="number"
          style={{ ...inp,fontSize:12,padding:"7px 9px",textAlign:"right",color:C.pink }} />
        {canSplit && (
          <button onClick={()=>setOpen(o=>!o)} title="Dividir com alguém"
            style={{ padding:0, borderRadius:8, border:`1px ${hasSplit?"solid":"dashed"} ${hasSplit?C.pink:C.border}`, background:hasSplit?C.highlight:"none", color:hasSplit?C.pink:C.light, cursor:"pointer", fontSize:14, fontFamily:"inherit" }}>÷</button>
        )}
      </div>

      {canSplit && open && (
        <div style={{ background:"#fff8fa", border:`1px dashed ${C.border}`, borderRadius:10, padding:"8px 10px", marginTop:5, display:"grid", gridTemplateColumns:"1fr 100px 34px", gap:5, alignItems:"center" }}>
          <input value={item.splitWho||""} onChange={e=>onChange(idx,"splitWho",e.target.value)}
            placeholder="Dividido com…" style={{ ...inp,fontSize:12,padding:"7px 9px" }} />
          <input value={item.splitValue||""} onChange={e=>onChange(idx,"splitValue",e.target.value)}
            placeholder="Parte dele" type="number"
            style={{ ...inp,fontSize:12,padding:"7px 9px",textAlign:"right",color:C.pink2 }} />
          <button onClick={()=>onChange(idx,"splitValue", total>0 ? (total/2).toFixed(2) : "")} title="Dividir ao meio"
            style={{ padding:"7px 0", borderRadius:8, border:`1px solid ${C.border}`, background:"none", color:C.mid, cursor:"pointer", fontSize:12, fontFamily:"inherit" }}>½</button>
          <div style={{ gridColumn:"1 / -1", display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:11, color:C.mid }}>
            <span>Minha parte: <b style={{ color:C.pink }}>{fmt(mine(item))}</b> · o resto vai para Terceiros</span>
            {hasSplit && (
              <button onClick={()=>{ onChange(idx,"splitWho",""); onChange(idx,"splitValue",""); setOpen(false); }}
                style={{ background:"none", border:"none", color:C.light, cursor:"pointer", fontSize:11, fontFamily:"inherit", textDecoration:"underline" }}>remover</button>
            )}
          </div>
        </div>
      )}

      {canSplit && !open && hasSplit && (
        <div onClick={()=>setOpen(true)} style={{ cursor:"pointer", color:C.mid, fontSize:11, margin:"3px 0 0 4px" }}>
          ↳ 👤 {item.splitWho || "Sem nome"} paga {fmt(theirs(item))} · minha parte {fmt(mine(item))}
        </div>
      )}
    </div>
  );
}

// ── Card ───────────────────────────────────────────────────────────────────
function Card({ title, accent=C.pink, children, total, extra }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${accent}44`, borderRadius:16, padding:"16px 16px 12px", marginBottom:14, boxShadow:`0 2px 12px ${accent}12` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12, flexWrap:"wrap", gap:6 }}>
        <span style={{ color:accent, fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700 }}>{title}</span>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {extra}
          {total != null && <span style={{ color:accent, fontSize:13, fontWeight:700, background:`${accent}15`, padding:"3px 10px", borderRadius:20 }}>{fmt(total)}</span>}
        </div>
      </div>
      {children}
    </div>
  );
}

// ── SumRow ─────────────────────────────────────────────────────────────────
function SumRow({ label, value, highlight, sub, color }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 12px", borderRadius:8, marginBottom:5, background:highlight?"#ffe0eb":"#fff8fa", border:highlight?`1px solid ${C.border}`:"1px solid #fdeef3" }}>
      <span style={{ color:sub?C.light:C.mid, fontSize:sub?11:13 }}>{label}</span>
      <span style={{ color:color||(highlight?C.pink:C.dark), fontWeight:highlight?700:400, fontSize:highlight?15:13 }}>{value}</span>
    </div>
  );
}

// ── Installment Modal ──────────────────────────────────────────────────────
function InstallmentModal({ onConfirm, onClose, editData }) {
  const [form, setForm] = useState(editData || initInstallment());
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const total = parseR(form.totalValue);
  const n = parseInt(form.totalInstallments)||1;
  const paid = parseInt(form.paidInstallments)||0;
  const per = total/n;
  const remaining = n - paid;
  const yearOptions = ["2024","2025","2026","2027","2028","2029","2030"];

  function handleConfirm() {
    if (!form.desc || !form.totalValue || !form.startMonth) return;
    const id = form.id || `inst_${Date.now()}`;
    onConfirm({ ...form, id });
    onClose();
  }

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(255,200,220,0.6)",backdropFilter:"blur(4px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}>
      <div style={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:20,padding:24,width:480,maxWidth:"100%",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 8px 40px rgba(230,100,140,0.2)" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18 }}>
          <span style={{ color:C.pink,fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700 }}>📦 {form.id?"Editar":"Nova"} Compra Parcelada</span>
          <button onClick={onClose} style={{ background:"none",border:"none",color:C.mid,fontSize:20,cursor:"pointer" }}>✕</button>
        </div>

        <label style={lbl}>Descrição</label>
        <input style={inp} value={form.desc} onChange={e=>set("desc",e.target.value)} placeholder="Ex: Tênis Nike" />

        <label style={lbl}>Valor Total (R$)</label>
        <input style={inp} type="number" value={form.totalValue} onChange={e=>set("totalValue",e.target.value)} placeholder="0,00" />

        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
          <div>
            <label style={lbl}>Total de Parcelas</label>
            <input style={inp} type="number" min="1" max="60" value={form.totalInstallments} onChange={e=>set("totalInstallments",e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Parcelas Já Pagas</label>
            <input style={inp} type="number" min="0" value={form.paidInstallments} onChange={e=>set("paidInstallments",e.target.value)} />
          </div>
        </div>

        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
          <div>
            <label style={lbl}>Mês de Início</label>
            <select style={inp} value={form.startMonth} onChange={e=>set("startMonth",e.target.value)}>
              <option value="">Selecione…</option>
              {MONTHS.map(m=><option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Ano de Início</label>
            <select style={inp} value={form.startYear} onChange={e=>set("startYear",e.target.value)}>
              {yearOptions.map(y=><option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <label style={lbl}>Tipo</label>
        <select style={inp} value={form.target} onChange={e=>set("target",e.target.value)}>
          <option value="myCredit">Crédito — Minhas Compras</option>
          <option value="thirdCredit">Crédito — Terceiros</option>
          <option value="debit">Débito</option>
        </select>

        {form.target==="thirdCredit" && (
          <>
            <label style={lbl}>Quem vai pagar?</label>
            <input style={inp} value={form.who} onChange={e=>set("who",e.target.value)} placeholder="Nome da pessoa" />
          </>
        )}

        <label style={lbl}>Categoria</label>
        <CatSelect value={form.category} onChange={v=>set("category",v)} />

        {form.totalInstallments && form.startMonth && (
          <div style={{ marginTop:14,background:"#fff0f5",borderRadius:10,padding:"12px 14px" }}>
            <div style={{ color:C.mid,fontSize:11,marginBottom:8,textTransform:"uppercase",letterSpacing:1 }}>Resumo</div>
            <div style={{ display:"flex",justifyContent:"space-between",color:C.dark,fontSize:13,marginBottom:4 }}>
              <span>Valor por parcela</span><span style={{ fontWeight:700 }}>{fmt(per)}</span>
            </div>
            <div style={{ display:"flex",justifyContent:"space-between",color:C.mid,fontSize:12,marginBottom:4 }}>
              <span>Parcelas restantes</span><span>{remaining} de {n}</span>
            </div>
            <div style={{ display:"flex",justifyContent:"space-between",color:C.pink,fontSize:12 }}>
              <span>Ainda a pagar</span><span style={{ fontWeight:700 }}>{fmt(per*remaining)}</span>
            </div>
          </div>
        )}

        <div style={{ marginTop:18,display:"flex",gap:10 }}>
          <button onClick={onClose} style={{ flex:1,padding:"11px 0",borderRadius:9,border:`1px solid ${C.border}`,background:"none",color:C.mid,cursor:"pointer",fontSize:13,fontFamily:"inherit" }}>Cancelar</button>
          <button onClick={handleConfirm} style={{ flex:2,padding:"11px 0",borderRadius:9,border:"none",background:`linear-gradient(135deg,${C.pink},${C.pink2})`,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:13,fontFamily:"inherit" }}>
            {form.id?"Salvar alterações ✓":"Adicionar Parcelas ✓"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Category Chart ─────────────────────────────────────────────────────────
function CategoryChart({ month }) {
  const totals = {};
  const addToTotals = (items) => (items||[]).forEach(r => {
    if (r.value && r.category) {
      totals[r.category] = (totals[r.category]||0) + mine(r);
    }
  });
  addToTotals(month.myCredit);
  addToTotals(month.thirdCredit);
  addToTotals(month.debit);
  addToTotals(month.food);
  if (month.cash && parseR(month.cash) > 0) totals["outros"] = (totals["outros"]||0) + parseR(month.cash);

  const data = Object.entries(totals).map(([id, value]) => {
    const cat = CATEGORIES.find(c=>c.id===id) || { label:id, color:"#94a3b8", emoji:"📦" };
    return { name: `${cat.emoji} ${cat.label}`, value, color: cat.color };
  }).filter(d=>d.value>0).sort((a,b)=>b.value-a.value);

  if (!data.length) return (
    <div style={{ textAlign:"center",color:C.light,padding:"30px 0",fontSize:13 }}>
      Nenhum gasto categorizado ainda 🌸
    </div>
  );

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} paddingAngle={3}>
            {data.map((d,i) => <Cell key={i} fill={d.color} />)}
          </Pie>
          <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background:"#fff",border:`1px solid ${C.border}`,borderRadius:10,fontSize:12 }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11,color:C.dark }} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ marginTop:8 }}>
        {data.map((d,i) => (
          <div key={i} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 10px",borderRadius:8,marginBottom:4,background:"#fff8fa" }}>
            <div style={{ display:"flex",alignItems:"center",gap:8 }}>
              <span style={{ width:10,height:10,borderRadius:"50%",background:d.color,display:"inline-block",flexShrink:0 }} />
              <span style={{ color:C.dark,fontSize:12 }}>{d.name}</span>
            </div>
            <span style={{ color:C.pink,fontWeight:700,fontSize:12 }}>{fmt(d.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const nowYear = String(new Date().getFullYear());
  const [data, setData] = useState(() => loadData());
  const [activeYear, setActiveYear] = useState(nowYear);
  const [activeMonth, setActiveMonth] = useState(MONTHS[new Date().getMonth()]);
  const [tab, setTab] = useState("credit");
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [editInstall, setEditInstall] = useState(null);

  useEffect(() => { saveData(data); }, [data]);

  const getMonth = (y, m) => ({ ...initMonth(), ...(((data.years || {})[y] || {})[m] || {}) });
  const month = getMonth(activeYear, activeMonth);

  const yearList = Array.from(new Set([...Object.keys(data.years || {}), nowYear, activeYear])).sort();

  function addYear() {
    const nextYear = String(Math.max(...yearList.map(Number)) + 1);
    setData(prev => {
      const years = { ...prev.years };
      if (!years[nextYear]) years[nextYear] = initYear();
      return { ...prev, years };
    });
    setActiveYear(nextYear);
  }

  function updateMonth(updater) {
    setData(prev => {
      const yr = (prev.years || {})[activeYear] || {};
      const base = { ...initMonth(), ...(yr[activeMonth] || {}) };
      const next = { ...prev, years: { ...prev.years, [activeYear]: { ...yr, [activeMonth]: JSON.parse(JSON.stringify(base)) } } };
      updater(next.years[activeYear][activeMonth]);
      return next;
    });
  }

  function updateRow(section, idx, field, value) {
    updateMonth(m => { m[section][idx] = { ...m[section][idx], [field]: value }; });
  }

  function addRow(section, template) {
    updateMonth(m => { m[section] = [...m[section], template]; });
  }

  // Apply installment to months (agora respeitando o ano de cada parcela)
  function applyInstallment(inst) {
    const startIdx = MONTHS.indexOf(inst.startMonth);
    const startYear = parseInt(inst.startYear) || new Date().getFullYear();
    const n = parseInt(inst.totalInstallments)||1;
    const paid = parseInt(inst.paidInstallments)||0;
    const per = parseR(inst.totalValue) / n;

    setData(prev => {
      const next = { ...prev, years: JSON.parse(JSON.stringify(prev.years || {})), installments: [...(prev.installments||[])] };

      // Remove old entries for this installment (em todos os anos)
      Object.keys(next.years).forEach(y => {
        MONTHS.forEach(mName => {
          const m = next.years[y][mName];
          if (!m) return;
          ["myCredit","thirdCredit","debit"].forEach(sec => {
            m[sec] = m[sec].filter(r => r.installmentId !== inst.id);
          });
        });
      });

      // Add new entries for remaining installments
      for (let i = paid; i < n; i++) {
        const absMonth = startIdx + i;
        const y = String(startYear + Math.floor(absMonth / 12));
        const mName = MONTHS[absMonth % 12];
        if (!next.years[y]) next.years[y] = initYear();
        const m = next.years[y][mName];
        if (!m) continue;
        const label = `${inst.desc} (${i+1}/${n})`;
        const entry = { desc:label, value:String(per.toFixed(2)), category:inst.category, installmentId:inst.id };
        const sec = inst.target;
        if (sec === "thirdCredit") entry.who = inst.who;
        const emptyIdx = m[sec].findIndex(r => !r.desc && !r.value);
        if (emptyIdx !== -1) m[sec][emptyIdx] = entry;
        else m[sec].push(entry);
      }

      // Save/update installment record
      const existIdx = next.installments.findIndex(x=>x.id===inst.id);
      if (existIdx !== -1) next.installments[existIdx] = inst;
      else next.installments.push(inst);

      return next;
    });
  }

  function deleteInstallment(id) {
    setData(prev => {
      const next = { ...prev, years: JSON.parse(JSON.stringify(prev.years || {})), installments: prev.installments.filter(x=>x.id!==id) };
      Object.keys(next.years).forEach(y => {
        MONTHS.forEach(mName => {
          const m = next.years[y][mName];
          if (!m) return;
          ["myCredit","thirdCredit","debit"].forEach(sec => {
            m[sec] = m[sec].filter(r => r.installmentId !== id);
          });
        });
      });
      return next;
    });
  }

  // Totals (sempre só a MINHA parte quando o gasto foi dividido)
  const sumMy = month.myCredit.reduce((a,r)=>a+mine(r),0);
  const sumThird = month.thirdCredit.reduce((a,r)=>a+parseR(r.value),0);
  const sumSplitCredit = month.myCredit.reduce((a,r)=>a+theirs(r),0);
  const sumThirdCard = sumThird + sumSplitCredit;
  const totalFatura = sumMy + sumThirdCard;
  const totalDebit = month.debit.reduce((a,r)=>a+mine(r),0);
  const totalFood = month.food.reduce((a,r)=>a+mine(r),0);
  const splitDebit = month.debit.reduce((a,r)=>a+theirs(r),0);
  const splitFood = month.food.reduce((a,r)=>a+theirs(r),0);
  const totalOtherCard = (month.otherCardSpend||[]).reduce((a,r)=>a+parseR(r.value),0);
  const income = parseR(month.income);
  const carryover = parseR(month.carryover);
  const cash = parseR(month.cash);
  const totalOut = totalDebit + cash;
  const sobraAntesCredito = income + carryover - totalOut;

  // Fatura do mês anterior (crédito pago no mês seguinte) — janeiro puxa dezembro do ano anterior
  const prev = prevOf(activeYear, activeMonth);
  const prevMonth = prev.m;
  const prevMonthData = getMonth(prev.y, prev.m);
  const prevSumMy = prevMonthData.myCredit.reduce((a,r)=>a+mine(r),0);
  const sobraFinal = sobraAntesCredito - prevSumMy;
  const prevLabel = prev.y !== activeYear ? `${prevMonth} ${prev.y}` : prevMonth;

  // Sobra final do mês anterior (para preencher "Sobrou do mês passado")
  const prevPrev = prevOf(prev.y, prev.m);
  const prevPrevData = getMonth(prevPrev.y, prevPrev.m);
  const prevSobraFinal =
    parseR(prevMonthData.income) + parseR(prevMonthData.carryover)
    - (prevMonthData.debit.reduce((a,r)=>a+mine(r),0) + parseR(prevMonthData.cash))
    - prevPrevData.myCredit.reduce((a,r)=>a+mine(r),0);

  // Third party breakdown (terceiros + partes divididas)
  const thirdByPerson = {};
  const addThird = (who, val) => {
    if (val > 0) {
      const k = (who||"").trim() || "Sem nome";
      thirdByPerson[k] = (thirdByPerson[k]||0) + val;
    }
  };
  month.thirdCredit.forEach(r => { if (r.value && r.who) addThird(r.who, parseR(r.value)); });
  [...month.myCredit, ...month.debit, ...month.food].forEach(r => addThird(r.splitWho, theirs(r)));
  const receivable = sumThird + sumSplitCredit + splitDebit + splitFood;

  const tabs = [
    { id:"credit", label:"💳 Crédito" },
    { id:"debit", label:"💸 Débito" },
    { id:"othercard", label:"🔄 Outro Cartão" },
    { id:"installments", label:"📦 Parcelas" },
    { id:"summary", label:"📊 Resumo" },
    { id:"chart", label:"📈 Gráfico" },
    { id:"notes", label:"📝 Notas" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:`linear-gradient(160deg,${C.bg} 0%,${C.bg2} 100%)`, color:C.dark, fontFamily:"'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background:C.grad, borderBottom:`1px solid ${C.border}`, padding:"16px 20px", boxShadow:"0 2px 16px rgba(230,100,140,0.12)" }}>
        <div style={{ maxWidth:720, margin:"0 auto" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:10 }}>
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:"#fff" }}>💰 Controle Financeiro {activeYear}</div>
              <div style={{ color:"#fff0f5", fontSize:12, marginTop:2, opacity:0.85 }}>Gerencie seus gastos com carinho 🌸</div>
            </div>
            <button onClick={()=>{ setEditInstall(null); setShowInstallModal(true); }}
              style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 16px", borderRadius:22, border:"none", background:"#fff", color:C.pink, fontWeight:700, fontSize:13, cursor:"pointer", whiteSpace:"nowrap", fontFamily:"inherit" }}>
              📦 + Parcelar
            </button>
          </div>

          {/* Anos */}
          <div style={{ display:"flex", gap:4, marginTop:14, overflowX:"auto", paddingBottom:2 }}>
            {yearList.map(y => {
              const isActive = y === activeYear;
              return (
                <button key={y} onClick={()=>setActiveYear(y)}
                  style={{ flexShrink:0, padding:"4px 12px", borderRadius:20, border:isActive?"none":"1px solid rgba(255,255,255,0.5)", background:isActive?"#fff":"rgba(255,255,255,0.25)", color:isActive?C.pink:"rgba(255,255,255,0.9)", fontSize:12, cursor:"pointer", fontWeight:isActive?700:500, fontFamily:"inherit" }}>
                  {y}
                </button>
              );
            })}
            <button onClick={addYear} title="Adicionar próximo ano"
              style={{ flexShrink:0, padding:"4px 12px", borderRadius:20, border:"1px dashed rgba(255,255,255,0.7)", background:"none", color:"#fff", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
              + ano
            </button>
          </div>

          {/* Meses */}
          <div style={{ display:"flex", gap:4, marginTop:8, overflowX:"auto", paddingBottom:2 }}>
            {MONTHS.map(m => {
              const isActive = m === activeMonth;
              const isNow = MONTHS.indexOf(m) === new Date().getMonth() && activeYear === nowYear;
              const md = getMonth(activeYear, m);
              const hasData = md.myCredit.some(r=>r.value) || md.debit.some(r=>r.value) || md.food.some(r=>r.value) || md.income;
              return (
                <button key={m} onClick={()=>setActiveMonth(m)}
                  style={{ flexShrink:0, padding:"5px 11px", borderRadius:20, border:isActive?"none":"1px solid rgba(255,255,255,0.5)", background:isActive?"#fff":"rgba(255,255,255,0.25)", color:isActive?C.pink:isNow?"#fff":"rgba(255,255,255,0.8)", fontSize:12, cursor:"pointer", fontWeight:isActive||isNow?700:400, position:"relative", fontFamily:"inherit" }}>
                  {m.slice(0,3)}
                  {hasData && !isActive && <span style={{ position:"absolute", top:2, right:3, width:4, height:4, borderRadius:"50%", background:"#fff" }} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ maxWidth:720, margin:"0 auto", padding:"0 14px" }}>
        <div style={{ display:"flex", marginTop:14, borderRadius:14, overflow:"hidden", border:`1px solid ${C.border}`, background:C.white, overflowX:"auto" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{ flexShrink:0, padding:"9px 8px", border:"none", background:tab===t.id?"linear-gradient(135deg,#ffe0eb,#ffd0e0)":"transparent", color:tab===t.id?C.pink:C.mid, fontSize:11, fontWeight:tab===t.id?700:400, cursor:"pointer", borderBottom:tab===t.id?`2px solid ${C.pink}`:"2px solid transparent", fontFamily:"inherit", whiteSpace:"nowrap" }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ paddingBottom:50, marginTop:14 }}>

          {/* ── CRÉDITO ── */}
          {tab==="credit" && (
            <>
              <Card title="📌 Minhas Compras no Crédito" accent={C.pink} total={sumMy}>
                <div style={{ color:C.light, fontSize:11, marginBottom:10 }}>Não impacta o saldo do mês — pago no mês seguinte. Use o ÷ para dividir com alguém.</div>
                {month.myCredit.map((r,i) => <Row key={i} item={r} idx={i} canSplit onChange={(idx,f,v)=>updateRow("myCredit",idx,f,v)} />)}
                <button onClick={()=>addRow("myCredit",{desc:"",value:"",category:"",installmentId:""})} style={{ width:"100%",padding:"7px",borderRadius:8,border:`1px dashed ${C.border}`,background:"none",color:C.light,cursor:"pointer",fontSize:12,marginTop:4,fontFamily:"inherit" }}>+ Adicionar linha</button>
              </Card>

              <Card title="👥 Terceiros (vão me reembolsar)" accent={C.pink2} total={sumThirdCard}>
                {month.thirdCredit.map((r,i) => <Row key={i} item={r} idx={i} onChange={(idx,f,v)=>updateRow("thirdCredit",idx,f,v)} showWho />)}
                <button onClick={()=>addRow("thirdCredit",{desc:"",value:"",who:"",category:"",installmentId:""})} style={{ width:"100%",padding:"7px",borderRadius:8,border:`1px dashed ${C.border}`,background:"none",color:C.light,cursor:"pointer",fontSize:12,marginTop:4,fontFamily:"inherit" }}>+ Adicionar linha</button>

                {sumSplitCredit > 0 && (
                  <div style={{ marginTop:12 }}>
                    <div style={{ color:C.light, fontSize:11, marginBottom:6 }}>Partes de gastos divididos nas minhas compras</div>
                    {month.myCredit.map((r,i) => theirs(r) > 0 && (
                      <SumRow key={i} label={`↳ ${r.desc || `Item ${i+1}`} · ${r.splitWho || "Sem nome"}`} value={fmt(theirs(r))} sub />
                    ))}
                  </div>
                )}
              </Card>

              {Object.keys(thirdByPerson).length > 0 && (
                <Card title="💰 Quanto Cada Um Me Deve" accent={C.pink2}>
                  {Object.entries(thirdByPerson).map(([who,val])=>(
                    <SumRow key={who} label={`👤 ${who}`} value={fmt(val)} sub />
                  ))}
                  <SumRow label="Total a receber" value={fmt(receivable)} />
                </Card>
              )}

              <div style={{ background:C.gradCard, border:`1px solid ${C.border}`, borderRadius:16, padding:"16px", textAlign:"center" }}>
                <div style={{ color:C.mid, fontSize:11, textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>🔢 Total da Fatura</div>
                <div style={{ color:C.pink, fontSize:28, fontFamily:"'Playfair Display',serif", fontWeight:700 }}>{fmt(totalFatura)}</div>
                <div style={{ display:"flex", justifyContent:"center", gap:20, marginTop:8 }}>
                  <span style={{ color:C.pink, fontSize:12 }}>Minhas: {fmt(sumMy)}</span>
                  <span style={{ color:C.pink2, fontSize:12 }}>Terceiros: {fmt(sumThirdCard)}</span>
                </div>
              </div>
            </>
          )}

          {/* ── DÉBITO ── */}
          {tab==="debit" && (
            <>
              <Card title="💸 Gastos no Débito" accent={C.pink} total={totalDebit}>
                <div style={{ color:C.light, fontSize:11, marginBottom:10 }}>Esses gastos impactam o saldo do mês atual. Use o ÷ para dividir com alguém.</div>
                {month.debit.map((r,i) => <Row key={i} item={r} idx={i} canSplit onChange={(idx,f,v)=>updateRow("debit",idx,f,v)} />)}
                <button onClick={()=>addRow("debit",{desc:"",value:"",category:""})} style={{ width:"100%",padding:"7px",borderRadius:8,border:`1px dashed ${C.border}`,background:"none",color:C.light,cursor:"pointer",fontSize:12,marginTop:4,fontFamily:"inherit" }}>+ Adicionar linha</button>
              </Card>

              <Card title="🍽️ Cartão Alimentação" accent={FOOD} total={totalFood}>
                <div style={{ color:C.light, fontSize:11, marginBottom:10 }}>Gastos do vale alimentação — ficam separados do saldo do mês</div>
                {month.food.map((r,i) => <Row key={i} item={r} idx={i} canSplit onChange={(idx,f,v)=>updateRow("food",idx,f,v)} />)}
                <button onClick={()=>addRow("food",{desc:"",value:"",category:""})} style={{ width:"100%",padding:"7px",borderRadius:8,border:`1px dashed ${FOOD}55`,background:"none",color:FOOD,cursor:"pointer",fontSize:12,marginTop:4,fontFamily:"inherit" }}>+ Adicionar linha</button>
              </Card>

              {(splitDebit + splitFood) > 0 && (
                <Card title="👥 Partes de Terceiros (débito e alimentação)" accent={C.pink2} total={splitDebit + splitFood}>
                  {month.debit.map((r,i) => theirs(r) > 0 && (
                    <SumRow key={`d${i}`} label={`💸 ${r.desc || `Item ${i+1}`} · ${r.splitWho || "Sem nome"}`} value={fmt(theirs(r))} sub />
                  ))}
                  {month.food.map((r,i) => theirs(r) > 0 && (
                    <SumRow key={`f${i}`} label={`🍽️ ${r.desc || `Item ${i+1}`} · ${r.splitWho || "Sem nome"}`} value={fmt(theirs(r))} sub />
                  ))}
                </Card>
              )}
            </>
          )}

          {/* ── OUTRO CARTÃO ── */}
          {tab==="othercard" && (
            <Card title="🔄 Gastos no Cartão de Outra Pessoa" accent="#a855f7" total={totalOtherCard}>
              <div style={{ color:"#c084fc", fontSize:11, marginBottom:10 }}>Compras feitas no cartão de outra pessoa — você paga de volta</div>
              {(month.otherCardSpend||[]).map((r,i) => (
                <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 110px 110px 80px 40px", gap:5, marginBottom:5, alignItems:"center" }}>
                  <input value={r.desc||""} onChange={e=>updateRow("otherCardSpend",i,"desc",e.target.value)} placeholder={`Item ${i+1}`} style={{ ...inp,fontSize:12,padding:"7px 9px" }} />
                  <input value={r.cardOwner||""} onChange={e=>updateRow("otherCardSpend",i,"cardOwner",e.target.value)} placeholder="Dono cartão" style={{ ...inp,fontSize:12,padding:"7px 9px" }} />
                  <CatSelect value={r.category||""} onChange={v=>updateRow("otherCardSpend",i,"category",v)} />
                  <input value={r.value||""} onChange={e=>updateRow("otherCardSpend",i,"value",e.target.value)} placeholder="R$ 0,00" type="number" style={{ ...inp,fontSize:12,padding:"7px 9px",textAlign:"right",color:"#a855f7" }} />
                  <button onClick={()=>updateRow("otherCardSpend",i,"isPaid",!r.isPaid)}
                    style={{ padding:"7px 4px", borderRadius:8, border:`1px solid ${r.isPaid?"#22c55e":"#f7c5d5"}`, background:r.isPaid?"#f0fdf4":"none", color:r.isPaid?"#22c55e":C.light, cursor:"pointer", fontSize:11, fontFamily:"inherit" }}>
                    {r.isPaid?"✓":"—"}
                  </button>
                </div>
              ))}
              <button onClick={()=>addRow("otherCardSpend",{desc:"",value:"",cardOwner:"",category:"",isPaid:false})} style={{ width:"100%",padding:"7px",borderRadius:8,border:"1px dashed #e9d5ff",background:"none",color:"#c084fc",cursor:"pointer",fontSize:12,marginTop:4,fontFamily:"inherit" }}>+ Adicionar linha</button>
              {totalOtherCard > 0 && (
                <div style={{ marginTop:12, padding:"10px 12px", background:"#faf5ff", borderRadius:10, border:"1px solid #e9d5ff" }}>
                  <div style={{ color:"#a855f7", fontSize:12, fontWeight:700 }}>Total a pagar: {fmt(totalOtherCard)}</div>
                  <div style={{ color:"#c084fc", fontSize:11, marginTop:3 }}>Pago: {fmt((month.otherCardSpend||[]).filter(r=>r.isPaid).reduce((a,r)=>a+parseR(r.value),0))} · Pendente: {fmt((month.otherCardSpend||[]).filter(r=>!r.isPaid).reduce((a,r)=>a+parseR(r.value),0))}</div>
                </div>
              )}
            </Card>
          )}

          {/* ── PARCELAS ── */}
          {tab==="installments" && (
            <>
              <button onClick={()=>{ setEditInstall(null); setShowInstallModal(true); }}
                style={{ width:"100%", padding:"12px", borderRadius:12, border:`2px dashed ${C.border}`, background:"#fff8fa", color:C.pink, cursor:"pointer", fontSize:13, fontWeight:700, marginBottom:14, fontFamily:"inherit" }}>
                📦 + Nova Compra Parcelada
              </button>
              {(data.installments||[]).length === 0 && (
                <div style={{ textAlign:"center", color:C.light, padding:"40px 0", fontSize:13 }}>Nenhuma parcela cadastrada ainda 🌸</div>
              )}
              {(data.installments||[]).map(inst => {
                const n = parseInt(inst.totalInstallments)||1;
                const paid = parseInt(inst.paidInstallments)||0;
                const per = parseR(inst.totalValue)/n;
                const remaining = n - paid;
                const pct = Math.round((paid/n)*100);
                const cat = CATEGORIES.find(c=>c.id===inst.category);
                return (
                  <div key={inst.id} style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px 16px", marginBottom:10 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                      <div>
                        <div style={{ color:C.dark, fontWeight:700, fontSize:14 }}>{inst.desc}</div>
                        <div style={{ color:C.light, fontSize:11, marginTop:2 }}>
                          {cat ? `${cat.emoji} ${cat.label} · ` : ""}{inst.startMonth} {inst.startYear}
                          {inst.who ? ` · 👤 ${inst.who}` : ""}
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:6 }}>
                        <button onClick={()=>{ setEditInstall(inst); setShowInstallModal(true); }}
                          style={{ padding:"5px 10px", borderRadius:8, border:`1px solid ${C.border}`, background:"none", color:C.mid, cursor:"pointer", fontSize:11, fontFamily:"inherit" }}>✏️</button>
                        <button onClick={()=>deleteInstallment(inst.id)}
                          style={{ padding:"5px 10px", borderRadius:8, border:"1px solid #fecdd3", background:"none", color:"#f43f5e", cursor:"pointer", fontSize:11, fontFamily:"inherit" }}>🗑️</button>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:16, marginBottom:8, flexWrap:"wrap" }}>
                      <span style={{ color:C.pink, fontSize:13, fontWeight:700 }}>{fmt(per)}/mês</span>
                      <span style={{ color:C.mid, fontSize:12 }}>{paid}/{n} pagas</span>
                      <span style={{ color:C.dark, fontSize:12 }}>Restante: {fmt(per*remaining)}</span>
                    </div>
                    <div style={{ background:"#fdeef3", borderRadius:20, height:6, overflow:"hidden" }}>
                      <div style={{ width:`${pct}%`, height:"100%", background:`linear-gradient(90deg,${C.pink},${C.pink2})`, borderRadius:20, transition:"width .3s" }} />
                    </div>
                    <div style={{ color:C.light, fontSize:10, marginTop:4, textAlign:"right" }}>{pct}% pago</div>
                    <div style={{ marginTop:8, display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ color:C.mid, fontSize:11 }}>Marcar parcelas pagas:</span>
                      <input type="number" min="0" max={n} value={paid}
                        onChange={e=>{
                          const newPaid = Math.min(Math.max(0,parseInt(e.target.value)||0),n);
                          applyInstallment({...inst, paidInstallments:String(newPaid)});
                        }}
                        style={{ ...inp, width:60, padding:"4px 8px", fontSize:12, textAlign:"center" }} />
                      <span style={{ color:C.light, fontSize:11 }}>de {n}</span>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* ── RESUMO ── */}
          {tab==="summary" && (
            <>
              <Card title={`📊 Resumo — ${activeMonth} ${activeYear}`} accent={C.pink}>
                <label style={lbl}>💰 Renda Total</label>
                <input style={{...inp,marginBottom:10}} type="number" value={month.income} onChange={e=>updateMonth(m=>{m.income=e.target.value})} placeholder="R$ 0,00" />

                <label style={lbl}>🏦 Sobrou do mês passado</label>
                <input style={{...inp,marginBottom:6}} type="number" value={month.carryover||""} onChange={e=>updateMonth(m=>{m.carryover=e.target.value})} placeholder="R$ 0,00" />
                <button onClick={()=>updateMonth(m=>{m.carryover=prevSobraFinal.toFixed(2)})}
                  style={{ background:"none", border:"none", color:C.pink, cursor:"pointer", fontSize:11, fontFamily:"inherit", textDecoration:"underline", padding:0, marginBottom:10 }}>
                  ↩ Usar a sobra final de {prevLabel} ({fmt(prevSobraFinal)})
                </button>

                <label style={lbl}>💵 Dinheiro / Pix / Outros</label>
                <input style={{...inp,marginBottom:14}} type="number" value={month.cash} onChange={e=>updateMonth(m=>{m.cash=e.target.value})} placeholder="R$ 0,00" />

                <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:12 }}>
                  <SumRow label="💰 Renda Total" value={fmt(income)} />
                  <SumRow label="🏦 Sobrou do mês passado" value={fmt(carryover)} />
                  <div style={{ marginLeft:12 }}>
                    <SumRow label="💸 Débito (minha parte)" value={fmt(totalDebit)} sub />
                    <SumRow label="💵 Dinheiro / Outros" value={fmt(cash)} sub />
                  </div>
                  <SumRow label="💵 Sobra antes da fatura" value={fmt(sobraAntesCredito)} color={sobraAntesCredito>=0?C.pink:"#f43f5e"} />
                  <div style={{ marginLeft:12 }}>
                    <SumRow label={`💳 Fatura de ${prevLabel} (paga agora)`} value={fmt(prevSumMy)} sub />
                  </div>
                  <div style={{ borderTop:`1px solid ${C.border}`, marginTop:8, paddingTop:8 }}>
                    <SumRow label="✅ SOBRA FINAL DO MÊS" value={fmt(sobraFinal)} highlight />
                    <div style={{ color:C.light, fontSize:10, textAlign:"center", marginTop:4 }}>Já descontando o que você vai pagar na fatura do crédito</div>
                  </div>
                </div>
              </Card>

              <Card title="💳 Fatura do Crédito (referência)" accent={C.pink2}>
                <div style={{ color:C.light, fontSize:11, marginBottom:10 }}>Não entra no saldo — será pago mês que vem</div>
                <SumRow label={`Minhas compras (${activeMonth})`} value={fmt(sumMy)} sub />
                <SumRow label="A receber de terceiros" value={fmt(sumThirdCard)} sub />
                <SumRow label="Total da fatura" value={fmt(totalFatura)} />
              </Card>

              {totalFood > 0 && (
                <Card title="🍽️ Cartão Alimentação" accent={FOOD}>
                  <div style={{ color:C.light, fontSize:11, marginBottom:10 }}>Não entra no saldo do mês</div>
                  <SumRow label={`Gasto no vale (${activeMonth})`} value={fmt(totalFood)} color={FOOD} />
                </Card>
              )}

              {Object.keys(thirdByPerson).length > 0 && (
                <Card title="👥 Quanto Cada Um Me Deve" accent={C.pink2}>
                  {Object.entries(thirdByPerson).map(([who,val])=>(
                    <SumRow key={who} label={`👤 ${who}`} value={fmt(val)} sub />
                  ))}
                  <SumRow label="Total a receber" value={fmt(receivable)} />
                </Card>
              )}

              {totalOtherCard > 0 && (
                <Card title="🔄 Devo no Cartão de Outros" accent="#a855f7">
                  <SumRow label="Total a pagar" value={fmt(totalOtherCard)} color="#a855f7" />
                  <SumRow label="Já pago" value={fmt((month.otherCardSpend||[]).filter(r=>r.isPaid).reduce((a,r)=>a+parseR(r.value),0))} sub />
                  <SumRow label="Pendente" value={fmt((month.otherCardSpend||[]).filter(r=>!r.isPaid).reduce((a,r)=>a+parseR(r.value),0))} sub />
                </Card>
              )}
            </>
          )}

          {/* ── GRÁFICO ── */}
          {tab==="chart" && (
            <Card title={`📈 Gastos por Categoria — ${activeMonth} ${activeYear}`} accent={C.pink}>
              <CategoryChart month={month} />
            </Card>
          )}

          {/* ── NOTAS ── */}
          {tab==="notes" && (
            <Card title={`📝 Bloco de Notas — ${activeMonth} ${activeYear}`} accent={C.pink2}>
              <textarea value={month.notes||""} onChange={e=>updateMonth(m=>{m.notes=e.target.value})}
                placeholder={`Anotações de ${activeMonth}... 🌸`}
                style={{ ...inp, minHeight:300, resize:"vertical", lineHeight:1.7, fontSize:14, padding:"14px" }} />
              <div style={{ color:C.light, fontSize:11, marginTop:6, textAlign:"right" }}>{(month.notes||"").length} caracteres</div>
            </Card>
          )}

        </div>
      </div>

      {showInstallModal && (
        <InstallmentModal
          editData={editInstall}
          onConfirm={inst => applyInstallment(inst)}
          onClose={()=>{ setShowInstallModal(false); setEditInstall(null); }}
        />
      )}
    </div>
  );
}