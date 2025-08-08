const canvas = document.getElementById("floorCanvas");
const ctx = canvas.getContext("2d");
let elements = [];
let history = [];
let redoStack = [];
let gridSize = 20;
let placingType = null;
let rotation = 0;
let draggingElement = null;
let resizingCorner = null;
let selectedElement = null;
let placingWall = false;
let wallStartPoint = null;

// Conversion factor: 1 meter = 40 pixels

const METERS_TO_PIXELS = 40;
function metersToPixels(meters) {
  return meters * METERS_TO_PIXELS;
}


function pixelsToMeters(pixels) {

  return pixels / METERS_TO_PIXELS;

}


// Toolbar events

document.getElementById("addRoomBtn").addEventListener("click", addRoom);

document.getElementById("addHouseBorderBtn").addEventListener("click", addHouseBorder);

document.getElementById("addWallBtn").addEventListener("click", startWallPlacement);

document.getElementById("rotateBtn").addEventListener("click", toggleRotation);

document.getElementById("undoBtn").addEventListener("click", undo);

document.getElementById("redoBtn").addEventListener("click", redo);

document.getElementById("saveBtn").addEventListener("click", saveLayout);

document.getElementById("importBtn").addEventListener("click", importLayout);

document.getElementById("deleteBtn").addEventListener("click", deleteSelected);

document.getElementById("generateBtn").addEventListener("click", generateFloorPlan);

document.getElementById("preset-room").addEventListener("click", () => addPreset("room"));

document.getElementById("preset-kitchen").addEventListener("click", () => addPreset("kitchen"));

document.getElementById("preset-livingroom").addEventListener("click", () => addPreset("livingroom"));

document.getElementById("preset-bathroom").addEventListener("click", () => addPreset("bathroom"));


document.getElementById("applianceType").addEventListener("change", (e) => {

  placingType = e.target.value;

});


canvas.addEventListener("mousedown", onMouseDown);

canvas.addEventListener("mousemove", onMouseMove);

canvas.addEventListener("mouseup", onMouseUp);


// Track mouse position for wall preview

canvas.addEventListener("mousemove", (e) => {

  canvas.lastMousePos = getMousePos(e);

  if (placingWall && wallStartPoint) {

    redraw();

  }

});


function addRoom() {

  const x = metersToPixels(parseFloat(document.getElementById("x").value));

  const y = metersToPixels(parseFloat(document.getElementById("y").value));

  const width = metersToPixels(parseFloat(document.getElementById("width").value));

  const height = metersToPixels(parseFloat(document.getElementById("height").value));

  elements.push({ type: "room", x, y, width, height });

  saveHistory();

  redraw();

}


function addHouseBorder() {

  const x = metersToPixels(parseFloat(document.getElementById("x").value));

  const y = metersToPixels(parseFloat(document.getElementById("y").value));

  const width = metersToPixels(parseFloat(document.getElementById("width").value));

  const height = metersToPixels(parseFloat(document.getElementById("height").value));

  elements.push({ type: "houseBorder", x, y, width, height });

  saveHistory();

  redraw();

}


function toggleRotation() {

  rotation = (rotation + 90) % 360;

  alert(`Rotation set to ${rotation}°`);

}


function startWallPlacement() {

  placingWall = true;

  wallStartPoint = null;

  placingType = null;

  document.getElementById("applianceType").value = "";

  alert("Click two points to create a wall");

}


function deleteSelected() {

  if (selectedElement) {

    elements = elements.filter(e => e !== selectedElement);

    selectedElement = null;

    saveHistory();

    redraw();

  }

}


function generateFloorPlan() {

  elements = [];


  // Get house dimensions from user input fields (convert meters to pixels)

  const houseX = metersToPixels(parseFloat(document.getElementById("x").value) || 1.25);

  const houseY = metersToPixels(parseFloat(document.getElementById("y").value) || 1.25);

  const houseWidth = metersToPixels(parseFloat(document.getElementById("width").value) || 10);

  const houseHeight = metersToPixels(parseFloat(document.getElementById("height").value) || 7.5);


  // Determine house size category based on area

  const houseArea = houseWidth * houseHeight;

  const isLarge = houseArea >= 120000;

  const isMiddle = houseArea >= 60000 && houseArea < 120000;


  // House border using input dimensions

  elements.push({ type: "houseBorder", x: houseX, y: houseY, width: houseWidth, height: houseHeight });


  // Calculate available interior space (accounting for border thickness)

  const borderWidth = 20;

  const interiorX = houseX + borderWidth;

  const interiorY = houseY + borderWidth;

  const interiorWidth = houseWidth - (2 * borderWidth);

  const interiorHeight = houseHeight - (2 * borderWidth);


  // Minimum spacing for proper connectivity

  const minSpacing = 20;


  if (isLarge) {

    // Large house: 3 bedrooms, living room, kitchen, bathroom with proper spacing

    const hallwayWidth = 60;

    const hallwayHeight = 40;


    // Living room (with main door) - front left

    const livingW = Math.floor(interiorWidth * 0.4);

    const livingH = Math.floor(interiorHeight * 0.45);

    elements.push({ type: "room", x: interiorX, y: interiorY, width: livingW, height: livingH });

    // Standard size appliances with proper spacing

    elements.push({ type: "sofa", x: interiorX + 30, y: interiorY + 30 });

    elements.push({ type: "sofa", x: interiorX + 150, y: interiorY + 30 });

    elements.push({ type: "side-table", x: interiorX + 90, y: interiorY + 100 });

    elements.push({ type: "flat-tv", x: interiorX + 80, y: interiorY + livingH - 50 });

    elements.push({ type: "door", x: houseX, y: houseY + houseHeight/2 - 20 }); // Main door from outside


    // Kitchen - front right

    const kitchenX = interiorX + livingW + hallwayWidth;

    const kitchenW = interiorWidth - livingW - hallwayWidth;

    elements.push({ type: "room", x: kitchenX, y: interiorY, width: kitchenW, height: livingH });

    // Standard kitchen appliances with proper spacing

    elements.push({ type: "sink", x: kitchenX + 30, y: interiorY + 30 });

    elements.push({ type: "gas-stove", x: kitchenX + 100, y: interiorY + 30 });

    elements.push({ type: "fridge", x: kitchenX + kitchenW - 80, y: interiorY + 30 });

    elements.push({ type: "table", x: kitchenX + 60, y: interiorY + 100 });

    elements.push({ type: "door", x: kitchenX, y: interiorY + livingH/2 });


    // Bedroom 1 - back left

    const backY = interiorY + livingH + hallwayHeight;

    const bedroomH = interiorHeight - livingH - hallwayHeight;

    const bedroom1W = Math.floor((interiorWidth - 2 * hallwayWidth) / 3);

    elements.push({ type: "room", x: interiorX, y: backY, width: bedroom1W, height: bedroomH });

    // Bed positioned away from door swing area, side table positioned to not overlap

    elements.push({ type: "bed-queen", x: interiorX + 30, y: backY + 60 });

    elements.push({ type: "side-table", x: interiorX + 30, y: backY + 170 }); // Positioned below bed

    elements.push({ type: "door", x: interiorX + bedroom1W/2, y: backY, rotation: 270 });


    // Bedroom 2 - back middle

    const bedroom2X = interiorX + bedroom1W + hallwayWidth;

    elements.push({ type: "room", x: bedroom2X, y: backY, width: bedroom1W, height: bedroomH });

    // Bed positioned away from door swing area, side table positioned to not overlap

    elements.push({ type: "bed-double", x: bedroom2X + 30, y: backY + 60 });

    elements.push({ type: "side-table", x: bedroom2X + 30, y: backY + 170 }); // Positioned below bed

    elements.push({ type: "door", x: bedroom2X + bedroom1W/2, y: backY, rotation: 270 });


    // Bedroom 3 - back right (part of remaining space)

    const bedroom3X = bedroom2X + bedroom1W + hallwayWidth;

    const remainingW = interiorWidth - 2 * bedroom1W - 2 * hallwayWidth;

    const bedroom3W = Math.floor(remainingW * 0.55);

    elements.push({ type: "room", x: bedroom3X, y: backY, width: bedroom3W, height: bedroomH });

    // Bed positioned away from door swing area, side table positioned to not overlap

    elements.push({ type: "bed-single", x: bedroom3X + 30, y: backY + 60 });

    elements.push({ type: "side-table", x: bedroom3X + 30, y: backY + 170 }); // Positioned below bed

    elements.push({ type: "door", x: bedroom3X + bedroom3W/2, y: backY, rotation: 270 });


    // Bathroom - remaining right space

    const bathroomX = bedroom3X + bedroom3W + minSpacing;

    const bathroomW = remainingW - bedroom3W - minSpacing;

    elements.push({ type: "room", x: bathroomX, y: backY, width: bathroomW, height: bedroomH });


    // Bathroom fixtures with proper spacing and bounds checking

    // Shower in lower left corner, with spacing from wall

    const showerY = backY + bedroomH - 70; // Position at bottom

    elements.push({ type: "shower", x: bathroomX + 25, y: showerY });

   

    // Toilet on right wall, attached to wall (positioned so it doesn't pass through)

    elements.push({ type: "toilet", x: bathroomX + bathroomW - 50, y: showerY - 60, rotation: 90 });

   

    // Sink above toilet on right wall, attached to wall (positioned so it doesn't pass through)

    elements.push({ type: "sink", x: bathroomX + bathroomW - 50, y: showerY - 110, rotation: 90 });

   

    // Door on upper-left wall, opening inward (rotated 90 degrees)

    elements.push({ type: "door", x: bathroomX + 20, y: backY, rotation: 270 });


  } else if (isMiddle) {

    // Medium house: 2 bedrooms, living room, kitchen, bathroom with proper spacing

    const hallwayWidth = 50;

    const hallwayHeight = 35;


    // Living room (with main door) - front left

    const livingW = Math.floor(interiorWidth * 0.45);

    const livingH = Math.floor(interiorHeight * 0.5);

    elements.push({ type: "room", x: interiorX, y: interiorY, width: livingW, height: livingH });

    // Standard size appliances with proper spacing

    elements.push({ type: "sofa", x: interiorX + 30, y: interiorY + 30 });

    elements.push({ type: "side-table", x: interiorX + 100, y: interiorY + 90 });

    elements.push({ type: "flat-tv", x: interiorX + 70, y: interiorY + livingH - 50 });

    elements.push({ type: "door", x: houseX, y: houseY + houseHeight/2 - 20 }); // Main door from outside


    // Kitchen - front right

    const kitchenX = interiorX + livingW + hallwayWidth;

    const kitchenW = interiorWidth - livingW - hallwayWidth;

    elements.push({ type: "room", x: kitchenX, y: interiorY, width: kitchenW, height: livingH });

    // Standard kitchen appliances with proper spacing

    elements.push({ type: "sink", x: kitchenX + 30, y: interiorY + 30 });

    elements.push({ type: "gas-stove", x: kitchenX + 90, y: interiorY + 30 });

    elements.push({ type: "fridge", x: kitchenX + kitchenW - 80, y: interiorY + 30 });

    elements.push({ type: "table", x: kitchenX + 60, y: interiorY + 90 });

    elements.push({ type: "door", x: kitchenX, y: interiorY + livingH/2 });


    // Bedroom 1 - back left

    const backY = interiorY + livingH + hallwayHeight;

    const bedroomH = interiorHeight - livingH - hallwayHeight;

    const bedroom1W = Math.floor((interiorWidth - hallwayWidth) * 0.55);

    elements.push({ type: "room", x: interiorX, y: backY, width: bedroom1W, height: bedroomH });

    // Bed positioned away from door swing area, side table positioned to not overlap

    elements.push({ type: "bed-queen", x: interiorX + 30, y: backY + 50 });

    elements.push({ type: "side-table", x: interiorX + 30, y: backY + 160 }); // Positioned below bed

    elements.push({ type: "door", x: interiorX + bedroom1W/2, y: backY, rotation: 270 });


    // Bedroom 2 & Bathroom - back right

    const bedroom2X = interiorX + bedroom1W + hallwayWidth;

    const remainingW = interiorWidth - bedroom1W - hallwayWidth;

    const bathroomW = Math.floor(remainingW * 0.4);

    const bedroom2W = remainingW - bathroomW - minSpacing;


    elements.push({ type: "room", x: bedroom2X, y: backY, width: bedroom2W, height: bedroomH });

    // Bed positioned away from door swing area, side table positioned to not overlap

    elements.push({ type: "bed-double", x: bedroom2X + 25, y: backY + 50 });

    elements.push({ type: "side-table", x: bedroom2X + 25, y: backY + 160 }); // Positioned below bed

    elements.push({ type: "door", x: bedroom2X + bedroom2W/2, y: backY, rotation: 270 });


    // Bathroom

    const bathroomX = bedroom2X + bedroom2W + minSpacing;

    elements.push({ type: "room", x: bathroomX, y: backY, width: bathroomW, height: bedroomH });


    // Bathroom fixtures with proper spacing and bounds checking

    // Shower in lower left corner, with spacing from wall

    const showerY = backY + bedroomH - 65; // Position at bottom

    elements.push({ type: "shower", x: bathroomX + 25, y: showerY });

   

    // Toilet on right wall, attached to wall (positioned so it doesn't pass through)

    elements.push({ type: "toilet", x: bathroomX + bathroomW - 50, y: showerY - 55, rotation: 90 });

   

    // Sink above toilet on right wall, attached to wall (positioned so it doesn't pass through)

    elements.push({ type: "sink", x: bathroomX + bathroomW - 50, y: showerY - 100, rotation: 90 });

   

    // Door on upper-left wall, opening inward (rotated 90 degrees)

    elements.push({ type: "door", x: bathroomX + 20, y: backY, rotation: 270 });


  } else {

    // Small house: Reduced appliances and smaller sizes for proper spatial connectivity

    const hallwayWidth = 30;


    // Living room (with main door) - front

    const livingW = Math.floor(interiorWidth * 0.6);

    const livingH = Math.floor(interiorHeight * 0.55);

    elements.push({ type: "room", x: interiorX, y: interiorY, width: livingW, height: livingH });


    // Minimal furniture with smaller sizes and proper spacing for small space

    if (livingW > 80 && livingH > 70) {

      elements.push({ type: "sofa", x: interiorX + 25, y: interiorY + 25, customSize: { width: 70, height: 40 } });

    }

    if (livingW > 100) {

      elements.push({ type: "side-table", x: interiorX + 25, y: interiorY + 80, customSize: { width: 30, height: 30 } });

    }

    if (livingH > 80) {

      elements.push({ type: "flat-tv", x: interiorX + 70, y: interiorY + livingH - 40, customSize: { width: 60, height: 15 } });

    }

    elements.push({ type: "door", x: houseX, y: houseY + houseHeight/2 - 20 }); // Main door from outside


    // Kitchen - front right (smaller)

    const kitchenX = interiorX + livingW + hallwayWidth;

    const kitchenW = interiorWidth - livingW - hallwayWidth;

    if (kitchenW > 60) {

      elements.push({ type: "room", x: kitchenX, y: interiorY, width: kitchenW, height: livingH });


      // Essential appliances only, smaller sizes with proper spacing

      elements.push({ type: "sink", x: kitchenX + 20, y: interiorY + 20, customSize: { width: 40, height: 30 } });

      if (kitchenW > 80) {

        elements.push({ type: "gas-stove", x: kitchenX + 70, y: interiorY + 20, customSize: { width: 35, height: 25 } });

      }

      elements.push({ type: "fridge", x: kitchenX + kitchenW - 55, y: interiorY + 20, customSize: { width: 35, height: 60 } });


      // Only add table if sufficient space

      if (kitchenW > 100 && livingH > 100) {

        elements.push({ type: "table", x: kitchenX + 30, y: interiorY + 70, customSize: { width: 80, height: 50 } });

      }

      elements.push({ type: "door", x: kitchenX, y: interiorY + livingH/2 });

    }


    // Bedroom - back left

    const backY = interiorY + livingH + hallwayWidth;

    const bedroomH = interiorHeight - livingH - hallwayWidth;

    const bedroomW = Math.floor(interiorWidth * 0.6);


    if (bedroomH > 80) {

      elements.push({ type: "room", x: interiorX, y: backY, width: bedroomW, height: bedroomH });


      // Single bed for small bedroom - positioned away from door swing

      elements.push({ type: "bed-single", x: interiorX + 25, y: backY + 45, customSize: { width: 60, height: 90 } });

      if (bedroomW > 100) {

        // Position side table to not overlap with bed

        elements.push({ type: "side-table", x: interiorX + 25, y: backY + 145, customSize: { width: 30, height: 30 } });

      }

      elements.push({ type: "door", x: interiorX + bedroomW/2, y: backY, rotation: 270 });

    }


    // Bathroom - back right (essential fixtures only)

    const bathroomX = interiorX + bedroomW + hallwayWidth;

    const bathroomW = interiorWidth - bedroomW - hallwayWidth;


    if (bathroomW > 50 && bedroomH > 80) {

      elements.push({ type: "room", x: bathroomX, y: backY, width: bathroomW, height: bedroomH });


      // Essential fixtures with smaller sizes and proper spacing

      // Shower in lower left corner, attached to wall

      if (bedroomH > 100) {

        const showerY = backY + bedroomH - 60; // Position at bottom

        elements.push({ type: "shower", x: bathroomX + 25, y: showerY, customSize: { width: 35, height: 50 } });

       

        // Toilet on right wall, attached to wall (positioned so it doesn't pass through)

        elements.push({ type: "toilet", x: bathroomX + bathroomW - 40, y: showerY - 50, rotation: 90, customSize: { width: 30, height: 40 } });

       

        // Small sink above toilet on right wall, attached to wall (only if space allows)

        if (bathroomW > 80) {

          elements.push({ type: "sink", x: bathroomX + bathroomW - 40, y: showerY - 85, rotation: 90, customSize: { width: 35, height: 25 } });

        }

      } else {

        // Fallback for very small bathrooms - shower in lower left

        const showerY = backY + bedroomH - 55;

        elements.push({ type: "shower", x: bathroomX + 25, y: showerY, customSize: { width: 30, height: 45 } });

        elements.push({ type: "toilet", x: bathroomX + bathroomW - 40, y: showerY - 45, rotation: 90, customSize: { width: 30, height: 40 } });

      }

     

      // Door rotated 90 degrees

      elements.push({ type: "door", x: bathroomX + bathroomW/2, y: backY, rotation: 270 });

    }

  }


  // Add windows only where they don't interfere with doors

  // Top border windows (avoiding door area)

  elements.push({ type: "window", x: houseX + houseWidth/4, y: houseY + 6 });

  elements.push({ type: "window", x: houseX + 3*houseWidth/4, y: houseY + 6 });


  // Bottom border windows

  elements.push({ type: "window", x: houseX + houseWidth/3, y: houseY + houseHeight - 14 });

  elements.push({ type: "window", x: houseX + 2*houseWidth/3, y: houseY + houseHeight - 14 });


  // Right border windows (avoiding door conflicts)

  elements.push({ type: "window", x: houseX + houseWidth - 14, y: houseY + houseHeight/4, rotation: 90 });

  elements.push({ type: "window", x: houseX + houseWidth - 14, y: houseY + 3*houseHeight/4, rotation: 90 });


  saveHistory();

  redraw();

}


function addPreset(type) {

  switch (type) {

    case "room":

      // Bedroom with door, bed, and side table

      elements.push({ type: "room", x: 50, y: 50, width: 200, height: 150 });

      elements.push({ type: "bed-queen", x: 70, y: 70 });

      elements.push({ type: "side-table", x: 180, y: 70 });

      elements.push({ type: "door", x: 250, y: 120 }); // Door on the wall, opening inside

      break;

    case "kitchen":

      // Kitchen with appliances, dining table, and door

      elements.push({ type: "room", x: 300, y: 50, width: 250, height: 200 });

      elements.push({ type: "sink", x: 320, y: 70 });

      elements.push({ type: "gas-stove", x: 380, y: 70 });

      elements.push({ type: "fridge", x: 500, y: 60 }); // Moved to upper right corner

      elements.push({ type: "table", x: 350, y: 150 }); // Dining table

      elements.push({ type: "door", x: 550, y: 140 }); // Door on the wall, opening inside

      break;

    case "livingroom":

      // Living room with sofa in upper left, TV opposite, center table, and door

      elements.push({ type: "room", x: 50, y: 250, width: 250, height: 200 });

      elements.push({ type: "sofa", x: 70, y: 270 }); // Upper left corner

      elements.push({ type: "sofa", x: 170, y: 270 }); // Single sofa next to main sofa

      elements.push({ type: "side-table", x: 120, y: 330 }); // Center table

      elements.push({ type: "flat-tv", x: 120, y: 410 }); // Opposite side of sofas

      elements.push({ type: "door", x: 300, y: 340 }); // Door on the wall, opening inside

      break;

    case "bathroom":

      // Bathroom with toilet upper left, bathtub beside it, shower lower left, door on bottom wall

      elements.push({ type: "room", x: 350, y: 250, width: 200, height: 200 });

      elements.push({ type: "toilet", x: 370, y: 270 }); // Upper left

      elements.push({ type: "bathtub", x: 420, y: 270 }); // Beside toilet

      elements.push({ type: "shower", x: 370, y: 380 }); // Lower left

      elements.push({ type: "door", x: 440, y: 450, rotation: 270 }); // Bottom wall, opening inward

      break;


  }

  saveHistory();

  redraw();

}


function onMouseDown(e) {

  const { x, y } = getMousePos(e);

  draggingElement = null;

  resizingCorner = null;

  selectedElement = null;


  // Check for appliance resize handles first

  for (let el of elements) {

    if (el.type !== "room" && el.type !== "houseBorder") {

      let handles = getApplianceHandles(el);

      for (let i = 0; i < handles.length; i++) {

        let h = handles[i];

        if (pointInRect(x, y, h.x, h.y, 8, 8)) {

          resizingCorner = { el, corner: i, isAppliance: true };

          return;

        }

      }

    }

  }


  // Check for room/house border resize handles

  for (let el of elements) {

    if (el.type === "room" || el.type === "houseBorder") {

      let handles = getRoomHandles(el);

      for (let i = 0; i < handles.length; i++) {

        let h = handles[i];

        if (pointInRect(x, y, h.x, h.y, 10, 10)) {

          resizingCorner = { el, corner: i };

          return;

        }

      }

    }

  }


  for (let el of elements.slice().reverse()) {

    if (el.type === "wall") {

      // Check if point is near the wall line

      const dist = distanceToLine(x, y, el.x1, el.y1, el.x2, el.y2);

      if (dist < 10) {

        draggingElement = { el, offsetX: x - el.x1, offsetY: y - el.y1 };

        selectedElement = el;

        redraw();

        return;

      }

    } else {

      let box = (el.type === "room" || el.type === "houseBorder")

        ? { x: el.x, y: el.y, width: el.width, height: el.height }

        : getApplianceBox(el);

      if (pointInRect(x, y, box.x, box.y, box.width, box.height)) {

        draggingElement = { el, offsetX: x - box.x, offsetY: y - box.y };

        selectedElement = el;

        redraw();

        return;

      }

    }

  }


  if (placingWall) {

    const snapX = Math.floor(x / gridSize) * gridSize;

    const snapY = Math.floor(y / gridSize) * gridSize;

   

    if (!wallStartPoint) {

      wallStartPoint = { x: snapX, y: snapY };

    } else {

      elements.push({

        type: "wall",

        x1: wallStartPoint.x,

        y1: wallStartPoint.y,

        x2: snapX,

        y2: snapY

      });

      wallStartPoint = null;

      placingWall = false;

      saveHistory();

      redraw();

    }

    return;

  }


  if (placingType) {

    const snapX = Math.floor(x / gridSize) * gridSize;

    const snapY = Math.floor(y / gridSize) * gridSize;

    elements.push({ type: placingType, x: snapX, y: snapY, rotation });

    saveHistory();

    redraw();

  }

}


function onMouseMove(e) {

  if (!draggingElement && !resizingCorner) return;


  const { x, y } = getMousePos(e);


  if (draggingElement) {

    let el = draggingElement.el;

    if (el.type === "wall") {

      const dx = x - draggingElement.offsetX - el.x1;

      const dy = y - draggingElement.offsetY - el.y1;

      el.x1 += dx;

      el.y1 += dy;

      el.x2 += dx;

      el.y2 += dy;

    } else {

      el.x = x - draggingElement.offsetX;

      el.y = y - draggingElement.offsetY;

    }

    redraw();

  }


  if (resizingCorner) {

    let { el, corner, isAppliance } = resizingCorner;

    let nx = Math.floor(x / gridSize) * gridSize;

    let ny = Math.floor(y / gridSize) * gridSize;


    if (isAppliance) {

      // Resize appliance by updating its custom size

      if (!el.customSize) {

        el.customSize = getApplianceSize(el.type);

      }


      switch (corner) {

        case 0:

          el.customSize.width += el.x - nx;

          el.customSize.height += el.y - ny;

          el.x = nx;

          el.y = ny;

          break;

        case 1:

          el.customSize.width = nx - el.x;

          el.customSize.height += el.y - ny;

          el.y = ny;

          break;

        case 2:

          el.customSize.width = nx - el.x;

          el.customSize.height = ny - el.y;

          break;

        case 3:

          el.customSize.width += el.x - nx;

          el.x = nx;

          el.customSize.height = ny - el.y;

          break;

      }

      if (el.customSize.width < 20) el.customSize.width = 20;

      if (el.customSize.height < 20) el.customSize.height = 20;

    } else {

      // Resize room/house border

      switch (corner) {

        case 0:

          el.width += el.x - nx;

          el.height += el.y - ny;

          el.x = nx;

          el.y = ny;

          break;

        case 1:

          el.width = nx - el.x;

          el.height += el.y - ny;

          el.y = ny;

          break;

        case 2:

          el.width = nx - el.x;

          el.height = ny - el.y;

          break;

        case 3:

          el.width += el.x - nx;

          el.x = nx;

          el.height = ny - el.y;

          break;

      }

      if (el.width < gridSize * 2) el.width = gridSize * 2;

      if (el.height < gridSize * 2) el.height = gridSize * 2;

    }

    redraw();

  }

}


function onMouseUp(e) {

  if (draggingElement || resizingCorner) saveHistory();

  draggingElement = null;

  resizingCorner = null;

}


function getMousePos(e) {

  const rect = canvas.getBoundingClientRect();

  return {

    x: e.clientX - rect.left,

    y: e.clientY - rect.top

  };

}


function pointInRect(px, py, rx, ry, rw, rh) {

  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;

}


function distanceToLine(px, py, x1, y1, x2, y2) {

  const A = px - x1;

  const B = py - y1;

  const C = x2 - x1;

  const D = y2 - y1;

  const dot = A * C + B * D;

  const lenSq = C * C + D * D;

  let param = -1;

  if (lenSq != 0) param = dot / lenSq;

 

  let xx, yy;

  if (param < 0) {

    xx = x1;

    yy = y1;

  } else if (param > 1) {

    xx = x2;

    yy = y2;

  } else {

    xx = x1 + param * C;

    yy = y1 + param * D;

  }

 

  const dx = px - xx;

  const dy = py - yy;

  return Math.sqrt(dx * dx + dy * dy);

}


function getRoomHandles(el) {

  return [

    { x: el.x - 5, y: el.y - 5 },

    { x: el.x + el.width - 5, y: el.y - 5 },

    { x: el.x + el.width - 5, y: el.y + el.height - 5 },

    { x: el.x - 5, y: el.y + el.height - 5 }

  ];

}


function getApplianceHandles(el) {

  let box = getApplianceBox(el);

  return [

    { x: box.x - 4, y: box.y - 4 },

    { x: box.x + box.width - 4, y: box.y - 4 },

    { x: box.x + box.width - 4, y: box.y + box.height - 4 },

    { x: box.x - 4, y: box.y + box.height - 4 }

  ];

}


function getApplianceBox(el) {

  let size = getApplianceSize(el.type);

  return {

    x: el.x,

    y: el.y,

    width: size.width,

    height: size.height

  };

}


function getApplianceSize(type) {

  const sizes = {

    "bed-single": { width: 60, height: 100 },

    "bed-double": { width: 80, height: 100 },

    "bed-queen": { width: 100, height: 100 },

    "bed-king": { width: 120, height: 100 },

    "table": { width: 120, height: 80 },

    "sofa": { width: 100, height: 50 },

    "fridge": { width: 45, height: 70 },

    "sink": { width: 50, height: 35 },

    "toilet": { width: 35, height: 50 },

    "door": { width: 8, height: 40 },

    "window": { width: 60, height: 8 },

    "shower": { width: 40, height: 60 },

    "flat-tv": { width: 70, height: 15 },

    "gas-stove": { width: 45, height: 30 },

    "side-table": { width: 35, height: 35 },

    "bathtub": { width: 90, height: 45 }

  };

  return sizes[type] || { width: 40, height: 40 };

}


function getApplianceBox(el) {

  let size = el.customSize || getApplianceSize(el.type);

  return {

    x: el.x,

    y: el.y,

    width: size.width,

    height: size.height

  };

}


function redraw() {

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawGrid();

  for (let el of elements) {

    if (el.type === "room") {

      drawSingleLineRect(el.x, el.y, el.width, el.height);

      let handles = getRoomHandles(el);

      ctx.fillStyle = "blue";

      for (let h of handles) {

        ctx.fillRect(h.x, h.y, 10, 10);

      }

    } else if (el.type === "houseBorder") {

      drawHouseBorder(el.x, el.y, el.width, el.height);

      let handles = getRoomHandles(el);

      ctx.fillStyle = "blue";

      for (let h of handles) {

        ctx.fillRect(h.x, h.y, 10, 10);

      }

    } else if (el.type === "wall") {

      drawWall(el);

    } else {

      drawAppliance(el);

      // Show resize handles for appliances

      let handles = getApplianceHandles(el);

      ctx.fillStyle = "green";

      for (let h of handles) {

        ctx.fillRect(h.x, h.y, 8, 8);

      }

    }

  }

 

  // Show wall preview while placing

  if (placingWall && wallStartPoint) {

    const mousePos = canvas.lastMousePos || { x: 0, y: 0 };

    ctx.strokeStyle = "gray";

    ctx.lineWidth = 2;

    ctx.setLineDash([5, 5]);

    ctx.beginPath();

    ctx.moveTo(wallStartPoint.x, wallStartPoint.y);

    ctx.lineTo(mousePos.x, mousePos.y);

    ctx.stroke();

    ctx.setLineDash([]);

  }

  if (selectedElement) {

    if (selectedElement.type === "wall") {

      ctx.strokeStyle = "red";

      ctx.lineWidth = 4;

      ctx.beginPath();

      ctx.moveTo(selectedElement.x1, selectedElement.y1);

      ctx.lineTo(selectedElement.x2, selectedElement.y2);

      ctx.stroke();

      ctx.lineWidth = 2; // Reset

    } else {

      let box = selectedElement.type === "room" || selectedElement.type === "houseBorder"

        ? { x: selectedElement.x, y: selectedElement.y, width: selectedElement.width, height: selectedElement.height }

        : getApplianceBox(selectedElement);

      ctx.strokeStyle = "red";

      ctx.lineWidth = 2;

      ctx.strokeRect(box.x - 2, box.y - 2, box.width + 4, box.height + 4);

    }

  }

}


function drawGrid() {

  ctx.strokeStyle = "#ddd";

  for (let x = 0; x < canvas.width; x += gridSize) {

    ctx.beginPath();

    ctx.moveTo(x, 0);

    ctx.lineTo(x, canvas.height);

    ctx.stroke();

  }

  for (let y = 0; y < canvas.height; y += gridSize) {

    ctx.beginPath();

    ctx.moveTo(0, y);

    ctx.lineTo(canvas.width, y);

    ctx.stroke();

  }

}


function drawSingleLineRect(x, y, width, height) {

  ctx.strokeStyle = "black";

  ctx.lineWidth = 2;

  ctx.strokeRect(x, y, width, height);

}


function drawWall(wall) {

  ctx.strokeStyle = "black";

  ctx.lineWidth = 2;

  ctx.beginPath();

  ctx.moveTo(wall.x1, wall.y1);

  ctx.lineTo(wall.x2, wall.y2);

  ctx.stroke();

}


function drawHouseBorder(x, y, width, height) {

  ctx.strokeStyle = "black";

  ctx.lineWidth = 2;

  // Outer border

  ctx.strokeRect(x, y, width, height);

  // Inner border (hollow space between)

  const borderWidth = 10;

  ctx.strokeRect(x + borderWidth, y + borderWidth, width - 2 * borderWidth, height - 2 * borderWidth);


  // Add fewer windows in the space between borders

  ctx.lineWidth = 4;


  // Top wall - one window

  ctx.beginPath();

  ctx.moveTo(x + width / 2 - 15, y + borderWidth / 2);

  ctx.lineTo(x + width / 2 + 15, y + borderWidth / 2);

  ctx.stroke();


  // Bottom wall - one window

  ctx.beginPath();

  ctx.moveTo(x + width / 2 - 15, y + height - borderWidth / 2);

  ctx.lineTo(x + width / 2 + 15, y + height - borderWidth / 2);

  ctx.stroke();


  // Right wall - one window

  ctx.beginPath();

  ctx.moveTo(x + width - borderWidth / 2, y + height / 3);

  ctx.lineTo(x + width - borderWidth / 2, y + height / 3 + 30);

  ctx.stroke();


  // Main door on left wall (opening gap)

  ctx.lineWidth = 2;

  ctx.strokeStyle = "white"; // Clear the wall section for door

  ctx.strokeRect(x, y + height / 2 - 20, borderWidth, 40);


  // Draw main door frame

  ctx.strokeStyle = "black";

  ctx.lineWidth = 3;

  ctx.strokeRect(x - 2, y + height / 2 - 20, borderWidth + 4, 40);


  ctx.lineWidth = 2; // Reset line width

}


function drawAppliance(el) {

  ctx.save();

  ctx.translate(el.x, el.y);

  ctx.rotate((el.rotation || 0) * Math.PI / 180);

  ctx.strokeStyle = "black";

  ctx.lineWidth = 2;

  const s = el.customSize || getApplianceSize(el.type);


  switch (el.type) {

    case "bed-single":

    case "bed-double":

    case "bed-queen":

    case "bed-king":

      // White mattress with pillows and blanket

      ctx.fillStyle = "white";

      ctx.fillRect(0, 0, s.width, s.height);

      ctx.strokeRect(0, 0, s.width, s.height);

      // Pillows

      ctx.fillStyle = "#f0f0f0";

      ctx.fillRect(5, 5, s.width - 10, 15);

      ctx.strokeRect(5, 5, s.width - 10, 15);

      // Blanket

      ctx.fillStyle = "#e0e0e0";

      ctx.fillRect(5, 25, s.width - 10, s.height - 30);

      ctx.strokeRect(5, 25, s.width - 10, s.height - 30);

      break;

    case "table":

      // Rectangular table with chairs

      ctx.strokeRect(0, 0, s.width, s.height);

      // Chairs on short sides (2 each)

      ctx.strokeRect(s.width/4 - 6, -15, 12, 12);

      ctx.strokeRect(3*s.width/4 - 6, -15, 12, 12);

      ctx.strokeRect(s.width/4 - 6, s.height + 3, 12, 12);

      ctx.strokeRect(3*s.width/4 - 6, s.height + 3, 12, 12);

      // Chairs on long sides (1 each)

      ctx.strokeRect(-15, s.height/2 - 6, 12, 12);

      ctx.strokeRect(s.width + 3, s.height/2 - 6, 12, 12);

      break;

    case "sofa":

      // Modern sofa with backrest and armrests

      ctx.fillStyle = "#d0d0d0";

      ctx.fillRect(0, 0, s.width, s.height);

      ctx.strokeRect(0, 0, s.width, s.height);

      // Backrest

      ctx.fillRect(-8, -5, s.width + 16, 12);

      ctx.strokeRect(-8, -5, s.width + 16, 12);

      // Armrests

      ctx.fillRect(-8, 0, 8, s.height);

      ctx.strokeRect(-8, 0, 8, s.height);

      ctx.fillRect(s.width, 0, 8, s.height);

      ctx.strokeRect(s.width, 0, 8, s.height);

      break;

    case "fridge":

      // Two-door fridge with handles (top view)

      ctx.fillStyle = "white";

      ctx.fillRect(0, 0, s.width, s.height);

      ctx.strokeRect(0, 0, s.width, s.height);

      // Door separation (horizontal)

      ctx.beginPath();

      ctx.moveTo(0, s.height / 2);

      ctx.lineTo(s.width, s.height / 2);

      ctx.stroke();

      // Handles on doors (vertical)

      ctx.fillStyle = "black";

      ctx.fillRect(s.width - 8, s.height / 4 - 3, 2, 6);

      ctx.fillRect(s.width - 8, 3 * s.height / 4 - 3, 2, 6);

      break;

    case "sink":

      // Sink with oval basin and faucet

      ctx.strokeRect(0, 0, s.width, s.height);

      // Oval basin

      ctx.beginPath();

      ctx.ellipse(s.width / 2, s.height / 2, s.width / 2 - 8, s.height / 2 - 8, 0, 0, 2 * Math.PI);

      ctx.stroke();

      // Faucet with curved line in middle

      ctx.beginPath();

      ctx.arc(s.width / 2, 8, 4, 0, 2 * Math.PI);

      ctx.stroke();

      // Curved faucet line

      ctx.beginPath();

      ctx.arc(s.width / 2, 8, 6, Math.PI / 4, 3 * Math.PI / 4);

      ctx.stroke();

      break;

    case "toilet":

      // Oval bowl with curved tank and flush button

      ctx.fillStyle = "white";

      // Curved tank (using arc instead of roundRect)

      ctx.beginPath();

      ctx.arc(s.width / 2, 3, (s.width - 6) / 2, 0, Math.PI, true);

      ctx.lineTo(3, s.height * 0.4);

      ctx.lineTo(s.width - 3, s.height * 0.4);

      ctx.closePath();

      ctx.fill();

      ctx.stroke();

      // Oval bowl (bigger circle)

      ctx.beginPath();

      ctx.ellipse(s.width / 2, s.height * 0.7, s.width / 2 - 5, s.height * 0.2, 0, 0, 2 * Math.PI);

      ctx.stroke();

      // Flush button

      ctx.fillStyle = "silver";

      ctx.fillRect(s.width / 2 - 3, 8, 6, 4);

      ctx.strokeRect(s.width / 2 - 3, 8, 6, 4);

      break;

      case "door":

      // AutoCAD-style door with proper arc representation

      ctx.lineWidth = 3;

      // Door opening (gap in wall)

      ctx.strokeStyle = "white";

      ctx.strokeRect(-1, -1, s.width + 2, s.height + 2);


      // Door frame

      ctx.strokeStyle = "black";

      ctx.strokeRect(0, 0, s.width, s.height);


      // Door swing arc (quarter circle showing door opening inside)

      ctx.beginPath();

      ctx.arc(s.width, 0, s.height, Math.PI / 2, Math.PI, false);

      ctx.stroke();


      // Door panel (line showing door position when closed)

      ctx.beginPath();

      ctx.moveTo(s.width, 0);

      ctx.lineTo(s.width, s.height);

      ctx.stroke();


      // Door handle

      ctx.fillStyle = "black";

      ctx.beginPath();

      ctx.arc(s.width - 5, s.height / 2, 2, 0, 2 * Math.PI);

      ctx.fill();

      break;

    case "window":

      // Black thick line (sliding window)

      ctx.lineWidth = 4;

      ctx.beginPath();

      ctx.moveTo(0, s.height / 2);

      ctx.lineTo(s.width, s.height / 2);

      ctx.stroke();

      break;

    case "shower":

      // Square with cross and circle in middle

      ctx.strokeRect(0, 0, s.width, s.height);

      // Cross inside square

      ctx.beginPath();

      ctx.moveTo(0, 0);

      ctx.lineTo(s.width, s.height);

      ctx.moveTo(s.width, 0);

      ctx.lineTo(0, s.height);

      ctx.stroke();

      // Circle in middle of cross

      ctx.beginPath();

      ctx.arc(s.width / 2, s.height / 2, 8, 0, 2 * Math.PI);

      ctx.stroke();

      break;

    case "flat-tv":

      // Thin rectangle with wall bracket as triangle

      ctx.fillStyle = "black";

      ctx.fillRect(0, 0, s.width, s.height);

      ctx.strokeRect(0, 0, s.width, s.height);

      // Wall bracket (triangle)

      ctx.beginPath();

      ctx.moveTo(s.width / 2, s.height);

      ctx.lineTo(s.width / 2 - 10, s.height + 8);

      ctx.lineTo(s.width / 2 + 10, s.height + 8);

      ctx.closePath();

      ctx.stroke();

      break;

    case "gas-stove":

      // Modern burner design (slightly smaller)

      ctx.strokeRect(0, 0, s.width, s.height);

      // Individual burners without connecting lines

      ctx.beginPath();

      ctx.arc(s.width / 4, s.height / 4, 6, 0, 2 * Math.PI);

      ctx.stroke();

      ctx.beginPath();

      ctx.arc(3 * s.width / 4, s.height / 4, 6, 0, 2 * Math.PI);

      ctx.stroke();

      ctx.beginPath();

      ctx.arc(s.width / 4, 3 * s.height / 4, 6, 0, 2 * Math.PI);

      ctx.stroke();

      ctx.beginPath();

      ctx.arc(3 * s.width / 4, 3 * s.height / 4, 6, 0, 2 * Math.PI);

      ctx.stroke();

      break;

    case "side-table":

      // Simple square table

      ctx.strokeRect(0, 0, s.width, s.height);

      break;

    case "bathtub":

      // Rectangular with rounded edges, faucet visible

      ctx.strokeRect(0, 0, s.width, s.height);

      // Oval inside bathtub

      ctx.beginPath();

      ctx.ellipse(s.width / 2, s.height / 2, s.width / 2 - 8, s.height / 2 - 8, 0, 0, 2 * Math.PI);

      ctx.stroke();

      // Faucet

      ctx.beginPath();

      ctx.arc(s.width - 15, 10, 4, 0, 2 * Math.PI);

      ctx.stroke();

      ctx.moveTo(s.width - 15, 14);

      ctx.lineTo(s.width - 15, 20);

      ctx.stroke();

      break;

    default:

      ctx.strokeRect(0, 0, s.width, s.height);

  }

  ctx.restore();

}


function saveHistory() {

  history.push(JSON.stringify(elements));

  redoStack = [];

}


function undo() {

  if (history.length > 1) {

    redoStack.push(history.pop());

    elements = JSON.parse(history[history.length - 1]);

    redraw();

  }

}


function redo() {

  if (redoStack.length > 0) {

    history.push(redoStack.pop());

    elements = JSON.parse(history[history.length - 1]);

    redraw();

  }

}


function saveLayout() {

  const data = JSON.stringify(elements);

  const blob = new Blob([data], { type: "application/json" });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;

  link.download = "floorplan.json";

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

}


function importLayout() {

  const input = document.createElement("input");

  input.type = "file";

  input.accept = ".json";

  input.onchange = (e) => {

    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (evt) => {

      elements = JSON.parse(evt.target.result);

      saveHistory();

      redraw();

    };

    reader.readAsText(file);

  };

  input.click();

}

// Initialize empty history
saveHistory();