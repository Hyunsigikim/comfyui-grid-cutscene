from .grid_cutscene import GridCutscenePanel

NODE_CLASS_MAPPINGS = {
    "GridCutscenePanel": GridCutscenePanel
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "GridCutscenePanel": "Grid Cutscene System (Interactive)"
}

WEB_DIRECTORY = "./web"
__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]