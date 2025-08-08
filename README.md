# 🏠 Floor Plan Designer

A Kivy-based app to design and generate custom floor plans with drag-and-drop rooms, appliances, auto-layouts, and OCR image scanning.

---

## 🚀 Features

- Add rooms, walls, borders, appliances, and text
- Auto-generate 4-room layouts (bedroom, kitchen, living room, bathroom)
- Rotate objects (90° steps)
- Appliance scaling based on room size
- OCR scan (detects labels from images with Tesseract)
- Save & load floor plans as `.json`
- Undo/Redo support
- Pixel ↔ meter unit conversion (1m = 40px)
- Validation (warns if furniture doesn’t fit)

---

## 🧱 Project Files

### `floorplan_designer.py`
- Core logic: handles elements, validation, layout generation, scaling, rotation, and unit conversion.

### `main.py`
- UI logic: toolbar actions, user input, OCR integration, save/load files.

### `widgets.py`
- Drawing: renders all rooms, appliances, text, and grid on the canvas.
-----

08/08/2025
