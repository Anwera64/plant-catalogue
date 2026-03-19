import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "catalogo-plantas-data";
const TAGS_KEY = "catalogo-plantas-tags";

const LIGHT_OPTIONS = ["Pleno sol", "Sol parcial", "Sombra", "Sombra parcial"];
const WATER_OPTIONS = ["Diario", "Cada 2-3 días", "Semanal", "Quincenal", "Mensual"];
const SOIL_OPTIONS = ["Tierra común", "Arena / bien drenada", "Ácida", "Alcalina", "Rica en nutrientes"];
const ROOT_OPTIONS = ["Fibrosa", "Pivotante", "Bulbosa", "Rizoma", "Tuberosa", "Aérea", "Adventicia"];

const PLANT_TYPES = [
  { value: "cubresuelo", label: "Cubresuelo", emoji: "🍀", desc: "Crece al ras del suelo cubriendo superficies" },
  { value: "herbaceas",  label: "Herbácea",   emoji: "🌿", desc: "Tallo blando sin madera, generalmente pequeña" },
  { value: "arbustivas", label: "Arbustiva",  emoji: "🪴", desc: "Tallo leñoso ramificado desde la base" },
  { value: "arboles",    label: "Árbol",      emoji: "🌲", desc: "Tallo leñoso principal con copa definida" },
];

const DEFAULT_TAGS = ["Interior","Exterior","Jardín tropical","Jardín desértico","Jardín zen",
  "Jardín acuático","Balcón","Terrario","Huerto","Sombra profunda","Cubierta","Maceta"];

const ROOT_GLOSSARY = [
  { name:"Fibrosa",    emoji:"🌾", color:"#3d5a20", description:"Conjunto de raíces delgadas y muy ramificadas que se extienden desde la base del tallo en múltiples direcciones. Son muy eficientes absorbiendo agua y nutrientes de la capa superficial del suelo.", examples:"Helechos, bambú, césped, maíz" },
  { name:"Pivotante",  emoji:"🥕", color:"#5a3d20", description:"Una raíz principal gruesa y vertical que crece profundamente en el suelo, con raíces secundarias pequeñas a los lados. Permite llegar a capas profundas para obtener agua en épocas secas.", examples:"Zanahoria, roble, diente de león, pino" },
  { name:"Bulbosa",    emoji:"🧅", color:"#5a4a20", description:"Estructura subterránea abultada que almacena energía y nutrientes. La parte aérea muere en temporada fría y renace desde el bulbo cada ciclo. Incluye raíces y tallo modificado.", examples:"Tulipán, cebolla, ajo, jacinto, narciso" },
  { name:"Rizoma",     emoji:"🫚", color:"#3a5a3a", description:"Tallo subterráneo horizontal que crece paralelo al suelo y produce nuevas plantas a lo largo de su recorrido. Excelente mecanismo de reproducción vegetativa y expansión.", examples:"Jengibre, iris, menta, lirio, espárrago" },
  { name:"Tuberosa",   emoji:"🥔", color:"#5a3520", description:"Raíz engrosada que almacena grandes cantidades de almidón y agua como reserva de energía. A diferencia del bulbo, es una raíz verdadera modificada. Permite sobrevivir en condiciones adversas.", examples:"Camote, dalia, mandioca, rábano" },
  { name:"Aérea",      emoji:"🌀", color:"#205a4a", description:"Raíces que crecen fuera del suelo, expuestas al aire. Pueden absorber humedad ambiental, servir de sostén anclándose a superficies, o incluso realizar fotosíntesis. Típicas de epífitas y trepadoras.", examples:"Orquídea, hiedra, ficus, monstera, vainilla" },
  { name:"Adventicia", emoji:"🌱", color:"#2a4a5a", description:"Raíces que emergen en lugares atípicos como tallos o hojas, en respuesta al ambiente o daño físico. Clave en la propagación de plantas y en especies que crecen sobre otras superficies.", examples:"Pothos, fresa (estolones), maíz (raíces zancos)" },
];

const emptyForm = {
  commonName:"", scientificName:"", photo:"",
  light:"", water:"", soil:"", rootType:"",
  plantType:"", heightMin:"", heightMax:"", canopySize:"",
  gardenTags:[], notes:"",
};

const font = { serif:"'Playfair Display', serif", body:"'Lora', serif" };

// ── Chip components ─────────────────────────────────
function TagChip({ label, active, onClick, onDelete }) {
  return (
    <span onClick={onClick} style={{
      display:"inline-flex", alignItems:"center", gap:"4px",
      padding:"3px 12px", borderRadius:"999px", fontSize:"12px",
      fontFamily:font.body, cursor:onClick?"pointer":"default",
      background:active?"#2d5a27":"#1a2e1a", color:active?"#a8d5a2":"#5a7a4a",
      border:active?"1px solid #4a8a3a":"1px solid #2a4a2a",
      transition:"all 0.15s", userSelect:"none",
    }}>
      {label}
      {onDelete && <span onClick={e=>{e.stopPropagation();onDelete();}} style={{marginLeft:"2px",opacity:0.6,fontWeight:"bold"}}>×</span>}
    </span>
  );
}
function BrownChip({ label }) {
  return <span style={{display:"inline-flex",alignItems:"center",padding:"3px 12px",borderRadius:"999px",fontSize:"12px",fontFamily:font.body,background:"#3d2b1f",color:"#c4a882",border:"1px solid rgba(255,255,255,0.08)"}}>{label}</span>;
}
function TealChip({ label }) {
  return <span style={{display:"inline-flex",alignItems:"center",padding:"3px 12px",borderRadius:"999px",fontSize:"12px",fontFamily:font.body,background:"#1a4040",color:"#7ecece",border:"1px solid rgba(255,255,255,0.08)"}}>{label}</span>;
}
function TypeChip({ value }) {
  const t = PLANT_TYPES.find(o => o.value === value);
  if (!t) return null;
  return <span style={{display:"inline-flex",alignItems:"center",gap:"4px",padding:"3px 12px",borderRadius:"999px",fontSize:"12px",fontFamily:font.body,background:"#1e2a40",color:"#90b8e0",border:"1px solid #2a4060"}}>{t.emoji} {t.label}</span>;
}
function SectionLabel({ children }) {
  return <p style={{color:"#5a8a4a",fontFamily:font.body,fontSize:"11px",textTransform:"uppercase",letterSpacing:"0.1em",margin:"0 0 8px"}}>{children}</p>;
}

// ── Plant Card ────────────────────────────────────────
function PlantCard({ plant, onClick }) {
  const pt = PLANT_TYPES.find(o => o.value === plant.plantType);
  const heightStr = plant.heightMin || plant.heightMax
    ? (plant.heightMin && plant.heightMax ? `${plant.heightMin}–${plant.heightMax} m` : `${plant.heightMin||plant.heightMax} m`)
    : null;
  return (
    <div onClick={() => onClick(plant)} style={{background:"linear-gradient(160deg,#1a2e1a,#0f1f0f)",border:"1px solid #2a4a2a",borderRadius:"16px",overflow:"hidden",cursor:"pointer",transition:"transform 0.2s,box-shadow 0.2s",boxShadow:"0 4px 20px rgba(0,0,0,0.4)"}}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow="0 12px 32px rgba(0,0,0,0.6)";}}
      onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,0.4)";}}>
      <div style={{height:"170px",overflow:"hidden",position:"relative",background:"linear-gradient(135deg,#1e3a1e,#2d5a2d)",display:"flex",alignItems:"center",justifyContent:"center"}}>
        {plant.photo ? <img src={plant.photo} alt={plant.commonName} style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <span style={{fontSize:"48px",opacity:0.35}}>🌿</span>}
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:"60px",background:"linear-gradient(transparent,rgba(0,0,0,0.7))"}}/>
        {pt && <span style={{position:"absolute",top:"10px",right:"10px",fontSize:"20px",background:"rgba(0,0,0,0.45)",borderRadius:"8px",padding:"3px 6px"}}>{pt.emoji}</span>}
      </div>
      <div style={{padding:"14px 16px 16px"}}>
        <h3 style={{margin:"0 0 2px",color:"#d4e8c2",fontFamily:font.serif,fontSize:"16px",fontWeight:600,lineHeight:1.2}}>{plant.commonName||"Sin nombre"}</h3>
        <p style={{margin:"0 0 10px",color:"#7a9e6a",fontFamily:font.body,fontSize:"12px",fontStyle:"italic"}}>{plant.scientificName||"—"}</p>
        <div style={{display:"flex",flexWrap:"wrap",gap:"4px",marginBottom:"8px"}}>
          {plant.gardenTags?.slice(0,2).map(t=><TagChip key={t} label={t} active/>)}
          {plant.gardenTags?.length>2 && <span style={{color:"#7a9e6a",fontSize:"11px",alignSelf:"center"}}>+{plant.gardenTags.length-2}</span>}
          {plant.rootType && <BrownChip label={plant.rootType}/>}
        </div>
        <div style={{display:"flex",gap:"10px",flexWrap:"wrap"}}>
          {plant.light && <span style={{color:"#7a9e6a",fontSize:"11px",fontFamily:font.body}}>☀️ {plant.light}</span>}
          {plant.water && <span style={{color:"#7a9e6a",fontSize:"11px",fontFamily:font.body}}>💧 {plant.water}</span>}
          {heightStr && <span style={{color:"#7a9e6a",fontSize:"11px",fontFamily:font.body}}>📏 {heightStr}</span>}
          {plant.canopySize && <span style={{color:"#7a9e6a",fontSize:"11px",fontFamily:font.body}}>🌐 {plant.canopySize} m</span>}
        </div>
      </div>
    </div>
  );
}

// ── Detail Modal ──────────────────────────────────────
function DetailModal({ plant, onClose, onEdit, onDelete }) {
  if (!plant) return null;
  const root = ROOT_GLOSSARY.find(r => r.name === plant.rootType);
  const pt = PLANT_TYPES.find(o => o.value === plant.plantType);
  const heightStr = plant.heightMin || plant.heightMax
    ? (plant.heightMin && plant.heightMax ? `${plant.heightMin} – ${plant.heightMax} m` : `${plant.heightMin||plant.heightMax} m`)
    : null;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(4px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"linear-gradient(160deg,#1a2e1a,#0e1d0e)",border:"1px solid #2a4a2a",borderRadius:"20px",width:"100%",maxWidth:"540px",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 60px rgba(0,0,0,0.8)"}}>
        {plant.photo && <div style={{height:"220px",overflow:"hidden",borderRadius:"20px 20px 0 0"}}><img src={plant.photo} alt={plant.commonName} style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>}
        <div style={{padding:"24px"}}>
          <h2 style={{margin:"0 0 4px",color:"#d4e8c2",fontFamily:font.serif,fontSize:"26px"}}>{plant.commonName}</h2>
          <p style={{margin:"0 0 16px",color:"#7a9e6a",fontFamily:font.body,fontStyle:"italic",fontSize:"14px"}}>{plant.scientificName}</p>

          {pt && (
            <div style={{marginBottom:"16px"}}>
              <SectionLabel>Clasificación</SectionLabel>
              <TypeChip value={plant.plantType}/>
              <p style={{margin:"8px 0 0",color:"#a8a878",fontFamily:font.body,fontSize:"13px",lineHeight:1.6}}>{pt.desc}</p>
            </div>
          )}

          {(heightStr || plant.canopySize) && (
            <div style={{marginBottom:"16px"}}>
              <SectionLabel>Dimensiones</SectionLabel>
              <div style={{display:"flex",gap:"12px",flexWrap:"wrap"}}>
                {heightStr && (
                  <div style={{background:"#0e1d0e",border:"1px solid #2a4a2a",borderRadius:"10px",padding:"10px 16px",textAlign:"center"}}>
                    <p style={{margin:0,color:"#5a8a4a",fontFamily:font.body,fontSize:"10px",textTransform:"uppercase",letterSpacing:"0.08em"}}>Altura</p>
                    <p style={{margin:"4px 0 0",color:"#d4e8c2",fontFamily:font.serif,fontSize:"18px",fontWeight:600}}>{heightStr}</p>
                  </div>
                )}
                {plant.canopySize && (
                  <div style={{background:"#0e1d0e",border:"1px solid #2a4a2a",borderRadius:"10px",padding:"10px 16px",textAlign:"center"}}>
                    <p style={{margin:0,color:"#5a8a4a",fontFamily:font.body,fontSize:"10px",textTransform:"uppercase",letterSpacing:"0.08em"}}>Copa / Extensión</p>
                    <p style={{margin:"4px 0 0",color:"#d4e8c2",fontFamily:font.serif,fontSize:"18px",fontWeight:600}}>{plant.canopySize} m</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {(plant.light||plant.water||plant.soil) && (
            <div style={{marginBottom:"16px"}}>
              <SectionLabel>Cuidados</SectionLabel>
              <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
                {plant.light && <TealChip label={"☀️ "+plant.light}/>}
                {plant.water && <TealChip label={"💧 "+plant.water}/>}
                {plant.soil  && <TealChip label={"🪴 "+plant.soil}/>}
              </div>
            </div>
          )}

          {plant.rootType && (
            <div style={{marginBottom:"16px"}}>
              <SectionLabel>Tipo de raíz</SectionLabel>
              <BrownChip label={`${root?.emoji||""} ${plant.rootType}`}/>
              {root && <p style={{margin:"8px 0 0",color:"#a8a878",fontFamily:font.body,fontSize:"13px",lineHeight:1.6}}>{root.description}</p>}
            </div>
          )}

          {plant.gardenTags?.length>0 && (
            <div style={{marginBottom:"16px"}}>
              <SectionLabel>Tipo de jardín</SectionLabel>
              <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>{plant.gardenTags.map(t=><TagChip key={t} label={t} active/>)}</div>
            </div>
          )}

          {plant.notes && (
            <div style={{marginBottom:"20px"}}>
              <SectionLabel>Notas</SectionLabel>
              <p style={{color:"#a8c898",fontFamily:font.body,fontSize:"14px",lineHeight:1.7,margin:0}}>{plant.notes}</p>
            </div>
          )}

          <div style={{display:"flex",gap:"10px"}}>
            <button onClick={()=>onEdit(plant)} style={{flex:1,padding:"10px",background:"#2d5a27",color:"#a8d5a2",border:"none",borderRadius:"10px",fontFamily:font.body,fontSize:"14px",cursor:"pointer"}}>✏️ Editar</button>
            <button onClick={()=>onDelete(plant.id)} style={{padding:"10px 16px",background:"#3a1a1a",color:"#c47a7a",border:"none",borderRadius:"10px",fontFamily:font.body,fontSize:"14px",cursor:"pointer"}}>🗑</button>
            <button onClick={onClose} style={{padding:"10px 16px",background:"#1a2a1a",color:"#7a9e6a",border:"1px solid #2a4a2a",borderRadius:"10px",fontFamily:font.body,fontSize:"14px",cursor:"pointer"}}>Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Plant Form ────────────────────────────────────────
function PlantForm({ initial, allTags, onSave, onCancel }) {
  const [form, setForm] = useState(initial || emptyForm);
  const [preview, setPreview] = useState(initial?.photo||"");
  const fileRef = useRef();
  const set = (f,v) => setForm(p=>({...p,[f]:v}));
  const toggleTag = tag => setForm(p=>({...p,gardenTags:p.gardenTags.includes(tag)?p.gardenTags.filter(t=>t!==tag):[...p.gardenTags,tag]}));
  const handlePhoto = e => {
    const file=e.target.files[0]; if(!file) return;
    const r=new FileReader(); r.onload=ev=>{setPreview(ev.target.result);set("photo",ev.target.result);}; r.readAsDataURL(file);
  };
  const inp={width:"100%",padding:"10px 12px",background:"#0e1d0e",border:"1px solid #2a4a2a",borderRadius:"8px",color:"#c8e0b8",fontFamily:font.body,fontSize:"14px",boxSizing:"border-box",outline:"none"};
  const lbl={display:"block",color:"#5a8a4a",fontFamily:font.body,fontSize:"11px",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:"6px"};

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",backdropFilter:"blur(4px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
      <div style={{background:"linear-gradient(160deg,#1a2e1a,#0e1d0e)",border:"1px solid #2a4a2a",borderRadius:"20px",width:"100%",maxWidth:"580px",maxHeight:"92vh",overflowY:"auto",boxShadow:"0 24px 60px rgba(0,0,0,0.8)",padding:"28px"}}>
        <h2 style={{color:"#d4e8c2",fontFamily:font.serif,fontSize:"22px",margin:"0 0 24px"}}>{initial?"Editar planta":"Nueva ficha de planta"}</h2>

        {/* Photo */}
        <div style={{marginBottom:"20px"}}>
          <div onClick={()=>fileRef.current.click()} style={{height:"120px",borderRadius:"12px",border:"2px dashed #2a4a2a",background:"#0e1d0e",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",overflow:"hidden"}}>
            {preview ? <img src={preview} style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <div style={{textAlign:"center"}}><div style={{fontSize:"28px",opacity:0.4}}>📷</div><p style={{color:"#5a8a4a",fontFamily:font.body,fontSize:"12px",margin:"4px 0 0"}}>Toca para agregar foto</p></div>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{display:"none"}}/>
        </div>

        {/* Names */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px",marginBottom:"14px"}}>
          <div><label style={lbl}>Nombre común</label><input style={inp} value={form.commonName} onChange={e=>set("commonName",e.target.value)} placeholder="Ej: Helecho"/></div>
          <div><label style={lbl}>Nombre científico</label><input style={inp} value={form.scientificName} onChange={e=>set("scientificName",e.target.value)} placeholder="Ej: Nephrolepis"/></div>
        </div>

        {/* Plant type */}
        <div style={{marginBottom:"16px"}}>
          <label style={lbl}>Clasificación de la planta</label>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"8px"}}>
            {PLANT_TYPES.map(pt=>(
              <div key={pt.value} onClick={()=>set("plantType",form.plantType===pt.value?"":pt.value)} style={{
                padding:"10px 8px",borderRadius:"10px",textAlign:"center",cursor:"pointer",transition:"all 0.15s",
                background:form.plantType===pt.value?"#1e2a40":"#0e1d0e",
                border:form.plantType===pt.value?"1px solid #4a7ab0":"1px solid #2a4a2a",
              }}>
                <div style={{fontSize:"22px"}}>{pt.emoji}</div>
                <p style={{margin:"4px 0 0",color:form.plantType===pt.value?"#90b8e0":"#5a8a4a",fontFamily:font.body,fontSize:"11px"}}>{pt.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Dimensions */}
        <div style={{marginBottom:"14px"}}>
          <label style={lbl}>Dimensiones</label>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px"}}>
            <div>
              <p style={{...lbl,marginBottom:"4px"}}>Altura mín. (m)</p>
              <input style={inp} type="number" min="0" step="0.1" value={form.heightMin} onChange={e=>set("heightMin",e.target.value)} placeholder="0.5"/>
            </div>
            <div>
              <p style={{...lbl,marginBottom:"4px"}}>Altura máx. (m)</p>
              <input style={inp} type="number" min="0" step="0.1" value={form.heightMax} onChange={e=>set("heightMax",e.target.value)} placeholder="2"/>
            </div>
            <div>
              <p style={{...lbl,marginBottom:"4px"}}>Copa / ext. (m)</p>
              <input style={inp} type="number" min="0" step="0.1" value={form.canopySize} onChange={e=>set("canopySize",e.target.value)} placeholder="1.5"/>
            </div>
          </div>
        </div>

        {/* Care */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"12px",marginBottom:"14px"}}>
          {[["Luz","light",LIGHT_OPTIONS],["Riego","water",WATER_OPTIONS],["Tierra","soil",SOIL_OPTIONS]].map(([l,f,opts])=>(
            <div key={f}><label style={lbl}>{l}</label>
              <select style={{...inp,appearance:"none"}} value={form[f]} onChange={e=>set(f,e.target.value)}>
                <option value="">—</option>{opts.map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>

        {/* Root */}
        <div style={{marginBottom:"14px"}}>
          <label style={lbl}>Tipo de raíz</label>
          <select style={{...inp,appearance:"none"}} value={form.rootType} onChange={e=>set("rootType",e.target.value)}>
            <option value="">—</option>{ROOT_OPTIONS.map(o=><option key={o}>{o}</option>)}
          </select>
        </div>

        {/* Tags */}
        <div style={{marginBottom:"18px"}}>
          <label style={lbl}>Etiquetas de jardín</label>
          <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
            {allTags.map(tag=><TagChip key={tag} label={tag} active={form.gardenTags.includes(tag)} onClick={()=>toggleTag(tag)}/>)}
          </div>
        </div>

        {/* Notes */}
        <div style={{marginBottom:"24px"}}>
          <label style={lbl}>Notas personales</label>
          <textarea style={{...inp,minHeight:"80px",resize:"vertical"}} value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Observaciones, dónde la conseguiste, recuerdos..."/>
        </div>

        <div style={{display:"flex",gap:"10px"}}>
          <button onClick={()=>onSave(form)} style={{flex:1,padding:"12px",background:"linear-gradient(135deg,#2d5a27,#3a7a30)",color:"#d4e8c2",border:"none",borderRadius:"10px",fontFamily:font.serif,fontSize:"15px",cursor:"pointer"}}>{initial?"Guardar cambios":"Agregar planta"}</button>
          <button onClick={onCancel} style={{padding:"12px 18px",background:"#1a2a1a",color:"#7a9e6a",border:"1px solid #2a4a2a",borderRadius:"10px",fontFamily:font.body,fontSize:"14px",cursor:"pointer"}}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ── Glossary Panel ────────────────────────────────────
function GlossaryPanel({ onClose }) {
  const [selected, setSelected] = useState(null);
  const root = ROOT_GLOSSARY.find(r=>r.name===selected);
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",backdropFilter:"blur(6px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"linear-gradient(160deg,#111e11,#0a130a)",border:"1px solid #2a4a2a",borderRadius:"20px",width:"100%",maxWidth:"660px",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 60px rgba(0,0,0,0.9)",padding:"28px"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:"6px"}}>
          <div>
            <p style={{color:"#4a7a3a",fontFamily:font.body,fontSize:"11px",textTransform:"uppercase",letterSpacing:"0.2em",margin:0}}>Referencia botánica</p>
            <h2 style={{color:"#d4e8c2",fontFamily:font.serif,fontSize:"24px",margin:"4px 0 0"}}>Tipos de Raíz 🌱</h2>
          </div>
          <button onClick={onClose} style={{background:"#1a2a1a",border:"1px solid #2a4a2a",color:"#7a9e6a",borderRadius:"10px",padding:"8px 14px",fontFamily:font.body,cursor:"pointer",fontSize:"13px"}}>Cerrar</button>
        </div>
        <p style={{color:"#5a8a4a",fontFamily:font.body,fontSize:"13px",marginBottom:"24px"}}>Selecciona un tipo para leer su descripción completa.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:"10px",marginBottom:"24px"}}>
          {ROOT_GLOSSARY.map(r=>(
            <div key={r.name} onClick={()=>setSelected(selected===r.name?null:r.name)} style={{background:selected===r.name?`${r.color}55`:"#0e1d0e",border:`1px solid ${selected===r.name?r.color:"#2a4a2a"}`,borderRadius:"12px",padding:"14px",cursor:"pointer",transition:"all 0.2s"}}>
              <span style={{fontSize:"24px"}}>{r.emoji}</span>
              <p style={{margin:"6px 0 0",color:"#d4e8c2",fontFamily:font.serif,fontSize:"15px",fontWeight:600}}>{r.name}</p>
              <p style={{margin:"4px 0 0",color:"#5a8a4a",fontFamily:font.body,fontSize:"11px"}}>Ej: {r.examples.split(",")[0].trim()}</p>
            </div>
          ))}
        </div>
        {root && (
          <div style={{background:`${root.color}33`,border:`1px solid ${root.color}`,borderRadius:"14px",padding:"20px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"12px"}}>
              <span style={{fontSize:"34px"}}>{root.emoji}</span>
              <h3 style={{margin:0,color:"#d4e8c2",fontFamily:font.serif,fontSize:"20px"}}>Raíz {root.name}</h3>
            </div>
            <p style={{color:"#c8e0b8",fontFamily:font.body,fontSize:"14px",lineHeight:1.8,margin:"0 0 14px"}}>{root.description}</p>
            <div style={{borderTop:"1px solid rgba(255,255,255,0.08)",paddingTop:"12px"}}>
              <p style={{color:"#5a8a4a",fontFamily:font.body,fontSize:"11px",textTransform:"uppercase",letterSpacing:"0.1em",margin:"0 0 6px"}}>Ejemplos</p>
              <p style={{color:"#a8c898",fontFamily:font.body,fontSize:"13px",fontStyle:"italic",margin:0}}>{root.examples}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Manage Tags Panel ─────────────────────────────────
function ManageTagsPanel({ tags, onSave, onClose }) {
  const [local, setLocal] = useState([...tags]);
  const [newTag, setNewTag] = useState("");
  const add = () => { const t=newTag.trim(); if(t&&!local.includes(t)) setLocal(p=>[...p,t]); setNewTag(""); };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",backdropFilter:"blur(4px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"linear-gradient(160deg,#1a2e1a,#0e1d0e)",border:"1px solid #2a4a2a",borderRadius:"20px",width:"100%",maxWidth:"480px",boxShadow:"0 24px 60px rgba(0,0,0,0.9)",padding:"28px"}}>
        <p style={{color:"#4a7a3a",fontFamily:font.body,fontSize:"11px",textTransform:"uppercase",letterSpacing:"0.2em",margin:"0 0 4px"}}>Personalizar</p>
        <h2 style={{color:"#d4e8c2",fontFamily:font.serif,fontSize:"22px",margin:"0 0 20px"}}>Gestionar etiquetas 🏷️</h2>
        <div style={{display:"flex",gap:"8px",marginBottom:"20px"}}>
          <input value={newTag} onChange={e=>setNewTag(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder="Escribe una nueva etiqueta..."
            style={{flex:1,padding:"10px 12px",background:"#0e1d0e",border:"1px solid #2a4a2a",borderRadius:"8px",color:"#c8e0b8",fontFamily:font.body,fontSize:"14px",outline:"none"}}/>
          <button onClick={add} style={{padding:"10px 18px",background:"#2d5a27",color:"#a8d5a2",border:"none",borderRadius:"8px",fontFamily:font.body,fontSize:"14px",cursor:"pointer"}}>+ Agregar</button>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:"8px",minHeight:"60px",marginBottom:"16px"}}>
          {local.length===0 ? <p style={{color:"#3a5a3a",fontFamily:font.body,fontSize:"13px"}}>No hay etiquetas aún.</p>
            : local.map(tag=><TagChip key={tag} label={tag} active onDelete={()=>setLocal(p=>p.filter(t=>t!==tag))}/>)}
        </div>
        <p style={{color:"#4a6a3a",fontFamily:font.body,fontSize:"12px",margin:"0 0 20px"}}>⚠️ Eliminar una etiqueta no la quita de las fichas ya guardadas.</p>
        <div style={{display:"flex",gap:"10px"}}>
          <button onClick={()=>onSave(local)} style={{flex:1,padding:"12px",background:"linear-gradient(135deg,#2d5a27,#3a7a30)",color:"#d4e8c2",border:"none",borderRadius:"10px",fontFamily:font.serif,fontSize:"15px",cursor:"pointer"}}>Guardar cambios</button>
          <button onClick={onClose} style={{padding:"12px 18px",background:"#1a2a1a",color:"#7a9e6a",border:"1px solid #2a4a2a",borderRadius:"10px",fontFamily:font.body,fontSize:"14px",cursor:"pointer"}}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────
export default function App() {
  const [plants, setPlants] = useState([]);
  const [customTags, setCustomTags] = useState(DEFAULT_TAGS);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState(null);
  const [activePlantType, setActivePlantType] = useState(null);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPlant, setEditingPlant] = useState(null);
  const [showGlossary, setShowGlossary] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const p = await window.storage.get(STORAGE_KEY);
        if (p?.value) setPlants(JSON.parse(p.value));
        const t = await window.storage.get(TAGS_KEY);
        if (t?.value) setCustomTags(JSON.parse(t.value));
      } catch {}
    })();
  }, []);

  const persistPlants = async next => { try { await window.storage.set(STORAGE_KEY,JSON.stringify(next)); } catch {} setPlants(next); };
  const persistTags   = async next => { try { await window.storage.set(TAGS_KEY,JSON.stringify(next));   } catch {} setCustomTags(next); setShowTagManager(false); };

  const handleSave = form => {
    if (editingPlant) persistPlants(plants.map(p=>p.id===editingPlant.id?{...form,id:editingPlant.id}:p));
    else persistPlants([...plants,{...form,id:Date.now().toString()}]);
    setShowForm(false); setEditingPlant(null);
  };
  const handleDelete = id => { persistPlants(plants.filter(p=>p.id!==id)); setSelectedPlant(null); };
  const handleEdit   = plant => { setEditingPlant(plant); setSelectedPlant(null); setShowForm(true); };

  const usedTags = [...new Set(plants.flatMap(p=>p.gardenTags||[]))];
  const usedTypes = [...new Set(plants.map(p=>p.plantType).filter(Boolean))];

  const filtered = plants.filter(p => {
    const ms = !search || p.commonName?.toLowerCase().includes(search.toLowerCase()) || p.scientificName?.toLowerCase().includes(search.toLowerCase());
    const mt = !activeTag || p.gardenTags?.includes(activeTag);
    const mp = !activePlantType || p.plantType === activePlantType;
    return ms && mt && mp;
  });

  const btnSec = {padding:"9px 16px",background:"#1a2a1a",color:"#7a9e6a",border:"1px solid #2a4a2a",borderRadius:"10px",fontFamily:font.body,fontSize:"13px",cursor:"pointer",whiteSpace:"nowrap"};

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Lora:ital,wght@0,400;0,500;1,400&display=swap');*{box-sizing:border-box}body{margin:0}::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:#0a150a}::-webkit-scrollbar-thumb{background:#2a4a2a;border-radius:3px}`}</style>
      <div style={{minHeight:"100vh",background:"radial-gradient(ellipse at top left,#0f2010 0%,#080f08 50%,#050a05 100%)",color:"#c8e0b8"}}>

        {/* Header */}
        <div style={{padding:"28px 24px 0",borderBottom:"1px solid #1a2e1a",background:"linear-gradient(180deg,#0d1f0d 0%,transparent 100%)"}}>
          <div style={{maxWidth:"1100px",margin:"0 auto"}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"12px",marginBottom:"20px",flexWrap:"wrap"}}>
              <div>
                <p style={{color:"#4a7a3a",fontFamily:font.body,fontSize:"12px",textTransform:"uppercase",letterSpacing:"0.2em",margin:"0 0 4px"}}>Mi colección</p>
                <h1 style={{margin:0,fontFamily:font.serif,fontSize:"clamp(26px,5vw,40px)",fontWeight:700,color:"#d4e8c2",lineHeight:1}}>Catálogo de Plantas 🌿</h1>
                <p style={{margin:"6px 0 0",color:"#5a8a4a",fontFamily:font.body,fontSize:"14px"}}>{plants.length} {plants.length===1?"planta registrada":"plantas registradas"}</p>
              </div>
              <div style={{display:"flex",gap:"8px",flexWrap:"wrap",alignItems:"center"}}>
                <button onClick={()=>setShowGlossary(true)} style={btnSec}>📖 Tipos de raíz</button>
                <button onClick={()=>setShowTagManager(true)} style={btnSec}>🏷️ Mis etiquetas</button>
                <button onClick={()=>{setEditingPlant(null);setShowForm(true);}} style={{padding:"10px 20px",background:"linear-gradient(135deg,#2d5a27,#3a7a30)",color:"#d4e8c2",border:"none",borderRadius:"10px",fontFamily:font.serif,fontSize:"15px",cursor:"pointer",boxShadow:"0 4px 16px rgba(60,120,50,0.3)",whiteSpace:"nowrap"}}>+ Nueva planta</button>
              </div>
            </div>

            {/* Search */}
            <div style={{position:"relative",maxWidth:"400px",marginBottom:"14px"}}>
              <span style={{position:"absolute",left:"14px",top:"50%",transform:"translateY(-50%)",color:"#4a7a3a"}}>🔍</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nombre..."
                style={{width:"100%",padding:"10px 14px 10px 40px",background:"#0e1d0e",border:"1px solid #2a4a2a",borderRadius:"10px",color:"#c8e0b8",fontFamily:font.body,fontSize:"14px",outline:"none"}}/>
            </div>

            {/* Plant type filter */}
            {usedTypes.length > 0 && (
              <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"10px"}}>
                <span onClick={()=>setActivePlantType(null)} style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"4px 14px",borderRadius:"999px",fontSize:"12px",fontFamily:font.body,cursor:"pointer",background:!activePlantType?"#1e2a40":"#0e1d0e",color:!activePlantType?"#90b8e0":"#5a7a8a",border:!activePlantType?"1px solid #4a7ab0":"1px solid #2a3a4a",userSelect:"none"}}>Todos los tipos</span>
                {PLANT_TYPES.filter(pt=>usedTypes.includes(pt.value)).map(pt=>(
                  <span key={pt.value} onClick={()=>setActivePlantType(activePlantType===pt.value?null:pt.value)} style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"4px 14px",borderRadius:"999px",fontSize:"12px",fontFamily:font.body,cursor:"pointer",background:activePlantType===pt.value?"#1e2a40":"#0e1d0e",color:activePlantType===pt.value?"#90b8e0":"#5a7a8a",border:activePlantType===pt.value?"1px solid #4a7ab0":"1px solid #2a3a4a",userSelect:"none"}}>
                    {pt.emoji} {pt.label}
                  </span>
                ))}
              </div>
            )}

            {/* Tag filter */}
            {usedTags.length > 0 && (
              <div style={{display:"flex",gap:"6px",flexWrap:"wrap",paddingBottom:"18px"}}>
                <TagChip label="Todas" active={!activeTag} onClick={()=>setActiveTag(null)}/>
                {usedTags.map(tag=><TagChip key={tag} label={tag} active={activeTag===tag} onClick={()=>setActiveTag(activeTag===tag?null:tag)}/>)}
              </div>
            )}
          </div>
        </div>

        {/* Gallery */}
        <div style={{maxWidth:"1100px",margin:"0 auto",padding:"28px 24px"}}>
          {filtered.length===0 ? (
            <div style={{textAlign:"center",padding:"80px 20px"}}>
              <div style={{fontSize:"60px",opacity:0.25,marginBottom:"16px"}}>🌱</div>
              <p style={{color:"#4a7a3a",fontFamily:font.serif,fontSize:"20px"}}>{plants.length===0?"Tu catálogo está vacío":"No se encontraron plantas"}</p>
              <p style={{color:"#3a5a3a",fontFamily:font.body,fontSize:"14px"}}>{plants.length===0?"Agrega tu primera planta para comenzar":"Intenta con otro nombre o filtro"}</p>
            </div>
          ) : (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:"16px"}}>
              {filtered.map(plant=><PlantCard key={plant.id} plant={plant} onClick={setSelectedPlant}/>)}
            </div>
          )}
        </div>
      </div>

      {selectedPlant && <DetailModal plant={selectedPlant} onClose={()=>setSelectedPlant(null)} onEdit={handleEdit} onDelete={handleDelete}/>}
      {showForm      && <PlantForm initial={editingPlant} allTags={customTags} onSave={handleSave} onCancel={()=>{setShowForm(false);setEditingPlant(null);}}/>}
      {showGlossary  && <GlossaryPanel onClose={()=>setShowGlossary(false)}/>}
      {showTagManager && <ManageTagsPanel tags={customTags} onSave={persistTags} onClose={()=>setShowTagManager(false)}/>}
    </>
  );
}
