
import {T} from "@/components/locale-provider";
import SetupPanel from "../../../components/dashboard/setup-panel";
export default function Page(){return <><span className="eyebrow">Workspace / Setup</span><h1><T text={"Repository, lalu koneksi."}/></h1><p><T text={"Gunakan template KzRDP di akunmu, sambungkan secrets, dan periksa kesiapan workflow."}/></p><SetupPanel expanded/></>}
