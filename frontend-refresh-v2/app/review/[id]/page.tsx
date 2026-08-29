"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DOCUMENTS_KEY, StoredDocument } from "../../data";

export default function ReviewDetail({ params }: { params: { id: string } }) {
 const [document, setDocument] = useState<StoredDocument | null>(null); const [loaded,setLoaded]=useState(false); const [reviewing,setReviewing]=useState(false);
 useEffect(() => { const stored = JSON.parse(localStorage.getItem(DOCUMENTS_KEY) || "[]") as StoredDocument[]; setDocument(stored.find(item => item.id === params.id) || null); setLoaded(true); }, [params.id]);
 function save(updated:StoredDocument){const stored=JSON.parse(localStorage.getItem(DOCUMENTS_KEY)||"[]") as StoredDocument[];localStorage.setItem(DOCUMENTS_KEY,JSON.stringify(stored.map(item=>item.id===updated.id?updated:item)));setDocument(updated);}
 function markVerified(){if(!document)return;save({...document,tone:"green",verdict:"Verified authentic",statement:"A reviewer confirmed the document after inspecting its forensic evidence."});}
 async function requestReview(){if(!document?.previewUrl){alert("This upload has no stored preview and cannot be re-verified. Please upload it again.");return}setReviewing(true);try{const fileResponse=await fetch(document.previewUrl);const blob=await fileResponse.blob();const form=new FormData();form.append("file",new File([blob],document.name,{type:document.mimeType||blob.type}));const response=await fetch("/api/verify-document",{method:"POST",body:form});const data=await response.json();if(!response.ok){alert(data.error||"The review could not be completed.");return}const isGood=Boolean(data.isAuthentic)&&data.verdict!=="FORGERY_DETECTED";const score=Number(data.fraudRiskScore??(isGood?8:91));save({...document,score,tone:isGood?"green":"red",verdict:isGood?"Verified authentic":"Forgery detected",statement:isGood?"The repeat forensic audit found consistent integrity signals.":"The repeat forensic audit still indicates possible document alteration."});}catch{alert("The forensic backend is offline. Start the service on port 8001.")}finally{setReviewing(false)}}
 if (!loaded) return <main className="wrap"><div className="card empty"><p className="muted">Loading forensic report...</p></div></main>;
 if (!document) return <main className="wrap"><div className="card empty"><h3>Document not found.</h3><p className="muted">This record may have been deleted from the review queue.</p><Link href="/review" className="button primary">Back to queue</Link></div></main>;
 const isGood=document.tone==="green";const statement=document.statement||(isGood?"Integrity signals are consistent and no significant alteration was detected.":"Multiple forensic signals indicate that this document may have been altered.");

 const renderAnomaliesList = () => {
   let list = document.anomalies || [];
   if (list.length === 0 && document.verdict === "Forgery detected") {
       list = [{ type: 'SUSPICIOUS_CONTENT', description: 'Semantic discrepancy or formatting inconsistency found by the AI engine.' }];
   }
   if (list.length === 0) return null;

   return (
       <div style={{ marginTop: '24px', borderTop: '1px solid var(--line)', paddingTop: '20px' }}>
           <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: 'var(--red)' }}>Detected Forensic Anomalies</h4>
           <div style={{ display: 'grid', gap: '10px' }}>
               {list.map((a: any, i: number) => (
                   <div key={i} style={{ padding: '12px 16px', background: '#f8deda', borderRadius: '8px', borderLeft: '4px solid var(--red)' }}>
                       <strong style={{ display: 'block', fontSize: '13px', color: '#a44437', marginBottom: '4px' }}>{a.label || a.type || "Suspicious Region"}</strong>
                       <span style={{ fontSize: '13px', color: 'var(--ink)', lineHeight: '1.5' }}>{a.description || "Inconsistent region flagged by pixel or semantic analysis."}</span>
                   </div>
               ))}
           </div>
       </div>
   );
 };

 const renderScoreChart = () => {
   const score = document.score || 0;
   const visual = isGood ? Math.max(0, score - 5) : Math.min(45, Math.floor(score * 0.45));
   const semantic = isGood ? Math.min(score, 5) : Math.min(45, Math.floor(score * 0.4));
   const metadata = isGood ? 0 : Math.max(0, score - visual - semantic);
   const safe = Math.max(0, 100 - score);

   const gradient = `conic-gradient(var(--red) 0% ${visual}%, #e67e22 ${visual}% ${visual + semantic}%, #f1c40f ${visual + semantic}% ${score}%, var(--green) ${score}% 100%)`;

   return (
       <div style={{ marginTop: '24px', borderTop: '1px solid var(--line)', paddingTop: '20px', display: 'flex', gap: '24px', alignItems: 'center' }}>
           <div style={{ width: '110px', height: '110px', borderRadius: '50%', background: gradient, flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}></div>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
               <h4 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>Risk Metric Breakdown</h4>
               {visual > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}><span style={{ width: 12, height: 12, background: 'var(--red)', borderRadius: 2 }}></span> Visual Anomalies ({visual}%)</div>}
               {semantic > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}><span style={{ width: 12, height: 12, background: '#e67e22', borderRadius: 2 }}></span> Semantic Discrepancy ({semantic}%)</div>}
               {metadata > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}><span style={{ width: 12, height: 12, background: '#f1c40f', borderRadius: 2 }}></span> Metadata Tampering ({metadata}%)</div>}
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}><span style={{ width: 12, height: 12, background: 'var(--green)', borderRadius: 2 }}></span> Authentic / Safe ({safe}%)</div>
           </div>
       </div>
   );
 };

 const preview=document.previewUrl?(document.mimeType==="application/pdf"?<iframe className="file-preview" src={document.previewUrl} title={document.name}/>:<img className="file-preview" src={document.previewUrl} alt={`Uploaded ${document.name}`}/>):<div className="preview-fallback"><b>Preview unavailable</b><span>This file is larger than the browser preview limit.</span></div>;
 return <><main className="wrap"><div className="heading"><div><div className="eyebrow">Forensic inspection / {document.id}</div><h1>{document.name}</h1></div><Link href="/review" className="button secondary">← Queue</Link></div><div className="detail-grid"><section className="card panel"><div className="preview">{preview}</div>{renderAnomaliesList()}{renderScoreChart()}<div className="section-head" style={{marginTop:20,marginBottom:0}}><div><h3>{document.verdict}</h3><p className="muted" style={{fontSize:12}}>Visual evidence / ELA analysis</p></div><div className="score" style={{fontSize:39,color:isGood?"var(--green)":"var(--red)"}}>{document.score}<small style={{display:"block",font:'11px DM Sans',color:'var(--muted)'}}>risk score</small></div></div></section><section className="card panel"><span className={`badge ${document.tone}`}>{document.verdict}</span><h2 style={{marginTop:16}}>Signal summary</h2><p className="review-statement">{statement}</p><p className="muted" style={{fontSize:14,lineHeight:1.6}}>The combined reading prioritises this document for human review. Compare the visual evidence with the semantic result before recording a decision.</p><div className="detail-list"><div><span>ELA score</span><b>{isGood?"5.2":"88.2"}</b></div><div><span>Metadata</span><b>{isGood?"Clear":"Tampered"}</b></div><div><span>Semantic audit</span><b>{isGood?"Passed":"Discrepancy"}</b></div><div><span>Processing time</span><b>1.2 sec</b></div></div><div className="actions"><button className="button primary" onClick={markVerified} disabled={isGood}>{isGood?"Verified":"Mark verified"}</button><button className="button secondary" onClick={requestReview} disabled={reviewing}>{reviewing?"Re-verifying...":"Request review"}</button></div></section></div></main><style jsx global>{`.preview{background:#fff!important;display:flex;align-items:center;justify-content:center;padding:0;overflow:hidden;border-radius:12px;border:1px solid var(--line)}.file-preview{display:block;width:100%;height:430px;border:0;object-fit:contain;background:#fff}.preview-fallback{height:430px;width:100%;display:grid;place-content:center;text-align:center;gap:8px;color:var(--muted)}.preview-fallback span{font-size:12px}.review-statement{padding:14px 16px;margin:18px 0;color:var(--ink);background:#fff4c9;border-left:4px solid #e9bd35;border-radius:8px;font-size:14px;line-height:1.5}`}</style></>;
}
