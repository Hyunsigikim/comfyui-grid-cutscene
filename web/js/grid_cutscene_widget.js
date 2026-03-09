import { app } from "../../../scripts/app.js";

app.registerExtension({
    name: "GridCutscene.FinalSystem",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "GridCutscenePanel") {
            
            nodeType.prototype.onNodeCreated = function() {
                this.allPanels = Array.from({length: 8}, () => []);
                this.droppedImage = null;
                const dataWidget = this.widgets.find(w => w.name === "all_panels_data");
                if (dataWidget) dataWidget.type = "hidden";
            };

            nodeType.prototype.onDrawBackground = function() {
                if (this.inputs && this.inputs[0].link !== null) {
                    const link = app.graph.links[this.inputs[0].link];
                    if (link) {
                        const parentNode = app.graph.getNodeById(link.origin_id);
                        if (parentNode && parentNode.imgs) this.bgImage = parentNode.imgs[0];
                    }
                } else {
                    this.bgImage = this.droppedImage;
                }
            };

            nodeType.prototype.onMouseDown = function(e, pos) {
                const b = this.grid_rect;
                if (!b || pos[0] < b.x || pos[0] > b.x + b.w || pos[1] < b.y || pos[1] > b.y + b.h) return;

                const gridSize = this.widgets.find(w => w.name === "grid_size").value;
                const idx = this.widgets.find(w => w.name === "panel_index").value;
                const gx = Math.round(((pos[0] - b.x) / b.w) * gridSize);
                const gy = Math.round(((pos[1] - b.y) / b.h) * gridSize);

                if (this.allPanels[idx].length >= 4) this.allPanels[idx] = [];
                this.allPanels[idx].push([gx, gy]);

                const dw = this.widgets.find(w => w.name === "all_panels_data");
                dw.value = this.allPanels.map((p, i) => `P${i+1}: ${p.map(pt => pt.join(',')).join(';')}`).join('\n');
                
                this.setDirtyCanvas(true, true);
                return true;
            };

            nodeType.prototype.onDrawForeground = function(ctx) {
                const gridSize = this.widgets.find(w => w.name === "grid_size").value;
                const currentIdx = this.widgets.find(w => w.name === "panel_index").value;
                
                let bgImg = this.bgImage; 
                let imgW = bgImg ? bgImg.width : (this.widgets.find(w => w.name === "width")?.value || 512);
                let imgH = bgImg ? bgImg.height : (this.widgets.find(w => w.name === "height")?.value || 512);

                const margin = 20;
                const x = margin, y = 160; 
                const draw_w = this.size[0] - margin * 2;
                const draw_h = draw_w * (imgH / imgW);

                if (this.size[1] < y + draw_h + 20) this.size[1] = y + draw_h + 20;
                this.grid_rect = { x, y, w: draw_w, h: draw_h };

                ctx.save();
                
                // 1. 배경 드로잉 (50% 투명도)
                if (bgImg) {
                    ctx.globalAlpha = 0.5;
                    ctx.drawImage(bgImg, x, y, draw_w, draw_h);
                    ctx.globalAlpha = 1.0;
                } else {
                    ctx.fillStyle = "#111";
                    ctx.fillRect(x, y, draw_w, draw_h);
                }

                // 2. 그리드 가이드라인 (이미지 위에 선명하게 표시)
                ctx.setLineDash([2, 4]); 
                ctx.strokeStyle = "rgba(212, 175, 55, 0.4)"; // 골드 톤 가이드
                ctx.lineWidth = 1;
                for(let i=0; i<=gridSize; i++) {
                    let lx = x + (i/gridSize)*draw_w; 
                    let ly = y + (i/gridSize)*draw_h;
                    ctx.beginPath(); ctx.moveTo(lx, y); ctx.lineTo(lx, y+draw_h); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(x, ly); ctx.lineTo(x+draw_w, ly); ctx.stroke();
                }
                ctx.setLineDash([]);

                // 3. 패널 및 꼭짓점
                this.allPanels.forEach((pts, idx) => {
                    if (pts.length === 0) return;
                    const isActive = (idx === currentIdx);
                    
                    // 선(Path) 그리기 - 아이콘 로직 제거됨
                    ctx.beginPath();
                    pts.forEach((p, i) => {
                        let px = x + (p[0]/gridSize)*draw_w;
                        let py = y + (p[1]/gridSize)*draw_h;
                        if(i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                    });
                    if (pts.length === 4) ctx.closePath();

                    ctx.strokeStyle = isActive ? "#D4AF37" : "rgba(255, 255, 255, 0.2)";
                    ctx.lineWidth = isActive ? 3 : 1;
                    ctx.fillStyle = isActive ? "rgba(212, 175, 55, 0.2)" : "rgba(255, 255, 255, 0.05)";
                    ctx.fill(); 
                    ctx.stroke();

                    // 4. 단일 아이콘 렌더링 (활성 패널만)
                    if (isActive) {
                        pts.forEach((p, i) => {
                            let px = x + (p[0]/gridSize)*draw_w;
                            let py = y + (p[1]/gridSize)*draw_h;
                            const isLast = (i === pts.length - 1);

                            ctx.save();
                            ctx.translate(px, py); 
                            ctx.rotate(Math.PI / 4); 
                            
                            if (isLast) {
                                ctx.shadowBlur = 10;
                                ctx.shadowColor = "#FFF";
                            }

                            ctx.fillStyle = isLast ? "#FFF" : "#D4AF37";
                            ctx.fillRect(-4, -4, 8, 8); 
                            
                            ctx.strokeStyle = "#000";
                            ctx.lineWidth = 1.5;
                            ctx.strokeRect(-4, -4, 8, 8);
                            
                            ctx.restore();
                        });
                    }
                });
                ctx.restore();
            };
        }
    }
});