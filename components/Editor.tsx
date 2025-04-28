// components/Editor.tsx
"use client";

import React, { useEffect, useReducer, useRef, useState } from "react";
import * as fabric from "fabric";
import { ChangeEvent } from 'react'






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
const [canvasState, setCanvasState] = useState<any>(null);
  const [activeObject, setActiveObject] = useState<fabric.Object | null>(null);
  const [filterOptions, setFilterOptions] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 0,
  });
  const [drawingMode, setDrawingMode] = useState(false);

  const handleZoom = (newZoom: number) => {
    if (canvas) { // Assuming 'canvas' is your Fabric.js canvas instance
      canvas.setZoom(newZoom);
      canvas.setWidth(canvasWidth * newZoom);  // canvasWidth is your base width
      canvas.setHeight(canvasHeight * newZoom); // canvasHeight is your base height
      canvas.renderAll();
    }
    setZoom(newZoom);
  };

  const updateCanvasState = () => {
    if (canvas) {
      setCanvasState(canvas.toJSON());
    }
  };


  // Initialize canvas
  useEffect(() => {
    if (canvasRef.current) {
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        width: canvasWidth,
        height: canvasHeight,
        backgroundColor: "#ffffff",
        isDrawingMode: false,
      });
  
      setCanvas(fabricCanvas);
  
      if (initialData) {
        const parsedData = JSON.parse(initialData);
        setCanvasWidth(parsedData.canvasWidth || 800);
        setCanvasHeight(parsedData.canvasHeight || 600);
        fabricCanvas.loadFromJSON(parsedData, () => {
          fabricCanvas.renderAll();
        });
      }
  
      fabricCanvas.on("selection:created", (e) => {
        setActiveObject(fabricCanvas.getActiveObject() || null);
      });
      fabricCanvas.on("selection:updated", (e) => {
        setActiveObject(fabricCanvas.getActiveObject() || null);
      });
      fabricCanvas.on("selection:cleared", () => {
        setActiveObject(null);
      });
      fabricCanvas.on('object:modified', () => {
        setActiveObject(fabricCanvas.getActiveObject() || null);
      });
  
      return () => {
        fabricCanvas.dispose();
      };
    }
  }, [canvasWidth, canvasHeight, initialData]); // Add dependencies

  const forceUpdate = useReducer(() => ({}), {})[1];


  const updateCanvasSize = (newWidth: number, newHeight: number) => {
    if (canvas) {
      canvas.setDimensions({ width: newWidth, height: newHeight });
      canvas.renderAll();
    }
    setCanvasWidth(newWidth);
    setCanvasHeight(newHeight);
  };

  const presetSizes = [
    // Facebook
    { name: "Facebook Post", width: 1200, height: 630 },
    { name: "Facebook Cover", width: 820, height: 312 },
    { name: "Facebook Profile Picture", width: 180, height: 180 },
    { name: "Facebook Story", width: 1080, height: 1920 },
    { name: "Facebook Ad (Single Image)", width: 1200, height: 628 },
  
    // Instagram
    { name: "Instagram Post (Square)", width: 1080, height: 1080 },
    { name: "Instagram Story", width: 1080, height: 1920 },
    { name: "Instagram Profile Picture", width: 110, height: 110 },
    { name: "Instagram Landscape Post", width: 1080, height: 566 },
    { name: "Instagram Portrait Post", width: 1080, height: 1350 },
  
    // LinkedIn
    { name: "LinkedIn Post", width: 1200, height: 627 },
    { name: "LinkedIn Cover", width: 1584, height: 396 },
    { name: "LinkedIn Profile Picture", width: 400, height: 400 },
    { name: "LinkedIn Company Cover", width: 1128, height: 191 },
  
    // Bonus: YouTube (if needed)
    { name: "YouTube Thumbnail", width: 1280, height: 720 },
  ];
  // Update drawing mode
  useEffect(() => {
    if (canvas && drawingMode) {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.width = 5;
      canvas.freeDrawingBrush.color = '#000000';
      canvas.renderAll();
    } else if (canvas) {
      canvas.isDrawingMode = false;
      canvas.renderAll();
    }
  }, [canvas, drawingMode]);
  // Save canvas state
  const handleSave = () => {
    if (canvas && onSave) {
      const json = canvas.toJSON();
      json.canvasWidth = canvasWidth;
      json.canvasHeight = canvasHeight;
      onSave(JSON.stringify(json));
    }
  };



  const loadFabricImage = (url: string): Promise<fabric.Image> => {
    return new Promise((resolve, reject) => {
      fabric.Image.fromURL(
        url,
        ((img: fabric.Image | null) => {
          img ? resolve(img) : reject(new Error("Failed to load image"));
        }) as fabric.IImageOptionsCallback,
        {
          crossOrigin: 'anonymous',
          // Other options...
        } as fabric.IImageOptions
      );
    });
  };
  
  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !projectId) return
    const file = e.target.files[0]
    const form = new FormData()
    form.append('file', file)
  
    const res = await fetch(`/api/projects/${projectId}/assets`, {
      method: 'POST',
      body: form,
    })
    if (!res.ok) {
      console.error(await res.text())
      return
    }
  
    const { url } = await res.json()
    try {
      const img = await loadFabricImage(url);
      img.set({
        left: 100,
        top: 100,
        scaleX: 0.5, // Adjust these values as needed
        scaleY: 0.5
      });
      canvas?.add(img);
      canvas?.setActiveObject(img);
      canvas?.requestRenderAll();
      console.log('Canvas Objects:', canvas?.getObjects()); // Check if image is listed
    } catch (err) {
      console.error("Error loading image:", err);
    }
    
  }
  





  // Add text, shapes, etc. (unchanged)
  const addText = () => {
    if (canvas) {
      const text = new fabric.Textbox("Edit this text", {
        left: 100,
        top: 100,
        fontFamily: "Arial",
        fill: "#000000",
        fontSize: 20,
      });
      canvas.add(text);
      canvas.setActiveObject(text);
      setActiveObject(text);
      canvas.renderAll();
    }
  };

  const addRectangle = () => {
    if (canvas) {
      const rect = new fabric.Rect({
        left: 100,
        top: 100,
        fill: "#FF5733",
        width: 100,
        height: 100,
      });
      canvas.add(rect);
      canvas.setActiveObject(rect);
      setActiveObject(rect);
      canvas.renderAll();
    }
  };

  const addCircle = () => {
    if (canvas) {
      const circle = new fabric.Circle({
        left: 100,
        top: 100,
        fill: "#33A1FF",
        radius: 50,
      });
      canvas.add(circle);
      canvas.setActiveObject(circle);
      setActiveObject(circle);
      canvas.renderAll();
    }
  };

  const addTriangle = () => {
    if (canvas) {
      const triangle = new fabric.Triangle({
        left: 100,
        top: 100,
        fill: "#33FF57",
        width: 100,
        height: 100,
      });
      canvas.add(triangle);
      canvas.setActiveObject(triangle);
      setActiveObject(triangle);
      canvas.renderAll();
    }
  };

  const addPolygon = () => {
    if (canvas) {
      const polygon = new fabric.Polygon(
        [
          { x: 50, y: 0 },
          { x: 100, y: 50 },
          { x: 75, y: 100 },
          { x: 25, y: 100 },
          { x: 0, y: 50 },
        ],
        {
          left: 100,
          top: 100,
          fill: "#FF33A1",
        }
      );
      canvas.add(polygon);
      canvas.setActiveObject(polygon);
      setActiveObject(polygon);
      canvas.renderAll();
    }
  };

  const toggleDrawingMode = () => {
    setDrawingMode(prev => {
      if (canvas) {
        canvas.isDrawingMode = !prev;
        if (!prev) {
          canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
          canvas.freeDrawingBrush.width = 5;
          canvas.freeDrawingBrush.color = '#000000';
        }
      }
      return !prev;
    });
  };

 
  // Apply filter to image
  const applyFilter = (filter: string, value: number) => {
    if (canvas && activeObject && activeObject.type === 'image') {
      const imgObj = activeObject as fabric.Image;
      imgObj.filters = [];
      
      switch (filter) {
        case 'brightness':
          imgObj.filters.push(new fabric.Image.filters.Brightness({ brightness: value }));
          break;
        case 'contrast':
          imgObj.filters.push(new fabric.Image.filters.Contrast({ contrast: value }));
          break;
        case 'saturation':
          imgObj.filters.push(new fabric.Image.filters.Saturation({ saturation: value }));
          break;
      }
      
      imgObj.applyFilters();
      canvas.renderAll();
    }
  };

  // Text formatting functions
  const formatText = (format: string) => {
    if (canvas && activeObject && activeObject.type === 'textbox') {
      const textbox = activeObject as fabric.Textbox;
      
      switch (format) {
        case 'bold':
          textbox.set('fontWeight', textbox.fontWeight === 'bold' ? 'normal' : 'bold');
          break;
        case 'italic':
          textbox.set('fontStyle', textbox.fontStyle === 'italic' ? 'normal' : 'italic');
          break;
        case 'underline':
          textbox.set('underline', !textbox.underline);
          break;
      }
      
      canvas.renderAll();
    }
  };
  type TextboxTextAlign = 'left' | 'center' | 'right';

  // Text alignment functions
  const alignText = (alignment: string) => {
    if (canvas && activeObject && activeObject.type === 'textbox') {
      const textbox = activeObject as fabric.Textbox;
      textbox.set('textAlign', alignment as TextboxTextAlign);
      canvas.renderAll();
    }
  };

  // Object alignment functions
  const alignObject = (alignment: string) => {
    if (canvas && activeObject) {
      const obj = activeObject;
      
      switch (alignment) {
        case 'left':
          obj.set('left', 0);
          break;
        case 'center':
          obj.set('left', (canvas.width! - obj.width! * obj.scaleX!) / 2);
          break;
        case 'right':
          obj.set('left', canvas.width! - obj.width! * obj.scaleX!);
          break;
        case 'top':
          obj.set('top', 0);
          break;
        case 'middle':
          obj.set('top', (canvas.height! - obj.height! * obj.scaleY!) / 2);
          break;
        case 'bottom':
          obj.set('top', canvas.height! - obj.height! * obj.scaleY!);
          break;
      }
      
      canvas.renderAll();
    }
  };

  // Delete selected object
  const deleteObject = () => {
    if (canvas && activeObject) {
      canvas.remove(activeObject);
      setActiveObject(null);
      canvas.renderAll();
    }
  };

  // Clone selected object
  const cloneObject = async () => {
    if (canvas && activeObject) {
      const cloned = await (activeObject as fabric.FabricObject).clone();
      cloned.set({
        left: (activeObject.left || 0) + 10,
        top: (activeObject.top || 0) + 10,
      });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      setActiveObject(cloned);
      canvas.renderAll();
    }
  };
 
  
  

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-gray-100 p-4 border-b border-gray-300">
        <div className="flex flex-wrap gap-2">
        <div className="inline-block">
  <input
    type="file"
    accept="image/*"
    onChange={handleImageUpload}
    className="block text-xs text-gray-600
               file:mr-2 file:py-1 file:px-2
               file:rounded file:border-0
               file:text-xs file:font-semibold
               file:bg-green-50 file:text-green-700
               hover:file:bg-green-100"
  />
</div>
          <button 
            className="bg-blue-500 text-white px-3 py-1 rounded" 
            onClick={addText}
          >
            Add Text
          </button>
          <button 
            className="bg-blue-500 text-white px-3 py-1 rounded" 
            onClick={addRectangle}
          >
            Add Rectangle
          </button>
          <button 
            className="bg-blue-500 text-white px-3 py-1 rounded" 
            onClick={addCircle}
          >
            Add Circle
          </button>
          <button 
            className="bg-blue-500 text-white px-3 py-1 rounded" 
            onClick={addTriangle}
          >
            Add Triangle
          </button>
          <button 
            className="bg-blue-500 text-white px-3 py-1 rounded" 
            onClick={addPolygon}
          >
            Add Polygon
          </button>
          <button 
            className={`${drawingMode ? 'bg-green-500' : 'bg-blue-500'} text-white px-3 py-1 rounded`} 
            onClick={toggleDrawingMode}
          >
            {drawingMode ? 'Exit Drawing' : 'Pen Tool'}
          </button>
          
          
<div className="flex gap-2 items-center mt-4">
  <button
    onClick={() => handleZoom(zoom - 0.1)}
    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
  >
    Zoom Out
  </button>
  <span>{(zoom * 100).toFixed(0)}%</span>
  <button
    onClick={() => handleZoom(zoom + 0.1)}
    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
  >
    Zoom In
  </button>
</div>
{/* Canvas Size Controls */}
<div className="mt-4">
    <h3 className="text-lg font-semibold mb-2">Canvas Size</h3>
    <div className="flex flex-wrap gap-4">
      <div className="flex gap-2 items-center">
        <input
          type="number"
          value={canvasWidth}
          onChange={(e) => setCanvasWidth(parseInt(e.target.value) || 800)}
          className="p-2 border rounded w-24"
          placeholder="Width"
        />
        <span>x</span>
        <input
          type="number"
          value={canvasHeight}
          onChange={(e) => setCanvasHeight(parseInt(e.target.value) || 600)}
          className="p-2 border rounded w-24"
          placeholder="Height"
        />
        <button
          onClick={() => updateCanvasSize(canvasWidth, canvasHeight)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Apply
        </button>
      </div>
    </div>
    <div className="mt-2 flex flex-wrap gap-2">
  {presetSizes.map((preset) => (
    <button
      key={preset.name}
      onClick={() => updateCanvasSize(preset.width, preset.height)}
      className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
    >
      {preset.name}
    </button>
  ))}
</div>
  </div>
          <button 
            className="bg-purple-500 text-white px-3 py-1 rounded" 
            onClick={cloneObject}
            disabled={!activeObject}
          >
            Clone
          </button>
          <button 
            className="bg-red-500 text-white px-3 py-1 rounded" 
            onClick={deleteObject}
            disabled={!activeObject}
          >
            Delete
          </button>
          <button 
            className="bg-green-500 text-white px-3 py-1 rounded" 
            onClick={handleSave}
          >
            Save
          </button>
        </div>
        
        {activeObject && activeObject.type === 'textbox' && (
          <div className="mt-2 flex flex-wrap gap-2">
            <button 
              className="bg-gray-200 px-3 py-1 rounded font-bold" 
              onClick={() => formatText('bold')}
            >
              B
            </button>
            <button 
              className="bg-gray-200 px-3 py-1 rounded italic" 
              onClick={() => formatText('italic')}
            >
              I
            </button>
            <button 
              className="bg-gray-200 px-3 py-1 rounded underline" 
              onClick={() => formatText('underline')}
            >
              U
            </button>
            <button 
              className="bg-gray-200 px-3 py-1 rounded" 
              onClick={() => alignText('left')}
            >
              ←
            </button>
            <button 
              className="bg-gray-200 px-3 py-1 rounded" 
              onClick={() => alignText('center')}
            >
              ↔
            </button>
            <button 
              className="bg-gray-200 px-3 py-1 rounded" 
              onClick={() => alignText('right')}
            >
              →
            </button>
          </div>
        )}
        
        {activeObject && (
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="text-sm font-medium">Align Object:</span>
            <button 
              className="bg-gray-200 px-2 py-1 rounded text-xs" 
              onClick={() => alignObject('left')}
            >
              Left
            </button>
            <button 
              className="bg-gray-200 px-2 py-1 rounded text-xs" 
              onClick={() => alignObject('center')}
            >
              Center
            </button>
            <button 
              className="bg-gray-200 px-2 py-1 rounded text-xs" 
              onClick={() => alignObject('right')}
            >
              Right
            </button>
            <button 
              className="bg-gray-200 px-2 py-1 rounded text-xs" 
              onClick={() => alignObject('top')}
            >
              Top
            </button>
            <button 
              className="bg-gray-200 px-2 py-1 rounded text-xs" 
              onClick={() => alignObject('middle')}
            >
              Middle
            </button>
            <button 
              className="bg-gray-200 px-2 py-1 rounded text-xs" 
              onClick={() => alignObject('bottom')}
            >
              Bottom
            </button>
          </div>
        )}
      </div>
      
      <div className="flex flex-1">
      <div className="w-3/4 overflow-auto flex justify-center items-center bg-gray-200 p-4">
  <canvas ref={canvasRef} />
</div>
        
        <div className="w-1/4 p-4 bg-white border-l border-gray-300 overflow-auto">
          <h3 className="font-bold text-lg mb-4">Properties</h3>
          
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
                      activeObject?.set('range', parseFloat(e.target.value));
                      canvas?.renderAll();
                      forceUpdate();
                      updateCanvasState();
                      
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
                      activeObject?.set('color', parseFloat(e.target.value));
                      canvas?.renderAll();
                      forceUpdate();
                      updateCanvasState();
                    }}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}
          
          {activeObject && activeObject.type === 'image' && (
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
                      activeObject?.set('range', parseFloat(e.target.value));
                      canvas?.renderAll();
                      forceUpdate();
                      updateCanvasState();
                      setFilterOptions({...filterOptions, brightness: val});
                      applyFilter('brightness', val);
                      
                      
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
                      activeObject?.set('range', parseFloat(e.target.value));
                      canvas?.renderAll();
                      forceUpdate();
                      updateCanvasState();
                      setFilterOptions({...filterOptions, contrast: val});
                      applyFilter('contrast', val);
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
                      activeObject?.set('range', parseFloat(e.target.value));
                      canvas?.renderAll();
                      forceUpdate();
                      updateCanvasState();
                      setFilterOptions({...filterOptions, saturation: val});
                      applyFilter('saturation', val);
                    }}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}
          
          {activeObject && activeObject.type === 'textbox' && (
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Text Properties</h4>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm">Font Family</label>
                  <select
                    value={(activeObject as fabric.Textbox).fontFamily}
                    onChange={(e) => {
                      (activeObject as fabric.Textbox).set('fontFamily', e.target.value);
                      forceUpdate();
                      updateCanvasState();
                      canvas?.renderAll();
                    }}
                    className="w-full p-1 border rounded"
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
                      (activeObject as fabric.Textbox).set('fontSize', parseInt(e.target.value));
                      (activeObject as fabric.Textbox).set('fontSize', parseInt(e.target.value));
                      canvas?.renderAll();
                      updateCanvasState(); // Add these
                      forceUpdate();
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
                      (activeObject as fabric.Textbox).set('fill', e.target.value);
                      (activeObject as fabric.Textbox).set('fill', e.target.value);
 
  updateCanvasState(); // Add these
  forceUpdate();
                      canvas?.renderAll();
                    }}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm">Background</label>
                  <input
                    type="color"
                    value={(activeObject as fabric.Textbox).backgroundColor as string || '#ffffff'}
                    onChange={(e) => {
                      (activeObject as fabric.Textbox).set('backgroundColor', e.target.value);
                      (activeObject as fabric.Textbox).set('color', e.target.value);
                      updateCanvasState(); // Add these
                      forceUpdate();
                      canvas?.renderAll();
                    }}
                    className="w-full"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={(activeObject as fabric.Textbox).fontWeight === 'bold'}
                    onChange={(e) => {
                      (activeObject as fabric.Textbox).set('fontWeight', e.target.checked ? 'bold' : 'normal');
                      canvas?.renderAll();
                    }}
                  />
                  <label>Bold</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={(activeObject as fabric.Textbox).fontStyle === 'italic'}
                    onChange={(e) => {
                      (activeObject as fabric.Textbox).set('fontStyle', e.target.checked ? 'italic' : 'normal');
                      canvas?.renderAll();
                    }}
                  />
                  <label>Italic</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={(activeObject as fabric.Textbox).underline}
                    onChange={(e) => {
                      (activeObject as fabric.Textbox).set('underline', e.target.checked);
                      canvas?.renderAll();
                    }}
                  />
                  <label>Underline</label>
                </div>
                <div>
                  <label className="block text-sm">Text Alignment</label>
                  <div className="flex space-x-2 mt-1">
                    <button
                      className={`px-2 py-1 border ${(activeObject as fabric.Textbox).textAlign === 'left' ? 'bg-blue-200' : 'bg-gray-100'}`}
                      onClick={() => alignText('left')}
                    >
                      Left
                    </button>
                    <button
                      className={`px-2 py-1 border ${(activeObject as fabric.Textbox).textAlign === 'center' ? 'bg-blue-200' : 'bg-gray-100'}`}
                      onClick={() => alignText('center')}
                    >
                      Center
                    </button>
                    <button
                      className={`px-2 py-1 border ${(activeObject as fabric.Textbox).textAlign === 'right' ? 'bg-blue-200' : 'bg-gray-100'}`}
                      onClick={() => alignText('right')}
                    >
                      Right
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeObject && (activeObject.type === 'rect' || activeObject.type === 'circle' || activeObject.type === 'triangle' || activeObject.type === 'polygon') && (
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Shape Properties</h4>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm">Fill Color</label>
                  <input
                    type="color"
                    value={activeObject.fill as string}
                    onChange={(e) => {
                      activeObject.set('fill', e.target.value);
                      
                      canvas?.renderAll();
                      updateCanvasState(); // Add these
                      forceUpdate();
                    }}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm">Stroke Color</label>
                  <input
                    type="color"
                    value={activeObject.stroke as string || '#000000'}
                    onChange={(e) => {
                      activeObject.set('stroke', e.target.value);
                      updateCanvasState(); // Add these
                      forceUpdate();
                      canvas?.renderAll();
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
                      activeObject.set('strokeWidth', parseInt(e.target.value));
                      
                      canvas?.renderAll();
                      updateCanvasState(); // Add these
                      forceUpdate();
                      canvas?.renderAll();
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
                      activeObject.set('opacity', parseFloat(e.target.value));
                     
                      canvas?.renderAll();
                      updateCanvasState(); // Add this
                      forceUpdate(); // Add this
                      
                    }}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}
          
          {activeObject && activeObject.type === 'path' && (
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Path Properties</h4>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm">Stroke Color</label>
                  <input
                    type="color"
                    value={activeObject.stroke as string || '#000000'}
                    onChange={(e) => {
                      activeObject.set('stroke', e.target.value);
                      updateCanvasState(); // Add these
                      forceUpdate();
                      canvas?.renderAll();
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
                      activeObject.set('strokeWidth', parseInt(e.target.value));
                      canvas?.renderAll();
                      updateCanvasState(); // Add these
                      forceUpdate();
                      
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
                      activeObject.set('opacity', parseFloat(e.target.value));
                      canvas?.renderAll();
  updateCanvasState(); // Add this
  forceUpdate(); // Add this
                     
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
    }
  }}
>
  Send Backward
</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Editor;
<canvas></canvas>