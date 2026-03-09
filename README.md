# comfyui-grid-cutscene

ComfyUI custom node: **Grid Cutscene System (Interactive)**

## Installation

1) Copy this folder into:

`ComfyUI/custom_nodes/comfyui-grid-cutscene`

2) Install dependencies (from your ComfyUI portable root):

```bat
python_embeded\python.exe -m pip install -r ComfyUI\custom_nodes\comfyui-grid-cutscene\requirements.txt
```

3) Start ComfyUI.

## Node

- **Display name**: Grid Cutscene System (Interactive)
- **Class**: `GridCutscenePanel`
- **Category**: `LayoutTools`

## How to use

- Set `grid_size` (ex: 12)
- Choose `panel_index` (0..7)
- Click on the grid to place points. When 4 points are set, a polygon mask is generated.
- `all_panels_data` is stored internally (hidden widget) and used to rebuild masks.

## Outputs

- `MASK`
- `IMAGE` (mask converted to 3-channel image)

## License

MIT
