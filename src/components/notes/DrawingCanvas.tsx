import React, { useRef, useEffect } from 'react';
import * as fabric from 'fabric';
import { DrawingMode } from '@/store/drawingStore';

interface DrawingCanvasProps {
  width: number;
  height: number;
  mode: DrawingMode;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ width, height, mode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        isDrawingMode: true,
      });
      fabricCanvasRef.current = canvas;

      // Set initial brush
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = '#000000';
      canvas.freeDrawingBrush.width = 2;

      return () => {
        canvas.dispose();
        fabricCanvasRef.current = null;
      };
    }
  }, []);

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Reset listeners and properties
    canvas.off('mouse:down');
    canvas.isDrawingMode = ['pen', 'highlighter'].includes(mode ?? '');

    if (mode === 'pen') {
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = '#000000';
      canvas.freeDrawingBrush.width = 2;
    } else if (mode === 'highlighter') {
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = 'rgba(255, 255, 0, 0.5)';
      canvas.freeDrawingBrush.width = 20;
    } else if (['rectangle', 'circle', 'arrow', 'line'].includes(mode ?? '')) {
      addShape(mode as 'rectangle' | 'circle' | 'arrow' | 'line');
    } else if (mode === 'sticky') {
      addStickyNote();
    }
  }, [mode]);

  const addShape = (shapeType: 'rectangle' | 'circle' | 'arrow' | 'line') => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    let shape;
    if (shapeType === 'rectangle') {
      shape = new fabric.Rect({
        left: 100,
        top: 100,
        fill: 'transparent',
        stroke: 'black',
        strokeWidth: 2,
        width: 100,
        height: 100,
      });
    } else if (shapeType === 'circle') {
      shape = new fabric.Circle({
        left: 100,
        top: 100,
        fill: 'transparent',
        stroke: 'black',
        strokeWidth: 2,
        radius: 50,
      });
    } else if (shapeType === 'line') {
        shape = new fabric.Line([50, 100, 200, 100], {
            stroke: 'black',
            strokeWidth: 2,
        });
    } else if (shapeType === 'arrow') {
        const line = new fabric.Line([50, 100, 200, 100], {
            stroke: 'black',
            strokeWidth: 2,
        });
        const triangle = new fabric.Triangle({
            left: 200,
            top: 95,
            angle: 90,
            width: 10,
            height: 10,
            fill: 'black',
        });
        shape = new fabric.Group([line, triangle], { left: 100, top: 100 });
    }

    if (shape) {
      canvas.add(shape);
    }
  };

  const addStickyNote = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const note = new fabric.Rect({
      left: 150,
      top: 150,
      fill: '#FFFFA5',
      width: 150,
      height: 150,
      stroke: '#E6B325',
      strokeWidth: 1,
      shadow: new fabric.Shadow({
        color: 'rgba(0,0,0,0.2)',
        blur: 5,
        offsetX: 2,
        offsetY: 2,
      }),
    });

    const text = new fabric.Textbox('Click to edit', {
      left: 160,
      top: 160,
      width: 130,
      fontSize: 16,
      fontFamily: 'Arial',
    });

    const group = new fabric.Group([note, text], {});
    canvas.add(group);
    canvas.renderAll();
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full z-10" style={{ pointerEvents: 'none' }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ pointerEvents: 'auto' }} />
    </div>
  );
};

export default DrawingCanvas;
