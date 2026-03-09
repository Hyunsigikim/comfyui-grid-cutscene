import { app } from "../../../scripts/app.js";

app.registerExtension({
    name: "GridCutscene.FinalSystem",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "GridCutscenePanel") {
            
            nodeType.prototype.onNodeCreated = function() {
                this.allPanels = Array.from({length: 8}, () => []);
                this.droppedImage = null;
                this.hoverSnap = null;
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

                if (this.allPanels[idx].length >= 4) this.allPanels[idx].shift();
                this.allPanels[idx].push([gx, gy]);

                const dw = this.widgets.find(w => w.name === "all_panels_data");
                dw.value = this.allPanels.map((p, i) => `P${i+1}: ${p.map(pt => pt.join(',')).join(';')}`).join('\n');
                
                this.setDirtyCanvas(true, true);
                return true;
            };

            nodeType.prototype.onMouseMove = function(e, pos) {
                const b = this.grid_rect;
                if (!b) return;

                const inside = !(pos[0] < b.x || pos[0] > b.x + b.w || pos[1] < b.y || pos[1] > b.y + b.h);
                if (!inside) {
                    if (this.hoverSnap) {
                        this.hoverSnap = null;
                        this.setDirtyCanvas(true, false);
                    }
                    return;
                }

                const gridSize = this.widgets.find(w => w.name === "grid_size").value;
                const gx = Math.round(((pos[0] - b.x) / b.w) * gridSize);
                const gy = Math.round(((pos[1] - b.y) / b.h) * gridSize);
                const px = b.x + (gx / gridSize) * b.w;
                const py = b.y + (gy / gridSize) * b.h;

                const prev = this.hoverSnap;
                if (!prev || prev.gx !== gx || prev.gy !== gy) {
                    this.hoverSnap = { gx, gy, px, py };
                    this.setDirtyCanvas(true, false);
                }
            };

            nodeType.prototype.onDrawForeground = function(ctx) {
                const gridSize = this.widgets.find(w => w.name === "grid_size").value;
                const currentIdx = this.widgets.find(w => w.name === "panel_index").value;
                
                let bgImg = this.bgImage; 
                let imgW = bgImg ? bgImg.width : (this.widgets.find(w => w.name === "width")?.value || 512);
                let imgH = bgImg ? bgImg.height : (this.widgets.find(w => w.name === "height")?.value || 512);

                const margin = 20;
                const outerPad = 14;
                const x = margin + outerPad;
                const y = 160 + outerPad;
                const draw_w = this.size[0] - (margin * 2) - (outerPad * 2);
                const draw_h = draw_w * (imgH / imgW);

                if (this.size[1] < y + draw_h + 20) this.size[1] = y + draw_h + 20;
                this.grid_rect = { x, y, w: draw_w, h: draw_h };

                ctx.save();

                // 0. 외곽 프레임(여유 영역 포함)
                {
                    const fx = margin;
                    const fy = 160;
                    const fw = this.size[0] - margin * 2;
                    const fh = draw_h + outerPad * 2;
                    ctx.fillStyle = "rgba(0,0,0,0.20)";
                    ctx.fillRect(fx, fy, fw, fh);
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = "rgba(255,255,255,0.10)";
                    ctx.strokeRect(fx + 0.5, fy + 0.5, fw - 1, fh - 1);
                }
                
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
                ctx.strokeStyle = "rgba(255, 80, 80, 0.50)";
                ctx.lineWidth = 1.25;
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

                    ctx.strokeStyle = isActive ? "#D4AF37" : "rgba(80, 160, 255, 0.55)";
                    ctx.lineWidth = isActive ? 3 : 2;
                    ctx.fillStyle = isActive ? "rgba(212, 175, 55, 0.2)" : "rgba(80, 160, 255, 0.14)";
                    ctx.fill(); 
                    ctx.stroke();

                    // 3.5 패널 번호 표시 (중앙 근처)
                    {
                        const pixelPts = pts.map((p) => [
                            x + (p[0] / gridSize) * draw_w,
                            y + (p[1] / gridSize) * draw_h,
                        ]);
                        const center = pixelPts.reduce(
                            (acc, pt) => [acc[0] + pt[0], acc[1] + pt[1]],
                            [0, 0]
                        );
                        const cx = center[0] / pixelPts.length;
                        const cy = center[1] / pixelPts.length;

                        ctx.save();
                        ctx.font = isActive ? "bold 18px sans-serif" : "bold 14px sans-serif";
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
                        ctx.lineWidth = 4;
                        ctx.strokeStyle = "rgba(0,0,0,0.75)";
                        ctx.fillStyle = isActive ? "#FFFFFF" : "rgba(255,255,255,0.75)";
                        const label = `P${idx + 1}`;
                        ctx.strokeText(label, cx, cy);
                        ctx.fillText(label, cx, cy);
                        ctx.restore();
                    }

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

                // 5. hover 스냅 포인트 미리보기 (활성 패널 기준)
                if (this.hoverSnap) {
                    ctx.save();
                    ctx.globalAlpha = 0.9;
                    ctx.beginPath();
                    ctx.arc(this.hoverSnap.px, this.hoverSnap.py, 6, 0, Math.PI * 2);
                    ctx.fillStyle = "rgba(255, 80, 80, 0.18)";
                    ctx.fill();
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = "rgba(255, 80, 80, 0.85)";
                    ctx.stroke();
                    ctx.restore();
                }
                ctx.restore();
            };
        }
    }
});