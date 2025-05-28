"use client";

import React, { useEffect, useRef, useState, useCallback, useReducer } from "react";
import * as fabric from "fabric";
import { ChangeEvent } from "react";
import {
  FaFont,
  FaSquare,
  FaCircle,
  FaPlay,
  FaDrawPolygon,
  FaPen,
  FaUndo,
  FaRedo,
  FaClone,
  FaTrash,
  FaSave,
  FaImage,
  FaSearchPlus,
  FaSearchMinus,
} from 'react-icons/fa';

interface EditorProps {
  projectId?: string;
  initialData?: string;
  onSave?: (data: string) => void;
}

const Editor: React.FC<EditorProps> = ({ projectId, initialData, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(800);
  const [canvasHeight, setCanvasHeight] = useState(600);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [activeObject, setActiveObject] = useState<fabric.Object | null>(null);
  const [filterOptions, setFilterOptions] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 0,
  });
  const [drawingMode, setDrawingMode] = useState(false);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const lastSavedState = useRef<string | null>(null);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleZoom = (newZoom: number) => {
    if (canvas) {
      canvas.setZoom(newZoom);
      canvas.setWidth(canvasWidth * newZoom);
      canvas.setHeight(canvasHeight * newZoom);
      canvas.renderAll();
    }
    setZoom(newZoom);
  };

  useEffect(() => {
    if (canvasRef.current) {
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        backgroundColor: backgroundColor,
        isDrawingMode: false,
      });
      setCanvas(fabricCanvas);
      fabricCanvas.setDimensions({ width: canvasWidth, height: canvasHeight });

      fabricCanvas.on("selection:created", (e) => setActiveObject(fabricCanvas.getActiveObject() || null));
      fabricCanvas.on("selection:updated", (e) => setActiveObject(fabricCanvas.getActiveObject() || null));
      fabricCanvas.on("selection:cleared", () => setActiveObject(null));

      const events: (keyof fabric.CanvasEvents)[] = ['object:added', 'object:modified', 'object:removed', 'path:created'];
      events.forEach((event) => {
        fabricCanvas.on(event, () => debounceSaveState());
      });

      return () => {
        fabricCanvas.dispose();
      };
    }
  }, []);

  useEffect(() => {
    if (canvas && initialData) {
      try {
        const parsedData = JSON.parse(initialData);
        const width = parsedData.canvasWidth || 800;
        const height = parsedData.canvasHeight || 600;
        setCanvasWidth(width);
        setCanvasHeight(height);
        canvas.setDimensions({ width, height });
        canvas.loadFromJSON(parsedData, () => {
          canvas.renderAll();
          setBackgroundColor(canvas.backgroundColor as string || '#ffffff');
          lastSavedState.current = JSON.stringify(canvas.toJSON());
          setUndoStack([]);
          setRedoStack([]);
        });
      } catch (err) {
        console.error("Error loading initial data:", err);
      }
    }
  }, [canvas, initialData]);

  useEffect(() => {
    if (canvas) {
      canvas.setDimensions({ width: canvasWidth, height: canvasHeight });
      canvas.renderAll();
    }
  }, [canvas, canvasWidth, canvasHeight]);

  const debounceSaveState = useCallback(() => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => saveState(), 300);
  }, []);

  const saveState = useCallback(() => {
    if (canvas) {
      const json = canvas.toJSON();
      json.canvasWidth = canvasWidth;
      json.canvasHeight = canvasHeight;
      const currentState = JSON.stringify(json);
      if (currentState !== lastSavedState.current) {
        if (lastSavedState.current) {
          setUndoStack(prev => [...prev, lastSavedState.current!].slice(-30));
        }
        setRedoStack([]);
        lastSavedState.current = currentState;
      }
    }
  }, [canvas]);

  const undo = useCallback(() => {
    if (undoStack.length > 0 && canvas) {
      const previousState = undoStack[undoStack.length - 1];
      const parsedJson = JSON.parse(previousState);
      canvas.setDimensions({ width: parsedJson.canvasWidth, height: parsedJson.canvasHeight });
      canvas.loadFromJSON(parsedJson, () => {
        canvas.renderAll();
        lastSavedState.current = previousState;
      });
      setUndoStack(prev => prev.slice(0, -1));
      setRedoStack(prev => [JSON.stringify(canvas.toJSON()), ...prev]);
    }
  }, [canvas, undoStack]);

  const redo = useCallback(() => {
    if (redoStack.length > 0 && canvas) {
      const nextState = redoStack[0];
      const parsedJson = JSON.parse(nextState);
      canvas.setDimensions({ width: parsedJson.canvasWidth, height: parsedJson.canvasHeight });
      canvas.loadFromJSON(parsedJson, () => {
        canvas.renderAll();
        lastSavedState.current = nextState;
      });
      setRedoStack(prev => prev.slice(1));
      setUndoStack(prev => [...prev, JSON.stringify(canvas.toJSON())]);
    }
  }, [canvas, redoStack]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "z") { e.preventDefault(); undo(); }
      else if (e.ctrlKey && e.key === "y") { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  const forceUpdate = useReducer(() => ({}), {})[1];

  const updateCanvasSize = (newWidth: number, newHeight: number) => {
    if (canvas) {
      canvas.setDimensions({ width: newWidth, height: newHeight });
      canvas.renderAll();
      debounceSaveState();
    }
    setCanvasWidth(newWidth);
    setCanvasHeight(newHeight);
  };

  const presetSizes = [
    { name: "Facebook Post", width: 1200, height: 630 },
    { name: "Facebook Cover", width: 820, height: 312 },
    { name: "Instagram Post", width: 1080, height: 1080 },
    { name: "Instagram Story", width: 1080, height: 1920 },
    { name: "YouTube Thumbnail", width: 1280, height: 720 },
  ];

  useEffect(() => {
    if (canvas && drawingMode) {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.width = 5;
      canvas.freeDrawingBrush.color = "#000000";
      canvas.renderAll();
    } else if (canvas) {
      canvas.isDrawingMode = false;
      canvas.renderAll();
    }
  }, [canvas, drawingMode]);

  const handleSave = async () => {
    if (canvas && onSave) {
      try {
        // Generate thumbnail from canvas
        const thumbnailDataURL = canvas.toDataURL({
          format: 'png',
          multiplier: 0.5,
        });
  
        // Convert dataURL to Blob
        const blob = await (await fetch(thumbnailDataURL)).blob();
  
        // Upload thumbnail
        const formData = new FormData();
        formData.append('file', blob, 'thumbnail.png');
        const uploadResponse = await fetch('/api/assets/upload', {
          method: 'POST',
          body: formData,
        });
  
        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(`Failed to upload thumbnail: ${errorData.error}`);
        }
  
        const { url: thumbnailUrl } = await uploadResponse.json();
  
        // Save project with thumbnail
        const json = canvas.toJSON();
        json.canvasWidth = canvasWidth;
        json.canvasHeight = canvasHeight;
        json.thumbnail = thumbnailUrl;
        console.log('Saving content:', JSON.stringify(json));
        onSave(JSON.stringify(json));
      } catch (error) {
        console.error('Error saving project:', error);
        alert('Failed to save project. Please try again.');
      }
    }
  };

  const loadFabricImage = (url: string): Promise<fabric.FabricImage> => {
    return fabric.FabricImage.fromURL(url,  {crossOrigin: 'anonymous'});
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !projectId) return;
    const file = e.target.files[0];
    
    const form = new FormData();
    form.append("file", file);

    const res = await fetch(`/api/projects/${projectId}/assets`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      console.error(await res.text());
      return;
    }

    const { url } = await res.json();
    try {
      const img = await loadFabricImage(url);
      img.set({ left: 0, top: 0, scaleX: 0.5, scaleY: 0.5 });
      canvas?.add(img);
      canvas?.setActiveObject(img);
      canvas?.renderAll();
      debounceSaveState();
    } catch (err) {
      console.error("Error loading image:", err);
    }
  };

  const addText = () => {
    if (canvas) {
      const text = new fabric.Textbox("Edit this text", {
        left: 100, top: 100, fontFamily: "Arial", fill: "#000000", fontSize: 20,
      });
      canvas.add(text);
      canvas.setActiveObject(text);
      setActiveObject(text);
      canvas.renderAll();
      debounceSaveState();
    }
  };

  const addRectangle = () => {
    if (canvas) {
      const rect = new fabric.Rect({ left: 100, top: 100, fill: "#FF5733", width: 100, height: 100 });
      canvas.add(rect);
      canvas.setActiveObject(rect);
      setActiveObject(rect);
      canvas.renderAll();
      debounceSaveState();
    }
  };

  const addCircle = () => {
    if (canvas) {
      const circle = new fabric.Circle({ left: 100, top: 100, fill: "#33A1FF", radius: 50 });
      canvas.add(circle);
      canvas.setActiveObject(circle);
      setActiveObject(circle);
      canvas.renderAll();
      debounceSaveState();
    }
  };

  const addTriangle = () => {
    if (canvas) {
      const triangle = new fabric.Triangle({ left: 100, top: 100, fill: "#33FF57", width: 100, height: 100 });
      canvas.add(triangle);
      canvas.setActiveObject(triangle);
      setActiveObject(triangle);
      canvas.renderAll();
      debounceSaveState();
    }
  };

  const addPolygon = () => {
    if (canvas) {
      const polygon = new fabric.Polygon(
        [{ x: 50, y: 0 }, { x: 100, y: 50 }, { x: 75, y: 100 }, { x: 25, y: 100 }, { x: 0, y: 50 }],
        { left: 100, top: 100, fill: "#FF33A1" }
      );
      canvas.add(polygon);
      canvas.setActiveObject(polygon);
      setActiveObject(polygon);
      canvas.renderAll();
      debounceSaveState();
    }
  };

  const toggleDrawingMode = () => {
    setDrawingMode((prev) => {
      if (canvas) {
        canvas.isDrawingMode = !prev;
        if (!prev) {
          canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
          canvas.freeDrawingBrush.width = 5;
          canvas.freeDrawingBrush.color = "#000000";
        }
      }
      return !prev;
    });
  };

  const applyFilter = (filter: string, value: number) => {
    if (canvas && activeObject && activeObject.type === "image") {
      const imgObj = activeObject as fabric.FabricImage;
      imgObj.filters = [];
      switch (filter) {
        case "brightness": imgObj.filters.push(new fabric.filters.Brightness({ brightness: value })); break;
        case "contrast": imgObj.filters.push(new fabric.filters.Contrast({ contrast: value })); break;
        case "saturation": imgObj.filters.push(new fabric.filters.Saturation({ saturation: value })); break;
      }
      imgObj.applyFilters();
      canvas.renderAll();
      debounceSaveState();
    }
  };

  const formatText = (format: string) => {
    if (canvas && activeObject && activeObject.type === "textbox") {
      const textbox = activeObject as fabric.Textbox;
      switch (format) {
        case "bold": textbox.set("fontWeight", textbox.fontWeight === "bold" ? "normal" : "bold"); break;
        case "italic": textbox.set("fontStyle", textbox.fontStyle === "italic" ? "normal" : "italic"); break;
        case "underline": textbox.set("underline", !textbox.underline); break;
      }
      canvas.renderAll();
      debounceSaveState();
    }
  };

  type TextboxTextAlign = "left" | "center" | "right";

  const alignText = (alignment: string) => {
    if (canvas && activeObject && activeObject.type === "textbox") {
      const textbox = activeObject as fabric.Textbox;
      textbox.set("textAlign", alignment as TextboxTextAlign);
      canvas.renderAll();
      debounceSaveState();
    }
  };

  const alignObject = (alignment: string) => {
    if (canvas && activeObject) {
      const obj = activeObject;
      switch (alignment) {
        case "left": obj.set("left", 0); break;
        case "center": obj.set("left", (canvas.width! - obj.width! * obj.scaleX!) / 2); break;
        case "right": obj.set("left", canvas.width! - obj.width! * obj.scaleX!); break;
        case "top": obj.set("top", 0); break;
        case "middle": obj.set("top", (canvas.height! - obj.height! * obj.scaleY!) / 2); break;
        case "bottom": obj.set("top", canvas.height! - obj.height! * obj.scaleY!); break;
      }
      canvas.renderAll();
      debounceSaveState();
    }
  };

  const deleteObject = () => {
    if (canvas && activeObject) {
      canvas.remove(activeObject);
      setActiveObject(null);
      canvas.renderAll();
      debounceSaveState();
    }
  };

  const cloneObject = async () => {
    if (canvas && activeObject) {
      const cloned = await (activeObject as fabric.FabricObject).clone();
      cloned.set({ left: (activeObject.left || 0) + 10, top: (activeObject.top || 0) + 10 });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      setActiveObject(cloned);
      canvas.renderAll();
      debounceSaveState();
    }
  };

  return (
    <div className="flex h-full">
      {/* Left Vertical Toolbar */}
      <div className="w-16 bg-gray-100 border-r border-gray-300 flex flex-col items-center py-4 space-y-4">
        <label className="flex items-center justify-center w-10 h-10 rounded hover:bg-gray-200 cursor-pointer" title="Upload Image">
          <FaImage className="text-2xl" />
          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </label>
        <button className="flex items-center justify-center w-10 h-10 rounded hover:bg-gray-200" onClick={addText} title="Add Text">
          <FaFont className="text-2xl" />
        </button>
        <button className="flex items-center justify-center w-10 h-10 rounded hover:bg-gray-200" onClick={addRectangle} title="Add Rectangle">
          <FaSquare className="text-2xl" />
        </button>
        <button className="flex items-center justify-center w-10 h-10 rounded hover:bg-gray-200" onClick={addCircle} title="Add Circle">
          <FaCircle className="text-2xl" />
        </button>
        <button className="flex items-center justify-center w-10 h-10 rounded hover:bg-gray-200" onClick={addTriangle} title="Add Triangle">
          <FaPlay className="text-2xl transform rotate-90" />
        </button>
        <button className="flex items-center justify-center w-10 h-10 rounded hover:bg-gray-200" onClick={addPolygon} title="Add Polygon">
          <FaDrawPolygon className="text-2xl" />
        </button>
        <button
          className={`flex items-center justify-center w-10 h-10 rounded ${drawingMode ? 'bg-blue-200' : 'hover:bg-gray-200'}`}
          onClick={toggleDrawingMode}
          title={drawingMode ? 'Exit Drawing' : 'Pen Tool'}
        >
          <FaPen className="text-2xl" />
        </button>
        <div className="w-8 h-px bg-gray-300" />
        <button
          className="flex items-center justify-center w-10 h-10 rounded hover:bg-gray-200 disabled:opacity-50"
          onClick={undo}
          disabled={undoStack.length === 0}
          title="Undo"
        >
          <FaUndo className="text-2xl" />
        </button>
        <button
          className="flex items-center justify-center w-10 h-10 rounded hover:bg-gray-200 disabled:opacity-50"
          onClick={redo}
          disabled={redoStack.length === 0}
          title="Redo"
        >
          <FaRedo className="text-2xl" />
        </button>
        <div className="w-8 h-px bg-gray-300" />
        <button
          className="flex items-center justify-center w-10 h-10 rounded hover:bg-gray-200 disabled:opacity-50"
          onClick={cloneObject}
          disabled={!activeObject}
          title="Clone"
        >
          <FaClone className="text-2xl" />
        </button>
        <button
          className="flex items-center justify-center w-10 h-10 rounded hover:bg-gray-200 disabled:opacity-50"
          onClick={deleteObject}
          disabled={!activeObject}
          title="Delete"
        >
          <FaTrash className="text-2xl" />
        </button>
        <div className="w-8 h-px bg-gray-300" />
        <button className="flex items-center justify-center w-10 h-10 rounded hover:bg-gray-200" onClick={handleSave} title="Save">
          <FaSave className="text-2xl" />
        </button>
        <div className="w-8 h-px bg-gray-300" />
        <button className="flex items-center justify-center w-10 h-10 rounded hover:bg-gray-200" onClick={() => handleZoom(zoom + 0.1)} title="Zoom In">
          <FaSearchPlus className="text-2xl" />
        </button>
        <button className="flex items-center justify-center w-10 h-10 rounded hover:bg-gray-200" onClick={() => handleZoom(zoom - 0.1)} title="Zoom Out">
          <FaSearchMinus className="text-2xl" />
        </button>
      </div>

      {/* Center Canvas */}
      <div className="flex-1 overflow-auto flex justify-center items-center bg-gray-200 p-4">
        <canvas ref={canvasRef} />
      </div>

      {/* Right Properties Panel */}
      <div className="w-64 p-4 bg-white border-l border-gray-300 overflow-auto">
        <h3 className="font-bold text-lg mb-4">Properties</h3>
        {!activeObject ? (
          <div>
            <h4 className="font-semibold mb-2">Canvas Properties</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Width</label>
                <input
                  type="number"
                  value={canvasWidth}
                  onChange={(e) => setCanvasWidth(parseInt(e.target.value) || 800)}
                  className="mt-1 block w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Height</label>
                <input
                  type="number"
                  value={canvasHeight}
                  onChange={(e) => setCanvasHeight(parseInt(e.target.value) || 600)}
                  className="mt-1 block w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Background Color</label>
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="mt-1 block w-full"
                />
              </div>
              <button
                onClick={() => updateCanvasSize(canvasWidth, canvasHeight)}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Apply Size
              </button>
              <div>
                <h5 className="font-medium mb-2">Presets</h5>
                <div className="grid grid-cols-2 gap-2">
                  {presetSizes.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => updateCanvasSize(preset.width, preset.height)}
                      className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium">Zoom</label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleZoom(zoom - 0.1)}
                    className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    -
                  </button>
                  <span>{(zoom * 100).toFixed(0)}%</span>
                  <button
                    onClick={() => handleZoom(zoom + 0.1)}
                    className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {drawingMode && canvas && (
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Drawing Properties</h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm">Brush Size</label>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={canvas.freeDrawingBrush!.width}
                      onChange={(e) => {
                        canvas.freeDrawingBrush!.width = parseInt(e.target.value);
                        activeObject?.set("range", parseFloat(e.target.value));
                        canvas?.renderAll();
                        forceUpdate();
                        debounceSaveState();
                      }}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm">Brush Color</label>
                    <input
                      type="color"
                      value={canvas.freeDrawingBrush!.color as string}
                      onChange={(e) => {
                        canvas.freeDrawingBrush!.color = e.target.value;
                        activeObject?.set("color", e.target.value);
                        canvas?.renderAll();
                        forceUpdate();
                        debounceSaveState();
                      }}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            )}
            {activeObject && activeObject.type === "image" && (
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Image Filters</h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm">Brightness</label>
                    <input
                      type="range"
                      min="-1"
                      max="1"
                      step="0.1"
                      value={filterOptions.brightness}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setFilterOptions({ ...filterOptions, brightness: val });
                        applyFilter("brightness", val);
                         canvas?.renderAll();
                        forceUpdate();
                        debounceSaveState();
                      }}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm">Contrast</label>
                    <input
                      type="range"
                      min="-1"
                      max="1"
                      step="0.1"
                      value={filterOptions.contrast}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setFilterOptions({ ...filterOptions, contrast: val });
                        applyFilter("contrast", val);
                        canvas?.renderAll();
                        forceUpdate();
                        debounceSaveState();
                      }}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm">Saturation</label>
                    <input
                      type="range"
                      min="-1"
                      max="1"
                      step="0.1"
                      value={filterOptions.saturation}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setFilterOptions({ ...filterOptions, saturation: val });
                        applyFilter("saturation", val);
                        canvas?.renderAll();
                        forceUpdate();
                        debounceSaveState();
                      }}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            )}
            {activeObject && activeObject.type === "textbox" && (
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Text Properties</h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm">Font Family</label>
                    <select
                      value={(activeObject as fabric.Textbox).fontFamily}
                      onChange={(e) => {
                        (activeObject as fabric.Textbox).set("fontFamily", e.target.value);
                        canvas?.renderAll();
                        forceUpdate();
                        debounceSaveState();
                      }}
                      className="w disponível-full p-1 border rounded"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Verdana">Verdana</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm">Font Size</label>
                    <input
                      type="number"
                      value={(activeObject as fabric.Textbox).fontSize}
                      onChange={(e) => {
                        (activeObject as fabric.Textbox).set("fontSize", parseInt(e.target.value));
                        canvas?.renderAll();
                        forceUpdate();
                        debounceSaveState();
                      }}
                      className="w-full p-1 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm">Color</label>
                    <input
                      type="color"
                      value={(activeObject as fabric.Textbox).fill as string}
                      onChange={(e) => {
                        (activeObject as fabric.Textbox).set("fill", e.target.value);
                        canvas?.renderAll();
                        forceUpdate();
                        debounceSaveState();
                      }}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm">Background</label>
                    <input
                      type="color"
                      value={(activeObject as fabric.Textbox).backgroundColor as string || "#ffffff"}
                      onChange={(e) => {
                        (activeObject as fabric.Textbox).set("backgroundColor", e.target.value);
                        canvas?.renderAll();
                        forceUpdate();
                        debounceSaveState();
                      }}
                      className="w-full"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={(activeObject as fabric.Textbox).fontWeight === "bold"}
                      onChange={(e) => {
                        (activeObject as fabric.Textbox).set("fontWeight", e.target.checked ? "bold" : "normal");
                        canvas?.renderAll();
                        forceUpdate();
                        debounceSaveState();
                      }}
                    />
                    <label>Bold</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={(activeObject as fabric.Textbox).fontStyle === "italic"}
                      onChange={(e) => {
                        (activeObject as fabric.Textbox).set("fontStyle", e.target.checked ? "italic" : "normal");
                        canvas?.renderAll();
                        forceUpdate();
                        debounceSaveState();
                      }}
                    />
                    <label>Italic</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={(activeObject as fabric.Textbox).underline}
                      onChange={(e) => {
                        (activeObject as fabric.Textbox).set("underline", e.target.checked);
                        canvas?.renderAll();
                        forceUpdate();
                        debounceSaveState();
                      }}
                    />
                    <label>Underline</label>
                  </div>
                  <div>
                    <label className="block text-sm">Text Alignment</label>
                    <div className="flex space-x-2 mt-1">
                      <button
                        className={`px-2 py-1 border ${(activeObject as fabric.Textbox).textAlign === "left" ? "bg-blue-200" : "bg-gray-100"}`}
                        onClick={() => alignText("left")}
                      >
                        Left
                      </button>
                      <button
                        className={`px-2 py-1 border ${(activeObject as fabric.Textbox).textAlign === "center" ? "bg-blue-200" : "bg-gray-100"}`}
                        onClick={() => alignText("center")}
                      >
                        Center
                      </button>
                      <button
                        className={`px-2 py-1 border ${(activeObject as fabric.Textbox).textAlign === "right" ? "bg-blue-200" : "bg-gray-100"}`}
                        onClick={() => alignText("right")}
                      >
                        Right
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeObject && (activeObject.type === "rect" || activeObject.type === "circle" || activeObject.type === "triangle" || activeObject.type === "polygon") && (
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Shape Properties</h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm">Fill Color</label>
                    <input
                      type="color"
                      value={activeObject.fill as string}
                      onChange={(e) => {
                        activeObject.set("fill", e.target.value);
                        canvas?.renderAll();
                        forceUpdate();
                        debounceSaveState();
                      }}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm">Stroke Color</label>
                    <input
                      type="color"
                      value={activeObject.stroke as string || "#000000"}
                      onChange={(e) => {
                        activeObject.set("stroke", e.target.value);
                        canvas?.renderAll();
                        forceUpdate();
                        debounceSaveState();
                      }}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm">Stroke Width</label>
                    <input
                      type="number"
                      value={activeObject.strokeWidth || 0}
                      onChange={(e) => {
                        activeObject.set("strokeWidth", parseInt(e.target.value));
                        canvas?.renderAll();
                        forceUpdate();
                        debounceSaveState();
                      }}
                      className="w-full p-1 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm">Opacity</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={activeObject.opacity || 1}
                      onChange={(e) => {
                        activeObject.set("opacity", parseFloat(e.target.value));
                        canvas?.renderAll();
                        forceUpdate();
                        debounceSaveState();
                      }}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            )}
            {activeObject && activeObject.type === "path" && (
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Path Properties</h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm">Stroke Color</label>
                    <input
                      type="color"
                      value={activeObject.stroke as string || "#000000"}
                      onChange={(e) => {
                        activeObject.set("stroke", e.target.value);
                        canvas?.renderAll();
                        forceUpdate();
                        debounceSaveState();
                      }}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm">Stroke Width</label>
                    <input
                      type="number"
                      value={activeObject.strokeWidth || 1}
                      onChange={(e) => {
                        activeObject.set("strokeWidth", parseInt(e.target.value));
                        canvas?.renderAll();
                        forceUpdate();
                        debounceSaveState();
                      }}
                      className="w-full p-1 border rounded"
                    />
                  </div>
                </div>
              </div>
            )}
            {activeObject && (
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Common Properties</h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm">Opacity</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={activeObject.opacity || 1}
                      onChange={(e) => {
                        activeObject.set("opacity", parseFloat(e.target.value));
                        canvas?.renderAll();
                        forceUpdate();
                        debounceSaveState();
                      }}
                      className="w-full"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        if (activeObject && canvas) {
                          canvas.bringObjectForward(activeObject);
                          canvas.renderAll();
                          debounceSaveState();
                        }
                      }}
                    >
                      Bring Forward
                    </button>
                    <button
                      onClick={() => {
                        if (activeObject && canvas) {
                          canvas.sendObjectBackwards(activeObject);
                          canvas.renderAll();
                          debounceSaveState();
                        }
                      }}
                    >
                      Send Backward
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Editor;