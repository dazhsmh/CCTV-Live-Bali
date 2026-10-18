// Data kamera seluruh Bali.
// Tiap kabupaten: id, nama, koordinat cuaca, sumber, cara membentuk URL, dan daftar kamera.
// Baris kamera: [nama, detail lokasi, kunci stream, (opsional) URL penuh].
// Halaman kabupaten menetapkan window.REGION_ID sebelum file ini dimuat; halaman lain (beranda, auto) memuat semua kamera.

const BASE="https://atcs.denpasarkota.go.id/stream/";
const INDEX_IDS=new Set(["A055","A103","A106","A115","A116","A117","A119"]); // kamera Denpasar yang memakai index.m3u8 (selain itu stream.m3u8)
const TC="https://transcode.baliprov.go.id/cctv/";
const SHI="https://shinobi.bulelengkab.go.id/Amk60KFacq87lQMvTCMHu17u00ONuC/mp4/admin/";
const BSD=["Bali Satu Data","https://balisatudata.baliprov.go.id/"];
const tc=k=>TC+k+"/video1_stream.m3u8";
// Dipakai hanya bila hls.js dan pemutar bawaan browser gagal (server tanpa CORS). Kosongkan untuk menonaktifkan.
const PROXY="";

const regT=(n,kota)=>({
  id:{title:"CCTV Live "+n,subtitle:"Pantauan CCTV "+(kota?"Kota ":"Kabupaten ")+n},
  en:{title:n+" Live CCTV",subtitle:n+(kota?" City":" Regency")+" live CCTV view"}
});
const catOf=n=>{
  n=n.toLowerCase();
  if(/^(jl|jalan)\b/.test(n))return"Jalan";
  if(/^(simpang|pertigaan|perempatan|persimpangan)\b|catus pata/.test(n))return"Simpang";
  if(/pantai/.test(n))return"Pantai";
  if(/\bpura\b|besakih/.test(n))return"Pura";
  if(/\bpasar\b/.test(n))return"Pasar";
  if(/taman/.test(n))return"Taman";
  if(/kantor/.test(n))return"Kantor";
  return"";
};

const REGIONS=[
{id:"denpasar",name:"Denpasar",kota:true,lat:-8.65,lon:115.2167,
 srcs:[["ATCS Kota Denpasar","https://atcs.denpasarkota.go.id/"],BSD],
 idOf:k=>/PANORAMIC$/.test(k)?k.slice(0,4)+"P":/PTZ2$/.test(k)?k.slice(0,4)+"b":/^A\d{3}/.test(k)?k.slice(0,4):"bsd-"+k,
 link:k=>BASE+k+"/"+(!/PANORAMIC$/.test(k)&&INDEX_IDS.has(k.slice(0,4))?"index":"stream")+".m3u8",
 raw:[
  ["GUNUNG AGUNG","Simpang Wahidin - Gunung Agung","A001GUNUNGAGUNGPTZ"],
  ["KAPTEN SUJANA","Simpang Buluh indah - Gunung Agung","A002KAPTENSUJANAPTZ"],
  ["GUNUNG SALAK","Simpang Teuku Umar Barat - Gunung Salak","A003GUNUNGSALAKPTZ"],
  ["TEUKU UMAR","Simpang Imam Bonjol - Teuku Umar","A004TEUKUUMARPTZ1"],
  ["BATANTA","Simpang Teuku Umar - Batanta","A005BATANTAPTZ"],
  ["SOPUTAN","Simpang Imam Bonjol - Gunung Soputan","A006SOPUTANPTZ"],
  ["BALUN","Simpang Cokroaminoto - Maruti","A007BALUNPTZ"],
  ["MAHENDRADATTA","Simpang Teuku Umar Barat - Western Ring Road","A008MAHENDRADATTAPTZ"],
  ["PERUMNAS","Simpang Western Ring Road - Buana Raya","A009PERUMNASPTZ"],
  ["PERMATA HIJAU","Simpang Western Ring Road - Permata Hijau","A010PERMATAHIJAUPTZ"],
  ["MERPATI","Simpang Mahendradatta Utara - Merpati","A011MERPATIPTZ"],
  ["PULAU SAELUS","Simpang Diponegoro - Pulau Saelus","A012PULAUSAELUSPTZ"],
  ["SIDAKARYA","Simpang Diponegoro - Sidakarya","A013SIDAKARYAPTZ"],
  ["KAPTEN JAPA","Simpang Hayam Wuruk - Kapten Japa","A014KAPTENJAPAPTZ"],
  ["MELATI","Simpang Hayam Wuruk - Melati","A015MELATIPTZ"],
  ["YOS SUDARSO","Simpang PB Sudirman - Yos Sudarso","A016YOSSUDARSOPTZ"],
  ["PUPUTAN","Simpang PB Sudirman - Raya Puputan","A017PUPUTANPTZ"],
  ["DEWI SARTIKA","Simpang Diponegoro - Dewi Sartika","A018DEWISARTIKAPTZ"],
  ["FE UNUD","Simpang PB Sudirman - Serma Mendra","A019FEUNUDPTZ"],
  ["WATURENGGONG","Simpang PB Sudirman - Waturenggong","A020WATURENGGONGPTZ"],
  ["PULAU BUTON","Simpang Diponegoro - Pulau Buton","A021PULAUBUTONPTZ"],
  ["UBUNG","Simpang Gatot Subroto - Cokroaminoto","A022UBUNGPTZ1"],
  ["UBUNG 2","Simpang Gatot Subroto - Cokroaminoto","A022UBUNGPTZ2"],
  ["CATURMUKA","Simpang Udayana - Surapati","A023CATURMUKAPTZ"],
  ["ARJUNA","Simpang Gajah Mada - Arjuna","A024ARJUNAPTZ"],
  ["THAMRIN","Simpang Imam Bonjol - Thamrin","A025THAMRINPTZ"],
  ["PULAU BIAK","Simpang Imam Bonjol - Pulau Biak","A026PULAUBIAKPTZ"],
  ["GUNUNG SUBUR","Simpang Imam Bonjol - Gunung Subur","A027GUNUNGSUBURPTZ"],
  ["PULAU GALANG","Simpang Imam Bonjol - Pulau Galang","A028PULAUGALANGPTZ"],
  ["TANGKUBAN PERAHU","Simpang Teuku Umar Barat - Gunung Lumut","A029TANGKUBANPERAHUPTZ"],
  ["CARGO","Simpang Gatot Subroto - Cargo","A030CARGOPTZ"],
  ["PIDADA","Simpang Gatot Subroto - Pidada","A031PIDADAPTZ"],
  ["AHMAD YANI","Simpang Gatot Subroto - Ahmad Yani","A032AHMADYANIPTZ"],
  ["NANGKA","Simpang Gatot Subroto - Nangka","A033NANGKAPTZ1"],
  ["KENYERI","Simpang Gatot Subroto - Kenyeri","A034KENYERIPTZ"],
  ["NOJA","Simpang Gatot Subroto - Noja","A035NOJAPTZ"],
  ["TRENGGULI","Simpang Gatot Subroto - Trenggana","A036TRENGGULIPTZ"],
  ["KEN AROK","Simpang Ahmad Yani - Ken Arok","A037KENAROKPTZ"],
  ["TOHPATI","Simpang Gatot Subroto - WR Supratman","A038TOHPATIPTZ"],
  ["KEBO IWA","Simpang Gatot Subroto - Kebo Iwa","A039KEBOIWAPTZ"],
  ["SEKARSARI","Simpang IB Mantra - Sekarsari","A040SEKARSARIPTZ"],
  ["GEMITIR","Simpang IB Mantra - Gemitir","A041GEMITIRPTZ"],
  ["SEDAP MALAM","Simpang Hang Tuah - Sedap Malam","A042SEDAPMALAMPTZ"],
  ["GUNUNG GALUNGGUNG","Simpang Cokroaminoto - Gunung Galunggung","A043GUNUNGGALUNGGUNGPTZ"],
  ["WARIBANG","Simpang WR Supratman - Waribang","A044WARIBANGPTZ"],
  ["SURABI","Simpang WR Supratman - Surabi","A045SURABIPTZ"],
  ["SUBITA","Simpang WR Supratman - Subita","A046SUBITAPTZ"],
  ["KECUBUNG","Simpang WR Supratman - Kecubung","A047KECUBUNGPTZ"],
  ["NUSA INDAH","Simpang Hayam Wuruk - Nusa Indah","A048NUSAINDAHPTZ"],
  ["TUKAD UNDA","Simpang Raya Puputan - Tukad Unda","A049TUKADUNDAPTZ"],
  ["JALAN GUNUNG AGUNG","Ruas Jalan Gunung Agung","A050JALANGUNUNGAGUNGPTZ"],
  ["JALAN GUNUNG AGUNG PANORAMIC","Ruas Jalan Gunung Agung · Panoramic","A050JALANGUNUNGAGUNGPANORAMIC"],
  ["SURADIPA","Simpang Ahmad Yani Utara - Suradipa","A051SURADIPAPTZ"],
  ["KAPTEN AGUNG","Simpang Surapati - Kapten Agung","A052KAPTENAGUNGPTZ"],
  ["SIMPANG 6 TEUKU UMAR","Simpang 6 Teuku Umar","A053SIMPANG6TEUKUUMARPTZ"],
  ["SIMPANG 6 TEUKU UMAR PANORAMIC","Simpang 6 Teuku Umar · Panoramic","A053SIMPANG6TEUKUUMARPANORAMIC"],
  ["GAJAH MADA BARAT","Simpang Wahidin - Gajah Mada","A054GAJAHMADABARATPTZ"],
  ["PASAR BADUNG","Simpang Gajah Mada - Sulawesi","A055PASARBADUNGPTZ"],
  ["PELABUHAN SANUR","Pelabuhan Matahari Terbit","A056PELABUHANSANURPTZ"],
  ["JALAN UDAYANA","Jalan Udayana","A065UDAYANAPTZ"],
  ["RAYA PUPUTAN - BAJRA SANDHI","Jalan Raya Puputan","A066PUPUTANPTZ"],
  ["NANGKA - KEMUDA","Simpang Nangka Utara - Kemuda","A067NANGKAUTARAPTZ"],
  ["SEROJA - KEMUDA","Simpang Kemuda - Seroja","A068SEROJAPTZ"],
  ["PADMA","Simpang Trenggana - Padma","A069PADMAPTZ"],
  ["TITI BANDA","Patung Titi Banda","A070TITIBANDAPTZ"],
  ["BUNDARAN HANG TUAH","Bundaran Hang Tuah","A071BUNDARANHANGTUAHPTZ"],
  ["DURIAN - KALIASEM","Simpang Durian - Kaliasem","A072DURIAN-KALIASEMPTZ"],
  ["AHMAD YANI - MARUTI","Simpang Ahmad Yani - Maruti","A073AHMADYANI-MARUTIPTZ"],
  ["AHMAD YANI - MARUTI PANORAMIC","Simpang Ahmad Yani - Maruti · Panoramic","A073AHMADYANI-MARUTIPANORAMIC"],
  ["AHMAD YANI - MULAWARMAN","Simpang Ahmad Yani - Mulawarman","A074AHMADYANI-MULAWARMANPTZ"],
  ["PASAR SATRIA","Ruas Jalan Veteran","A075PASARSATRIAPTZ"],
  ["PASAR SATRIA PANORAMIC","Ruas Jalan Veteran · Panoramic","A075PASARSATRIAPANORAMIC"],
  ["BANJAR TAINSIAT","Simpang Nangka Selatan - Pattimura","A076BANJARTAINSIATPTZ"],
  ["BANJAR TAINSIAT PANORAMIC","Simpang Nangka Selatan - Pattimura · Panoramic","A076BANJARTAINSIATPANORAMIC"],
  ["BANJAR BALUN","Simpang Setiabudi - Sutomo","A077BANJARBALUNPTZ"],
  ["BANJAR BALUN PANORAMIC","Simpang Setiabudi - Sutomo · Panoramic","A077BANJARBALUNPANORAMIC"],
  ["WIBISANA - SETIABUDI","Simpang Setiabudi - Wibisana","A078WIBISANA-SETIABUDIPTZ"],
  ["WIBISANA - SETIABUDI PANORAMIC","Simpang Setiabudi - Wibisana · Panoramic","A078WIBISANA-SETIABUDIPANORAMIC"],
  ["LAPANGAN PUPUTAN UTARA","Ruas Jalan Surapati","A079LAPANGPUPUTANUTARAPTZ"],
  ["LAPANGAN PUPUTAN UTARA PANORAMIC","Ruas Jalan Surapati · Panoramic","A079LAPANGPUPUTANUTARAPANORAMIC"],
  ["SULI - SARI GADING","Simpang Suli - Sari Gading","A080SULI-SARIGADINGPTZ"],
  ["SULI - SARI GADING PANORAMIC","Simpang Suli - Sari Gading · Panoramic","A080SULI-SARIGADINGPANORAMIC"],
  ["BANJAR TAMPAK GANGSUL","Simpang Nakula - Werkudara","A081BANJARTAMPAKGANGSULPTZ"],
  ["BANJAR TAMPAK GANGSUL PANORAMIC","Simpang Nakula - Werkudara · Panoramic","A081BANJARTAMPAKGANGSULPANORAMIC"],
  ["VETERAN - ABIMANYU","Simpang Veteran - Abimanyu","A082VETERAN-ABIMANYUPTZ"],
  ["VETERAN - ABIMANYU PANORAMIC","Simpang Veteran - Abimanyu · Panoramic","A082VETERAN-ABIMANYUPANORAMIC"],
  ["PURA DALEM YANG BATU","Ruas Jalan Cok Agung Tresna","A083PURADALEMYANGBATUPTZ"],
  ["PURA DALEM YANG BATU PANORAMIC","Ruas Jalan Cok Agung Tresna · Panoramic","A083PURADALEMYANGBATUPANORAMIC"],
  ["POJOK SELATAN MUSEUM BALI","Simpang Sugianyar - Mudita","A084POJOKSELATANMUSEUMBALIPTZ"],
  ["POJOK SELATAN MUSEUM BALI PANORAMIC","Simpang Sugianyar - Mudita · Panoramic","A084POJOKSELATANMUSEUMBALIPANORAMIC"],
  ["POJOK UTARA JAGATNATHA","Simpang Surapati - Kaliasem","A085POJOKUTARAJAGATNATHAPTZ"],
  ["POJOK UTARA JAGATNATHA PANORAMIC","Simpang Surapati - Kaliasem · Panoramic","A085POJOKUTARAJAGATNATHAPANORAMIC"],
  ["TRENGGANA - SIULAN","Simpang Trenggana - Siulan","A086TRENGGANA-SIULANPTZ"],
  ["TRENGGANA - SIULAN PANORAMIC","Simpang Trenggana - Siulan · Panoramic","A086TRENGGANA-SIULANPANORAMIC"],
  ["PASAR AGUNG PENINJOAN","Simpang Padma - Cekomaria","A087PASARAGUNGPENINJOANPTZ"],
  ["PASAR AGUNG PENINJOAN PANORAMIC","Simpang Padma - Cekomaria · Panoramic","A087PASARAGUNGPENINJOANPANORAMIC"],
  ["TERMINAL KERENENG","Simpang Lely - Rampai","A088TERMINALKERENENGPTZ"],
  ["TERMINAL KERENENG PANORAMIC","Simpang Lely - Rampai · Panoramic","A088TERMINALKERENENGPANORAMIC"],
  ["RAYA PUPUTAN - LETDA TANTULAR","Simpang Raya Puputan - Tantular","A089RAYAPUPUTAN-LETDATANTULARPTZ"],
  ["RAYA PUPUTAN - LETDA TANTULAR PANORAMIC","Simpang Raya Puputan - Tantular · Panoramic","A089RAYAPUPUTAN-LETDATANTULARPANORAMIC"],
  ["KAPTEN AGUNG - KAPTEN REGUG","Simpang Kapten Agung - Kapten Regug","A090KAPTENAGUNG-KAPTENREGUGPTZ"],
  ["KAPTEN AGUNG - KAPTEN REGUG PANORAMIC","Simpang Kapten Agung - Kapten Regug · Panoramic","A090KAPTENAGUNG-KAPTENREGUGPANORAMIC"],
  ["KAMBOJA - ANGSOKA","Simpang Kamboja - Angsoka","A091KAMBOJA-ANGSOKAPTZ"],
  ["KAMBOJA - ANGSOKA PANORAMIC","Simpang Kamboja - Angsoka · Panoramic","A091KAMBOJA-ANGSOKAPANORAMIC"],
  ["KAMBOJA RIJASA","Simpang Kamboja - Rijasa","A092KAMBOJA-RIJASAPTZ"],
  ["KAMBOJA RIJASA PANORAMIC","Simpang Kamboja - Rijasa · Panoramic","A092KAMBOJA-RIJASAPANORAMIC"],
  ["DPRD KOTA DENPASAR","Simpang Melati - Cempaka","A093DPRDKOTADENPASARPTZ"],
  ["DPRD KOTA DENPASAR PANORAMIC","Simpang Melati - Cempaka · Panoramic","A093DPRDKOTADENPASARPANORAMIC"],
  ["KAMBOJA RAMPAI","Simpang Kamboja - Rampai","A094KAMBOJA-RAMPAIPTZ"],
  ["HAYAM WURUK - LELY","Simpang Hayam Wuruk - Lely","A095HAYAMWURUK-LELYPTZ"],
  ["HAYAM WURUK - LELY PANORAMIC","Simpang Hayam Wuruk - Lely · Panoramic","A095HAYAMWURUK-LELYPANORAMIC"],
  ["SIDAKARYA - BEDUGUL","Simpang Bedugul - Sidakarya","A096SIDAKARYA-BEDUGULPTZ"],
  ["SIDAKARYA - BEDUGUL PANORAMIC","Simpang Bedugul - Sidakarya · Panoramic","A096SIDAKARYA-BEDUGULPANORAMIC"],
  ["WATURENGGONG - TUKAD YEH AYA","Simpang Waturenggong - Tukad Yeh Aya","A097WATURENGGONG-TUKADYEHAYAPTZ"],
  ["TUKAD BARITO - TUKAD BADUNG","Simpang Tukad Barito - Tukad Badung","A098TUKADBARITO-TUKADBADUNGPTZ"],
  ["SUCI","Jalan Suci","A099SUCIPTZ"],
  ["SUCI PANORAMIC","Jalan Suci · Panoramic","A099SUCIPANORAMIC"],
  ["PURA DEMAK","Simpang Teuku Umar Barat - Pura Demak","A100PURADEMAKPTZ"],
  ["PURA DEMAK PANORAMIC","Simpang Teuku Umar Barat - Pura Demak · Panoramic","A100PURADEMAKPANORAMIC"],
  ["BATUKARU - RINJANI","Simpang Batukaru - Rinjani","A101BATUKARU-RINJANIPTZ"],
  ["UDAYANA - BELITON","Simpang Udayana - Beliton","A102UDAYANA-BELITON"],
  ["UDAYANA - BELITON PANORAMIC","Simpang Udayana - Beliton · Panoramic","A102UDAYANA-BELITONPANORAMIC"],
  ["GAJAH MADA BARAT","Simpang Gajah Mada - Thamrin","A103GAJAHMADABARATPTZ"],
  ["SUTOYO - HASANUDIN","Simpang Sutoyo - Hasanudin","A104SUTOYO-HASANUDINPTZ"],
  ["SUTOYO - HASANUDIN PANORAMIC","Simpang Sutoyo - Hasanudin · Panoramic","A104SUTOYO-HASANUDINPANORAMIC"],
  ["RSAD UDAYANA","Simpang PB Sudirman -RSAD","A105RSADUDAYANAPTZ"],
  ["RSAD UDAYANA PANORAMIC","Simpang PB Sudirman -RSAD · Panoramic","A105RSADUDAYANAPANORAMIC"],
  ["ENGGANO - BUNGIN","Simpang Pulau Bungin - Pulau Enggano","A106ENGGANO-BUNGINPTZ"],
  ["GATSU BARAT - GUNUNG CATUR","Simpang Gatot Subroto Barat - Gunung Catur","A107GATSUBARAT-GUNUNGCATURPTZ"],
  ["GATSU BARAT - GUNUNG CATUR PANORAMIC","Simpang Gatot Subroto Barat - Gunung Catur · Panoramic","A107GATSUBARAT-GUNUNGCATURPANORAMIC"],
  ["PASAR SANGLAH","Simpang Diponegoro - Waturenggong","A108PASARSANGLAHPTZ"],
  ["TEUKU UMAR - PULAU SERAM","Simpang Teuku Umar - Pulau Seram","A109TEUKUUMAR-PULAUSERAMPTZ"],
  ["TEUKU UMAR - PULAU SERAM PANORAMIC","Simpang Teuku Umar - Pulau Seram · Panoramic","A109TEUKUUMAR-PULAUSERAMPANORAMIC"],
  ["PULAU KAWE - SATELIT","Simpang Pulau Kawe - Satelit","A110PULAUKAWE-SATELITPTZ"],
  ["PULAU KAWE - SATELIT PANORAMIC","Simpang Pulau Kawe - Satelit · Panoramic","A110PULAUKAWE-SATELITPANORAMIC"],
  ["TUKAD BARITO","Simpang Tukad Barito - Tukad Batanghari","A113TUKADBARITOPTZ"],
  ["SIMPANG MAHENDRADATA - SOPUTAN","Simpang Mahendradata - Soputan","A006SOPUTANPTZ"],
  ["MAHENDRADATTA - SOPUTAN PANORAMIC","Simpang Mahendradata - Soputan · Panoramic","A051MAHENDRADATTA-SOPUTANPANORAMIC"],
  ["ANTASURA","Simpang Antasura - Astasura","A115ANTASURAPTZ"],
  ["PEMOGAN","Simpang Pemogan - Pulau Galang","A116PEMOGANPTZ"],
  ["GUNUNG SANGHYANG","Simpang Gunung Agung - Gunung Tangkuban Perahu","A117GUNUNGSANGHYANGPTZ"],
  ["TAMAN PANCING","Simpang Taman Pancing - Pemogan","A119TAMANPANCINGPTZ"],
  ["TUKAD PAKERISAN","Simpang Tukad Pakerisan - Tukad Barito","A120TUKADPAKERISANPTZ"],
  ["TUKAD PAKERISAN PANORAMIC","Simpang Tukad Pakerisan - Tukad Barito · Panoramic","A120TUKADPAKERISANPANORAMIC"],
  ["SIMPANG BENOA","","simpang-benoa",tc("simpang-benoa"),true],
  ["SIMPANG PAMELISAN","","simpang-pamelisan",tc("simpang-pamelisan"),true],
  ["SIMPANG TIRTANADI","","simpang-tirtanadi",tc("simpang-tirtanadi"),true],
  ["SIMPANG BALI BEACH","","simpang-bali-beach",tc("simpang-bali-beach"),true],
  ["SIMPANG PADANG GALAK","","simpang-padang-galak",tc("simpang-padang-galak"),true]
 ]},
{id:"badung",name:"Badung",p:"bdg-",lat:-8.70,lon:115.17,srcs:[BSD],gf:true,cat:true,fb:true,link:tc,raw:[
  ["Pantai Jimbaran CO1 CCTV1","","pantai-jimbaran-co1-cctv1"],
  ["Pantai Jimbaran CO1 CCTV2","","pantai-jimbaran-co1-cctv2"],
  ["Pantai Kedonganan CO1 CCTV1","","pantai-kedongan-co1-cctv1"],
  ["Pantai Kedonganan CO1 CCTV2","","pantai-kedongan-co1-cctv2"],
  ["Pasar Seni, Jl. Dewi Sartika, Kuta","","pasar-seni-jl-dewi-sartika-kuta"],
  ["Pantai Jerman CO1 CCTV1","","pantai-jerman-co1-cctv1"],
  ["Pantai Jerman CO1 CCTV2","","pantai-jerman-co1-cctv2"],
  ["Pantai Jerman CO2 CCTV1","","pantai-jerman-co2-cctv1"],
  ["Pantai Jerman CO2 CCTV2","","pantai-jerman-co2-cctv2"],
  ["Pantai Jerman CO3 CCTV1","","pantai-jerman-co3-cctv1"],
  ["Pantai Kuta C01 CCTV1","","pantai-kuta-c01-cctv1"],
  ["Pantai Kuta C01 CCTV2","","pantai-kuta-c01-cctv2"],
  ["Pantai Kuta C01 CCTV3","","pantai-kuta-c01-cctv3"],
  ["Pantai Kuta C04 CCTV1","","pantai-kuta-c04-cctv1"],
  ["Pantai Kuta C05 CCTV1","","pantai-kuta-c05-cctv1"],
  ["Pantai Kuta C05 CCTV2","","pantai-kuta-c05-cctv2"],
  ["Baruna Disaster Shelter CO1 CCTV1","","baruna-disaster-shelter-co1-cctv1"],
  ["Baruna Disaster Shelter CO1 CCTV2","","baruna-disaster-shelter-co1-cctv2"],
  ["Jl. Pantai Kuta Depan Hardrock","","jl-pantai-kuta-depan-hardrock"],
  ["Monumen Ground Zero / Pojok Panin","","monumen-ground-zeropojok-panin"],
  ["Patih Jelantik Majapahit","","patih-jelantik-majapahit"],
  ["Pertigaan Jl. Patih Jelantik - Jl. Dewi Sri","","pertigaan-jl-patih-jelantik---jl-dewi-sri"],
  ["Kantor Lurah Legian","","kantor-lurah-legian-co1-cctv1"],
  ["Jalan Arjuna Parkiran Pantai Doublesix","","jl-arjuna-parkiran-pantai-doublesix"],
  ["Jalan Seminyak Depan Swalayan Bintang / Gg Keraton","","jalan-seminyak-depan-swalayan-bintanggg-keraton"],
  ["Kantor Lurah Seminyak","","kantor-lurah-seminyak"],
  ["Taman Bencingah Mengwi","","taman-bencingah-mengwi-co1-cctv1"],
  ["Abiansemal","","abiansemal-co1-cctv1"],
  ["Tanjung Benoa","","tanjung-benoa-co1-cctv1"],
  ["Simpang BTDC","","simpang-btdc"],
  ["Simpang Pintu Tol","","simpang-pintu-tol"],
  ["Simpang Taman Griya","","simpang-taman-griya"],
  ["Simpang UNUD","","simpang-unud"],
  ["Simpang Kedonganan","","simpang-kedonganan"],
  ["Underpass Ngurah Rai Selatan","","underpass-ngurah-rai-selatan"],
  ["Underpass Ngurah Rai Utara","","underpass-ngurah-rai-utara"],
  ["Simpang Patung Kuda","","simpang-patung-kuda"],
  ["Petang","","petang-co1-cctv1"]
 ]},
{id:"tabanan",name:"Tabanan",p:"tbn-",lat:-8.54,lon:115.13,srcs:[BSD],gf:true,cat:true,fb:true,link:tc,raw:[
  ["CCTV WiFi Corner Dangin Carik 1","","cctv-wifi-corne-dangin-carik-1"],
  ["CCTV Bale Bengong","","cctv-belakang-garuda"],
  ["CCTV WiFi Corner Gedung Maario 1","","cctv-wifi-corner-gedung-maario-1"],
  ["CCTV WiFi Corner Gedung Maario 2","","cctv-wifi-corner-gedung-maario-2"],
  ["Taman Kota","","taman-kota"]
 ]},
{id:"klungkung",name:"Klungkung",p:"klk-",lat:-8.53,lon:115.40,srcs:[BSD],gf:true,cat:true,fb:true,link:tc,raw:[
  ["Simpang Lepang","","simpang-lepang"],
  ["Perempatan Tojan","","perempatan-tojan"],
  ["Perbatasan Klungkung-Gianyar","","perbatasan-klungkung-gianyar"],
  ["Perempatan Banjarangkan-Tusan","","perempatan-banjarangkan-tusan"],
  ["Pertigaan SMAN Satu Semarapura","","pertigaan-sman-satu-semarapura"],
  ["Perempatan Galiran","","perempatan-galiran"],
  ["Simpang Lima","","simpang-lima"],
  ["Pasar Senggol","","pasar-senggol"],
  ["Catus Pata","","catus-pata"],
  ["Perempatan Pasar Satria","","perempatan-pasar-satria"]
 ]},
{id:"bangli",name:"Bangli",p:"bgl-",lat:-8.25,lon:115.39,srcs:[BSD],gf:true,cat:true,fb:true,link:tc,raw:[
  ["Pura Batur","","pura-batur"]
 ]},
{id:"karangasem",name:"Karangasem",p:"kra-",lat:-8.45,lon:115.61,srcs:[BSD],gf:true,cat:true,fb:true,link:tc,raw:[
  ["Depan Pura Goa Lawah","","depan-pura-goa-lawah"],
  ["Pertigaan Subagan","","pertigaan-subagan"],
  ["Pertigaan Kodim","","pertigaan-kodim"],
  ["Parkiran Besakih","","parkir-besakih"],
  ["Besakih (Tangga Masuk Utama)","","pura-besakih-tangga-masuk-utama"],
  ["Besakih (Jalan Masuk Utama)","","pura-besakih-jalan-masuk-utama"],
  ["Besakih (Tangga Timur Penataran)","","pura-besakih-tangga-timur-penataran"],
  ["Besakih (Pos Polisi)","","pura-besakih-pos-polisi"],
  ["Besakih (Pintu Keluar Pewaregan)","","pura-besakih-pintu-keluar-pewaregan"]
 ]},
{id:"buleleng",name:"Buleleng",p:"bll-",lat:-8.11,lon:115.09,srcs:[BSD],gf:true,cat:true,link:k=>SHI+k+"/s.mp4",raw:[
  ["Simpang Seririt","","edROyIUx2v80"],
  ["PTZ Laksmigraha","","0RRzM22qNF80"],
  ["Taman Yuwana Asri","","isOvCBwVIA80"],
  ["Yudistira","","XB9YtCug4880"],
  ["Simpang Udayana","","jRuL9udZUp80"],
  ["Simpang Ponogoro","","VmqTvLw4ki80"],
  ["Taman Bungkarno","","lkRSReT3h580"],
  ["Simpang Pantai Penimbangan","","hw5JUl3wFQ"],
  ["Taman Kota","","qQxLmg544p80"],
  ["TBK Taman Bermain","","qhxKZHlnKs80"],
  ["Pertigaan Penarukan","","J7gwj3VUE280"],
  ["Simpang Penarungan","","MVXokBuNsO80"],
  ["Pasar Anyar","","44Z85N153j80"],
  ["Pasar Anyar 2","","1eB6RDETQG80"],
  ["Barat Tugu Singa","","d4LXaKRi2380"],
  ["Catus Pata","","3JFbU8gu4j80"],
  ["Simpang Penarukan","","8HbHNfGypg80"]
 ]},
{id:"jembrana",name:"Jembrana",p:"jbr-",lat:-8.36,lon:114.63,srcs:[BSD,["Bina Marga","https://binamarga.pu.go.id/"]],gf:true,cat:true,fb:true,link:tc,raw:[
  ["Perempatan Sudirman","","perempatan-sudirman"],
  ["Terminal Cargo Jembrana","","terminal-cargo"],
  ["Gilimanuk","","gilimanuk","https://mitradarat-vidstream.kemenhub.go.id/stream/GLMNKCCTVGILIMANUK2/stream.m3u8"]
 ]}
];

const CAMS_ALL=(()=>{
  const seen=new Set();
  REGIONS.forEach(r=>{
    if(!r.idOf)r.t=regT(r.name,r.kota);
    r.cams=r.raw.map(([name,detail,key,full,fb])=>{
      let id=r.idOf?r.idOf(key):r.p+key;
      while(seen.has(id))id+="b";
      seen.add(id);
      const c={id,name,detail,url:full||r.link(key),region:r.id};
      if(/PANORAMIC$/.test(key))c.pano=true;
      if(r.fb||fb)c.fb=true;
      if(r.cat){const g=catOf(name);c.streets=g?[g]:[]}
      return c;
    });
    delete r.raw;
  });
  return REGIONS.flatMap(r=>r.cams);
})();
const REGION=REGIONS.find(r=>r.id===window.REGION_ID)||null;
const CAMS=REGION?REGION.cams:CAMS_ALL;
