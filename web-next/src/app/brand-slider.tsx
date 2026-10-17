import Image from "next/image";
import {BRAND} from "@/lib/brand";
const brands=[{name:"GitHub Actions",icon:"actions"},{name:"GitHub",icon:"github"},{name:"Runner",icon:"runner"},{name:"Tailscale"},{name:"XyDesk Remote"},{name:BRAND.developer}] as {name:string;icon?:string}[];
export default function BrandSlider(){return <section className="brand-section" aria-label={`Teknologi ${BRAND.name}`}><div className="brand-window"><div className="brand-track">{[0,1].map(copy=><div className="brand-group" key={copy} aria-hidden={copy===1?true:undefined}>{brands.map(brand=><div className="brand-tile" key={brand.name}>{brand.icon&&<Image src={'/brands/'+brand.icon+'.svg'} alt="" width={30} height={30} loading="eager" unoptimized/>}<strong>{brand.name}</strong></div>)}</div>)}</div></div></section>}
