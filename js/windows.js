window.WallWindows={
  items:new Map(),z:20,style:"classic",
  open(id,title,content){
    if(this.items.has(id)){this.focus(id);return this.items.get(id)}
    if(this.items.size>=7){window.showGSOD();return null}
    const el=document.createElement("section");
    el.className="os-window "+this.style;
    el.id=`window-${id}`;
    el.dataset.id=id;
    el.innerHTML=`<div class="window-title"><span>${title}</span><div class="window-controls"><button data-action="min" title="Minimize">_</button><button data-action="max" title="Maximize">□</button><button data-action="close" title="Close">×</button></div></div><div class="window-content">${content}</div><i class="resize-handle resize-n" data-resize="n"></i><i class="resize-handle resize-ne" data-resize="ne"></i><i class="resize-handle resize-e" data-resize="e"></i><i class="resize-handle resize-se" data-resize="se"></i><i class="resize-handle resize-s" data-resize="s"></i><i class="resize-handle resize-sw" data-resize="sw"></i><i class="resize-handle resize-w" data-resize="w"></i><i class="resize-handle resize-nw" data-resize="nw"></i>`;
    document.getElementById("window-layer").appendChild(el);
    this.items.set(id,el);
    this.focus(id);
    requestAnimationFrame(()=>el.classList.add("is-open"));
    this.drag(el);
    this.resize(el);
    el.addEventListener("mousedown",()=>this.focus(id));
    el.querySelector('[data-action="close"]').onclick=()=>this.close(id);
    el.querySelector('[data-action="min"]').onclick=()=>this.minimize(id);
    el.querySelector('[data-action="max"]').onclick=()=>this.maximize(id);
    WallAudio.blip();this.update();return el
  },
  focus(id){const el=this.items.get(id);if(!el)return;el.style.zIndex=++this.z;document.querySelectorAll(".task-button").forEach(b=>b.classList.toggle("active",b.dataset.id===id))},
  close(id){const el=this.items.get(id);if(!el)return;WallAudio.tone(280,.05);el.classList.add("is-closing");setTimeout(()=>{if(el.parentNode)el.remove();this.items.delete(id);this.update();document.dispatchEvent(new CustomEvent("wall:close",{detail:id}))},180)},
  minimize(id){const el=this.items.get(id);if(!el)return;el.classList.toggle("minimized");this.update()},
  maximize(id){const el=this.items.get(id);if(!el)return;el.classList.toggle("maximized");if(el.classList.contains("maximized")){el.dataset.restoreStyle=JSON.stringify({left:el.style.left,top:el.style.top,width:el.style.width,height:el.style.height});Object.assign(el.style,{left:"0",top:"42px",width:"100%",height:"calc(100% - 87px)"})}else{const restore=JSON.parse(el.dataset.restoreStyle||"{}");Object.assign(el.style,restore)}},
  setStyle(style){this.style=style;document.querySelectorAll(".os-window").forEach(w=>{w.classList.remove("classic","rounded","chamfer");w.classList.add(style)})},
  update(){const load=15+this.items.size*12;const ram=document.getElementById("ram");if(ram)ram.textContent=`MEM: ${Math.min(load,100)}%`;const widget=document.getElementById("widget-ram"),bar=document.getElementById("widget-ram-bar");if(widget)widget.textContent=Math.min(load,100)+"%";if(bar)bar.style.width=Math.min(load,100)+"%";if(load>=87&&load<100&&!sessionStorage.getItem("wallos_memory_warning")){sessionStorage.setItem("wallos_memory_warning","1");showToast("⚠️ CRITICAL MEMORY WARNING","RAM load at 87%+. Close unused applications to prevent system crash.")}const tasks=document.getElementById("task-buttons");if(!tasks)return;tasks.innerHTML="";this.items.forEach((w,id)=>{const b=document.createElement("button");b.className="task-button";b.dataset.id=id;b.textContent=w.querySelector(".window-title span").textContent;b.onclick=()=>{w.classList.remove("minimized");this.focus(id)};tasks.appendChild(b)})},
  drag(el){const bar=el.querySelector(".window-title");let active=false,dx=0,dy=0;bar.addEventListener("pointerdown",e=>{if(e.target.closest("button")||el.classList.contains("maximized"))return;active=true;dx=e.clientX-el.offsetLeft;dy=e.clientY-el.offsetTop;bar.setPointerCapture(e.pointerId)});bar.addEventListener("pointermove",e=>{if(active){el.style.left=Math.max(0,e.clientX-dx)+"px";el.style.top=Math.max(44,e.clientY-dy)+"px"}});bar.addEventListener("pointerup",()=>active=false)},
  resize(el){el.querySelectorAll("[data-resize]").forEach(handle=>handle.addEventListener("pointerdown",e=>{if(el.classList.contains("maximized"))return;e.preventDefault();e.stopPropagation();const direction=handle.dataset.resize,start={x:e.clientX,y:e.clientY,w:el.offsetWidth,h:el.offsetHeight,l:el.offsetLeft,t:el.offsetTop};handle.setPointerCapture(e.pointerId);const move=event=>{const dx=event.clientX-start.x,dy=event.clientY-start.y;let w=start.w,h=start.h,l=start.l,t=start.t;if(direction.includes("e"))w=start.w+dx;if(direction.includes("s"))h=start.h+dy;if(direction.includes("w")){w=start.w-dx;l=start.l+dx}if(direction.includes("n")){h=start.h-dy;t=start.t+dy}if(w>=340){el.style.width=w+"px";if(direction.includes("w"))el.style.left=Math.max(0,l)+"px"}if(h>=240){el.style.height=h+"px";if(direction.includes("n"))el.style.top=Math.max(44,t)+"px"}};const stop=()=>{handle.removeEventListener("pointermove",move);handle.removeEventListener("pointerup",stop)};handle.addEventListener("pointermove",move);handle.addEventListener("pointerup",stop)}))}
};
window.showGSOD=function(){if(document.getElementById("gsod"))return;const screen=document.createElement("section");screen.id="gsod";screen.innerHTML=`<div class="gsod-inner"><strong> WALL OS SYSTEM HALT </strong><p>A fatal exception 0E has occurred at 0028:C0011E36 in VXD WALLMEM(01) + 00010E36.</p><p>ERROR: PHYSICAL_MEMORY_OVERFLOW (RAM CAPACITY EXCEEDED 100%)</p><p>The current desktop session has been terminated to prevent CRT phosphor burn-in.</p><p>* Close unused applications next time to preserve system memory.</p><b class="gsod-prompt">Press any key or click anywhere to reboot Wall OS_</b></div></section>`;document.body.appendChild(screen);const reboot=()=>{[...WallWindows.items.keys()].forEach(id=>WallWindows.close(id));screen.remove();sessionStorage.removeItem("wallos_memory_warning");WallAudio.chime();WallWindows.update()};screen.addEventListener("click",reboot);screen.addEventListener("keydown",reboot);screen.tabIndex=0;screen.focus()};
