const $ = (id) => document.getElementById(id);
const toast = (message) => { const el=$("toast"); el.textContent=message; el.classList.remove("hidden"); clearTimeout(window.toastTimer); window.toastTimer=setTimeout(()=>el.classList.add("hidden"),3000); };
const safeText = (s) => String(s ?? "");
let lastAnswer = "";
let installPrompt = null;

document.querySelectorAll(".tab").forEach(tab => tab.addEventListener("click", () => {
  document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t===tab));
  document.querySelectorAll(".panel").forEach(p=>p.classList.toggle("hidden",p.id!==tab.dataset.panel));
}));
document.querySelectorAll("[data-prompt]").forEach(b=>b.addEventListener("click",()=>{$("chatInput").value=b.dataset.prompt;$("chatInput").focus()}));

function addMessage(role, text) {
  const node=document.createElement("div"); node.className=`message ${role}`;
  const name=document.createElement("b"); name.textContent=role==="user"?"তুমি":"StudyMate AI";
  const p=document.createElement("p"); p.textContent=text;
  node.append(name,p); $("chatMessages").append(node); $("chatMessages").scrollTop=$("chatMessages").scrollHeight;
}
function localTutorAnswer(question) {
  const q=question.toLowerCase();
  if(q.includes("mcq") || q.includes("কুইজ")) return "চলো কুইজ বানাই! কোন শ্রেণি, বিষয় ও অধ্যায় তা বললে আরও নির্দিষ্ট প্রশ্ন বানানো যাবে। AI উত্তর চালু করতে AI Chat-এর নিচে Settings-এ Gemini API key যোগ করো।";
  if(q.includes("study plan") || q.includes("পড়ার রুটিন")) return "৩০ মিনিটের নমুনা রুটিন:\n১. ৫ মিনিট: আগের পড়া মনে করো\n২. ১৫ মিনিট: নতুন ধারণা পড়ো\n৩. ৭ মিনিট: ২–৩টি প্রশ্ন সমাধান করো\n৪. ৩ মিনিট: কী শিখলে লিখে রাখো\n\nতোমার বিষয় ও পরীক্ষার তারিখ জানালে রুটিন সাজাতে পারবে।";
  return "এখন ডেমো মোড চলছে—AI উত্তর পেতে AI Chat-এর Settings খুলে Google AI Studio থেকে পাওয়া Gemini API key যোগ করো।\n\nপ্রশ্ন: "+question+"\n\nAPI key ছাড়াও YouTube Class Search, voice-to-text (সমর্থিত ব্রাউজারে) এবং লোকাল নোট ব্যবহার করা যাবে।";
}
async function askGemini(question) {
  const key=localStorage.getItem("study_gemini_key");
  const model=localStorage.getItem("study_gemini_model") || "gemini-2.5-flash";
  if(!key) return localTutorAnswer(question);
  const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({systemInstruction:{parts:[{text:"তুমি StudyMate AI, বাংলাদেশের SSC/HSC/JSC শিক্ষার্থীদের সহায়ক। সহজ বাংলায় উত্তর দাও, প্রয়োজন হলে ধাপে ধাপে বোঝাও। অজানা তথ্য বানিয়ে বলবে না; পরীক্ষার তথ্য বইয়ের সঙ্গে যাচাই করতে বলবে।"}]},contents:[{role:"user",parts:[{text:question}]}],generationConfig:{temperature:0.5}})
  });
  const data=await response.json();
  if(!response.ok) throw new Error(data.error?.message || "Gemini API request ব্যর্থ হয়েছে");
  return data.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("\n") || "উত্তর পাওয়া যায়নি।";
}
$("chatForm").addEventListener("submit", async e=>{
  e.preventDefault(); const question=$("chatInput").value.trim(); if(!question)return;
  $("chatInput").value=""; addMessage("user",question);
  const wait=document.createElement("div"); wait.className="message assistant"; wait.textContent="ভাবছি…"; $("chatMessages").append(wait);
  try { const answer=await askGemini(question); wait.remove(); addMessage("assistant",answer); lastAnswer=answer; }
  catch(err){wait.remove();addMessage("assistant","দুঃখিত, AI অনুরোধটি সম্পন্ন হয়নি: "+err.message+"\nAPI key, model name এবং ইন্টারনেট সংযোগ যাচাই করো।");}
});
$("clearChat").addEventListener("click",()=>{$("chatMessages").replaceChildren();addMessage("assistant","নতুন চ্যাট শুরু হয়েছে। কী শিখতে চাও?")});
$("saveSettings").addEventListener("click",()=>{const key=$("apiKey").value.trim();if(key)localStorage.setItem("study_gemini_key",key);localStorage.setItem("study_gemini_model",$("modelName").value.trim()||"gemini-2.5-flash");toast(key?"AI সেটিংস এই ডিভাইসে সেভ হয়েছে।":"Model সেটিংস সেভ হয়েছে।")});
$("forgetKey").addEventListener("click",()=>{localStorage.removeItem("study_gemini_key");$("apiKey").value="";toast("Gemini key মুছে ফেলা হয়েছে।")});
$("apiKey").value=localStorage.getItem("study_gemini_key")||"";$("modelName").value=localStorage.getItem("study_gemini_model")||"gemini-2.5-flash";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition=null;
if(SpeechRecognition){
  recognition=new SpeechRecognition(); recognition.lang="bn-BD"; recognition.interimResults=true; recognition.continuous=false;
  recognition.onstart=()=>{$("voiceStatus").textContent="শুনছি… কথা বলো";$("micOrb").classList.add("listening");$("startListening").disabled=true;$("stopListening").disabled=false;};
  recognition.onresult=e=>{let text="";for(let i=0;i<e.results.length;i++)text+=e.results[i][0].transcript; $("voiceInput").value=text;};
  recognition.onerror=e=>{toast("Voice input সমস্যা: "+e.error);};
  recognition.onend=()=>{$("voiceStatus").textContent="কথা বলা শেষ—এখন প্রশ্ন পাঠাতে পারো";$("micOrb").classList.remove("listening");$("startListening").disabled=false;$("stopListening").disabled=true;};
}else{$("voiceStatus").textContent="এই ব্রাউজারে Voice Recognition সমর্থিত নয়। Chrome-এ চেষ্টা করো বা টেক্সট লিখো।";$("startListening").disabled=true;}
$("startListening").addEventListener("click",()=>{try{recognition?.start();}catch(e){toast("মাইক্রোফোন চালু করা যায়নি।")}});$("stopListening").addEventListener("click",()=>recognition?.stop());
$("askVoice").addEventListener("click",async()=>{const q=$("voiceInput").value.trim();if(!q){toast("আগে প্রশ্ন বলো বা লিখো।");return;}$("voiceAnswer").textContent="উত্তর তৈরি হচ্ছে…";try{lastAnswer=await askGemini(q);$("voiceAnswer").textContent=lastAnswer;}catch(e){$("voiceAnswer").textContent="AI অনুরোধ ব্যর্থ: "+e.message;}});
$("speakAnswer").addEventListener("click",()=>{if(!("speechSynthesis" in window)){toast("এই ব্রাউজারে text-to-speech নেই।");return;}if(!lastAnswer){toast("আগে একটি AI উত্তর তৈরি করো।");return;}speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(lastAnswer);utterance.lang="bn-BD";speechSynthesis.speak(utterance);});

$("saveYoutubeKeyToggle").addEventListener("click",()=>$("youtubeKeyBox").classList.toggle("hidden"));
$("youtubeKey").value=localStorage.getItem("study_youtube_key")||"";
$("saveYoutubeKey").addEventListener("click",()=>{const k=$("youtubeKey").value.trim();if(k)localStorage.setItem("study_youtube_key",k);else localStorage.removeItem("study_youtube_key");toast(k?"YouTube API key সেভ হয়েছে।":"YouTube API key মুছে দেওয়া হয়েছে।")});
function makeQuery(){return [$("level").value,$("subject").value,$("chapter").value.trim(),$("teacher").value.trim(),"Bangla class"].filter(Boolean).join(" ");}
function videoCard(item){
  const card=document.createElement("article");card.className="video-card";
  const img=document.createElement("img");img.loading="lazy";img.alt="ভিডিও thumbnail";img.src=item.snippet?.thumbnails?.medium?.url||"";
  const info=document.createElement("div");info.className="video-info";
  const h=document.createElement("h3");h.textContent=item.snippet?.title||"YouTube class";
  const channel=document.createElement("p");channel.textContent=item.snippet?.channelTitle||"YouTube";
  const desc=document.createElement("p");desc.textContent=(item.snippet?.description||"").slice(0,150);
  const a=document.createElement("a");a.target="_blank";a.rel="noopener noreferrer";a.href=item.id?.videoId?`https://www.youtube.com/watch?v=${encodeURIComponent(item.id.videoId)}`:`https://www.youtube.com/results?search_query=${encodeURIComponent(makeQuery())}`;a.textContent="YouTube-এ দেখো ↗";
  info.append(h,channel,desc,a);card.append(img,info);return card;
}
$("youtubeForm").addEventListener("submit",async e=>{
  e.preventDefault();const query=makeQuery();const key=localStorage.getItem("study_youtube_key");
  const results=$("youtubeResults");results.replaceChildren();
  if(!key){const box=document.createElement("div");box.className="empty-state";box.textContent="API key সেট করা নেই। YouTube-এ সরাসরি সার্চ খুলছি…";results.append(box);window.open("https://www.youtube.com/results?search_query="+encodeURIComponent(query),"_blank","noopener");return;}
  const loading=document.createElement("p");loading.className="empty-state";loading.textContent="ক্লাস খোঁজা হচ্ছে…";results.append(loading);
  try{
    const url=new URL("https://www.googleapis.com/youtube/v3/search");url.search=new URLSearchParams({part:"snippet",type:"video",maxResults:"9",q:query,key}).toString();
    const res=await fetch(url);const data=await res.json();if(!res.ok)throw new Error(data.error?.message||"YouTube API request ব্যর্থ");
    results.replaceChildren();if(!data.items?.length){const p=document.createElement("p");p.className="empty-state";p.textContent="কোনো ভিডিও পাওয়া যায়নি। অন্য টপিক দিয়ে চেষ্টা করো।";results.append(p);return;}
    data.items.forEach(item=>results.append(videoCard(item)));
  }catch(err){results.replaceChildren();const p=document.createElement("p");p.className="empty-state";p.textContent="সার্চ ব্যর্থ: "+err.message+" — API key, quota এবং API enable করা আছে কি না দেখো।";results.append(p);}
});

function loadNotes(){const notes=JSON.parse(localStorage.getItem("study_notes")||"[]");const list=$("notesList");list.replaceChildren();if(!notes.length){const p=document.createElement("p");p.className="empty-state";p.textContent="এখনও কোনো নোট নেই।";list.append(p);return;}notes.forEach((note,index)=>{const card=document.createElement("article");card.className="note-card";const del=document.createElement("button");del.className="btn btn-light";del.textContent="মুছো";del.addEventListener("click",()=>{const all=JSON.parse(localStorage.getItem("study_notes")||"[]");all.splice(index,1);localStorage.setItem("study_notes",JSON.stringify(all));loadNotes()});const h=document.createElement("h3");h.textContent=note.title;const p=document.createElement("p");p.textContent=note.body;card.append(del,h,p);list.append(card);});}
$("notesForm").addEventListener("submit",e=>{e.preventDefault();const notes=JSON.parse(localStorage.getItem("study_notes")||"[]");notes.unshift({title:$("noteTitle").value.trim(),body:$("noteBody").value.trim(),createdAt:Date.now()});localStorage.setItem("study_notes",JSON.stringify(notes));$("notesForm").reset();loadNotes();toast("নোট সেভ হয়েছে।")});loadNotes();

window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installPrompt=e;$("installBtn").classList.remove("hidden")});
$("installBtn").addEventListener("click",async()=>{if(!installPrompt){toast("Chrome menu থেকে Install app / Add to Home screen বেছে নাও।");return;}installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$("installBtn").classList.add("hidden")});
if("serviceWorker" in navigator && location.protocol.startsWith("http"))window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
