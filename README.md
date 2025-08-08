# 🏗️ Floor Plan Designer
A powerful Kivy-based application that allows users to design and generate customizable floor plans with smart automation, OCR integration, and precise layout control.

📁 Project Structure
1. floorplan_designer.py – Logic Layer
Manages all core logic behind floor plan behavior.
-----

Key Features:

🔄 Elements System – Tracks rooms, walls, appliances, and text.

➕ Add Room/Wall/Border/Text – Includes validation and presets.

🏠 Auto Floor Plan Generator – Instantly builds a default layout with:

Bedroom

Living Room

Kitchen

Bathroom

Appliances auto-placed

🔄 Rotation Support – Rotates objects in 90° increments.

↩️ Undo/Redo Stack – Keeps full edit history.

✅ Validation – Detects and warns if furniture doesn't fit the room.

📏 Units Conversion – Converts between meters and pixels (1m = 40px).

🧩 Appliance Scaling – Resizes furniture automatically to fit room size.

2. main.py – UI & Application Logic
Controls the user interface, input behavior, and platform interactions.

Key Features:

📚 Navigation Toolbar – Organized into collapsible panels:

Room Dimensions (Add Room, Wall, Border)

Appliances

Edit Tools (Rotate, Delete, Undo, Redo)

Text Input

Presets (Insert entire rooms)

OCR Scan (text recognition from image)

📐 Input Validation – Enforces minimum room size rules.

💬 Text Popups – Users can type and size text dynamically.

🔍 OCR Integration – Uses pytesseract to scan and add text from images.

💾 Save/Import Floor Plan – Export or load .json layout files.

3. widgets.py – Canvas Renderer
Handles drawing and visual representation of all elements.

Key Features:

📊 Grid System – Scalable grid backdrop for easy alignment.

🖼️ Element Renderer – Custom visuals for:

Beds (with pillows)

Sofas (with armrests)

TVs (with brackets)

🔄 Visual Rotation – Renders object orientation (except walls).

✏️ Text Labels – Uses actual Kivy Labels for editable text.

🔷 Selection Outline – Highlights selected objects in blue.

⚠️ Known Limitations
🚧 Wall Placement Preview exists but may lack final drawing logic.

🎨 Text Colors are limited to black only.

🧠 Undo/Redo stack works internally but isn’t visible in the toolbar.

🚫 Wall Rotation is not yet implemented visually.

🧠 Features Summary
Feature	Status
Auto Layout Generator	✅ Implemented
OCR Text Scan	✅ Available (requires Tesseract)
Rotation (90° steps)	✅ Rooms & Appliances
Undo/Redo	✅ Logic Only
Save/Import JSON	✅ Implemented
Appliance Fit Validation	✅ Warnings on overlap
Meter-to-Pixel Conversion	✅ 1m = 40px
Text Input	✅ Popup-based
Appliance Scaling	✅ Based on Room Size
