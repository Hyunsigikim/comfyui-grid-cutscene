import torch
import numpy as np
import cv2

class GridCutscenePanel:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "grid_size": ("INT", {"default": 12, "min": 2, "max": 64}),
                "panel_index": ("INT", {"default": 0, "min": 0, "max": 7}),
                "all_panels_data": ("STRING", {"default": "", "multiline": True}),
            },
            "optional": {
                "image": ("IMAGE",), 
                "width": ("INT", {"default": 512, "min": 64}),
                "height": ("INT", {"default": 512, "min": 64}),
            }
        }

    RETURN_TYPES = ("MASK", "IMAGE")
    FUNCTION = "generate"
    CATEGORY = "LayoutTools"

    def generate(self, grid_size, panel_index, all_panels_data, image=None, width=512, height=512):
        if image is not None:
            # [B, H, W, C] -> H, W 추출
            height, width = image.shape[1], image.shape[2]
            
        prefix = f"P{panel_index + 1}:"
        coords_str = ""
        for line in all_panels_data.strip().split('\n'):
            if line.startswith(prefix):
                coords_str = line.split(":")[1].strip()
        
        mask_np = np.zeros((height, width), dtype=np.float32)
        if coords_str:
            try:
                pts = [list(map(float, p.split(','))) for p in coords_str.split(';') if p.strip()]
                if len(pts) == 4:
                    points = (np.array(pts) * [width / grid_size, height / grid_size]).astype(np.int32)
                    cv2.fillPoly(mask_np, [points], 1.0)
            except: pass

        mask = torch.from_numpy(mask_np).unsqueeze(0)
        return (mask, mask.unsqueeze(-1).repeat(1, 1, 1, 3))