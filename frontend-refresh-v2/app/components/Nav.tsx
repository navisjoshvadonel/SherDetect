"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Nav(){
 const path=usePathname();
 const items=[["/","Overview"],["/submit","New audit"],["/documents","Documents"],["/review","Review queue"],["/results","Results"],["/audit","Audit trail"]];
 return <><header><Link href="/" className="logo"><b>S</b>SherDetect</Link><nav>{items.map(([href,label])=><Link className={path===href?"current":""} href={href} key={href}>{label}</Link>)}</nav><div className="online"><i/> Online</div></header><style jsx global>{`
.logo b{background:#20211f;box-shadow:4px 4px 0 #e9bd35}.nav-links a.current,nav a.current{background:#fff4c9}.button.primary{position:relative;overflow:hidden;background:#20211f;box-shadow:5px 5px 0 #e9bd35}.button.primary:after{content:'';position:absolute;inset:-20% auto -20% -35%;width:24%;background:#f7dc76aa;transform:skewX(-20deg);animation:yellow-sweep 3.5s ease-in-out infinite}.metric:first-child strong{color:#bd8d14}.section .eyebrow{color:#bd8d14}.empty{padding:45px;text-align:center}.empty p{margin:9px 0 20px}.tabs{display:flex;gap:8px;margin-bottom:22px}.tabs button{border:1px solid var(--line);border-radius:99px;padding:10px 15px;background:var(--card);color:var(--muted);cursor:pointer;font-size:12px}.tabs button b{margin-left:6px}.tabs button.selected{color:#20211f;background:#f3cf67;border-color:#d1aa39}@keyframes yellow-sweep{0%,65%{left:-35%}100%{left:125%}}
`}</style></>;
}
