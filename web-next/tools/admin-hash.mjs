// Pembuat / pemeriksa ADMIN_PASSWORD_HASH. Tanpa dependensi, jalan di Windows/macOS/Linux/Termux.
//   node tools/admin-hash.mjs            -> tanya password, cetak hash
//   node tools/admin-hash.mjs --check    -> tanya hash + password, cek apakah cocok
import {createInterface} from "node:readline/promises";
import {pbkdf2Sync,randomBytes,timingSafeEqual} from "node:crypto";
const rl=createInterface({input:process.stdin,output:process.stdout});
const derive=(password,salt)=>pbkdf2Sync(password,salt,100000,32,"sha256");
if(process.argv.includes("--check")){
  const hash=(await rl.question("Tempel ADMIN_PASSWORD_HASH: ")).trim();
  const password=await rl.question("Ketik password admin: ");
  const [salt,expected]=hash.split(":");
  if(!salt||!expected||!/^[0-9a-f]{64}$/i.test(expected)){console.log("\nFORMAT SALAH: hash harus berbentuk salt:64-karakter-hex tanpa spasi/kutip.");process.exit(1)}
  const ok=timingSafeEqual(derive(password,salt),Buffer.from(expected,"hex"));
  console.log(ok?"\nCOCOK: hash ini benar untuk password tersebut.":"\nTIDAK COCOK: password salah, atau hash dibuat dari teks lain (mis. ikut tanda kutip).");
  process.exit(ok?0:1);
}
const password=await rl.question("Karang password admin (password aslinya, bukan hash): ");
if(password.length<12){console.log("\nTerlalu pendek: minimal 12 karakter.");process.exit(1)}
const salt=randomBytes(16).toString("hex");
console.log("\nTempel baris di bawah ini sebagai ADMIN_PASSWORD_HASH:\n\n"+salt+":"+derive(password,salt).toString("hex")+"\n");
rl.close();
