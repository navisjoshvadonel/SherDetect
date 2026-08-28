import Link from "next/link";
import { documents } from "./data";

export default function Home() {
  return <>
    <section className="hero">
      <div className="hero-copy"><div className="eyebrow">Document integrity, made clear</div><h1>See what changed before it becomes a problem.</h1><p className="lead">SherDetect brings pixel forensics, metadata signals and semantic review into one calm workspace for confident decisions.</p><div className="actions"><Link className="button primary" href="/submit">Start an audit <span>↗</span></Link><Link className="button secondary" href="/review">Open review queue</Link></div></div>
      <div className="hero-art"><div className="hero-image" /><div className="art-card score-card"><div className="muted" style={{fontSize:11}}>Latest risk reading</div><div className="score">91%</div><div className="score-bar"><span /></div><div className="muted" style={{fontSize:11,marginTop:8}}>Forgery detected</div></div><div className="art-card scan-card"><div className="scan-orb" /><div><strong style={{fontSize:13}}>Forensics active</strong><div className="muted" style={{fontSize:11}}>6 signals checked</div></div></div></div>
    </section>
    <section className="section"><div className="section-head"><div><div className="eyebrow">Workspace pulse</div><h2>A quieter way to investigate.</h2></div><p>Live snapshot / 28 Aug 2026</p></div><div className="metric-grid"><div className="metric"><span className="eyebrow">Documents reviewed</span><strong>248</strong><small>Across six verification domains</small></div><div className="metric"><span className="eyebrow">Needs attention</span><strong>07</strong><small>Prioritised by combined risk</small></div><div className="metric"><span className="eyebrow">Average turnaround</span><strong>1.8s</strong><small>From upload to forensic report</small></div></div></section>
    <section className="section"><div className="section-head"><div><div className="eyebrow">Recent activity</div><h2>Keep the signal close.</h2></div><Link className="button secondary" href="/documents">View all documents</Link></div><div className="soft-panel table-panel">{documents.slice(0,3).map(doc=><div className="table-row" key={doc.id}><div><span className="doc-name">{doc.name}</span><span className="doc-id">{doc.id} · {doc.domain}</span></div><span>{doc.type}</span><span>{doc.date}</span><span className={`badge ${doc.tone}`}>{doc.verdict}</span></div>)}</div></section>
  </>;
}
