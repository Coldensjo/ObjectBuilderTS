import React, { useRef, useEffect, useState } from 'react';
import { useAppStateContext } from '../contexts/AppStateContext';
import './PreviewCanvas.css';

interface PreviewCanvasProps {
  thingData?: any;
  width?: number;
  height?: number;
  frameGroupType?: number; // FrameGroupType (0 = DEFAULT, etc.)
  patternX?: number;
  patternY?: number;
  patternZ?: number;
  animate?: boolean;
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  thingData,
  width = 256,
  height = 256,
  frameGroupType = 0, // DEFAULT
  patternX = 0,
  patternY = 0,
  patternZ = 0,
  animate = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!thingData || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderThing(ctx, thingData, width, height, frameGroupType, patternX, patternY, patternZ, currentFrame);
  }, [thingData, width, height, frameGroupType, patternX, patternY, patternZ, currentFrame]);

  // Animation effect
  useEffect(() => {
    if (!animate || !thingData) {
      setIsAnimating(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setCurrentFrame(0);
      return;
    }

    // Get frame group to determine animation properties
    const frameGroup = thingData.thing?.frameGroups?.[frameGroupType];
    if (!frameGroup || !frameGroup.isAnimation || frameGroup.frames <= 1) {
      setIsAnimating(false);
      setCurrentFrame(0);
      return;
    }

    setIsAnimating(true);
    let frame = frameGroup.startFrame || 0;
    let lastTime = performance.now();
    let accumulatedTime = 0;
    let loopCount = 0;
    const maxLoops = frameGroup.loopCount > 0 ? frameGroup.loopCount : Infinity;

    const animateFrame = (timestamp: number) => {
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;
      accumulatedTime += deltaTime;

      // Get frame duration
      let duration = 100; // Default duration
      if (frameGroup.frameDurations && frameGroup.frameDurations[frame]) {
        const frameDuration = frameGroup.frameDurations[frame];
        // Use average of min and max, or random between them for asynchronous mode
        // AnimationMode.ASYNCHRONOUS = 0, SYNCHRONOUS = 1
        if (frameGroup.animationMode === 0) { // ASYNCHRONOUS
          const min = frameDuration.minimum || 100;
          const max = frameDuration.maximum || 100;
          duration = min + Math.random() * (max - min);
        } else { // SYNCHRONOUS
          duration = ((frameDuration.minimum || 100) + (frameDuration.maximum || 100)) / 2;
        }
      }

      if (accumulatedTime >= duration) {
        accumulatedTime = 0;
        frame = (frame + 1) % frameGroup.frames;
        
        // Check if we've completed a loop
        if (frame === 0) {
          loopCount++;
          if (loopCount >= maxLoops) {
            // Stop animation after max loops
            setIsAnimating(false);
            if (animationFrameRef.current) {
              cancelAnimationFrame(animationFrameRef.current);
              animationFrameRef.current = null;
            }
            return;
          }
        }
        
        setCurrentFrame(frame);
      }

      animationFrameRef.current = requestAnimationFrame(animateFrame);
    };

    animationFrameRef.current = requestAnimationFrame(animateFrame);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [animate, thingData, frameGroupType]);

  const renderThing = (
    ctx: CanvasRenderingContext2D,
    thingData: any,
    canvasWidth: number,
    canvasHeight: number,
    groupType: number,
    px: number,
    py: number,
    pz: number,
    frame: number
  ) => {
    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Set background
    ctx.fillStyle = '#636363';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    if (!thingData) {
      renderPlaceholder(ctx, canvasWidth, canvasHeight);
      return;
    }

    // Try to get frame group from thing
    const frameGroup = thingData.thing?.frameGroups?.[groupType];
    if (!frameGroup) {
      // Fallback to simple sprite rendering
      if (thingData.sprites && thingData.sprites.length > 0) {
        renderSprites(ctx, thingData.sprites, canvasWidth, canvasHeight);
      } else if (thingData.pixels) {
        renderSpritePixels(ctx, thingData.pixels, canvasWidth, canvasHeight);
      } else {
        renderPlaceholder(ctx, canvasWidth, canvasHeight);
      }
      return;
    }

    // Get sprites for this frame group
    let groupSprites: any[] = [];
    if (thingData.sprites) {
      if (thingData.sprites instanceof Map) {
        // If it's a Map, get sprites for the frame group type
        groupSprites = thingData.sprites.get(groupType) || [];
      } else if (Array.isArray(thingData.sprites)) {
        // If it's an array, use it directly (legacy format)
        groupSprites = thingData.sprites;
      } else if (typeof thingData.sprites === 'object') {
        // If it's an object with numeric keys
        groupSprites = thingData.sprites[groupType] || thingData.sprites[0] || [];
      }
    }
    
    if (!groupSprites || groupSprites.length === 0) {
      renderPlaceholder(ctx, canvasWidth, canvasHeight);
      return;
    }

    // Render multi-sprite composition
    renderFrameGroup(ctx, frameGroup, groupSprites, canvasWidth, canvasHeight, px, py, pz, frame);
  };

  const renderFrameGroup = (
    ctx: CanvasRenderingContext2D,
    frameGroup: any,
    sprites: any[],
    canvasWidth: number,
    canvasHeight: number,
    px: number,
    py: number,
    pz: number,
    frame: number
  ) => {
    const spriteSize = frameGroup.exactSize || 32;
    const layers = frameGroup.layers || 1;
    const patternX = frameGroup.patternX || 1;
    const patternY = frameGroup.patternY || 1;
    const patternZ = frameGroup.patternZ || 1;
    const frames = frameGroup.frames || 1;

    // Clamp pattern values
    const pxClamped = Math.max(0, Math.min(px, patternX - 1));
    const pyClamped = Math.max(0, Math.min(py, patternY - 1));
    const pzClamped = Math.max(0, Math.min(pz, patternZ - 1));
    const frameClamped = frame % frames;

    // Calculate composition bounds
    const width = frameGroup.width || 1;
    const height = frameGroup.height || 1;
    const totalWidth = width * spriteSize;
    const totalHeight = height * spriteSize;

    // Center the composition on canvas
    const offsetX = (canvasWidth - totalWidth) / 2;
    const offsetY = (canvasHeight - totalHeight) / 2;

    // Helper function to calculate sprite index using FrameGroup formula
    const getSpriteIndex = (w: number, h: number, l: number, px: number, py: number, pz: number, f: number): number => {
      if (typeof frameGroup.getSpriteIndex === 'function') {
        return frameGroup.getSpriteIndex(w, h, l, px, py, pz, f);
      }
      // Fallback calculation using the same formula as FrameGroup.getSpriteIndex
      // Formula: ((((((frame % frames) * patternZ + patternZ) * patternY + patternY) * patternX + patternX) * layers + layer) * height + height) * width + width
      const frameMod = f % frames;
      const step1 = frameMod * patternZ + pz;
      const step2 = step1 * patternY + py;
      const step3 = step2 * patternX + px;
      const step4 = step3 * layers + l;
      const step5 = step4 * height + h;
      const step6 = step5 * width + w;
      return step6;
    };

    // Render each layer (from bottom to top)
    for (let l = 0; l < layers; l++) {
      // Render each sprite in the width x height grid
      // Sprites are drawn bottom-to-top, right-to-left
      for (let w = 0; w < width; w++) {
        for (let h = 0; h < height; h++) {
          // Get sprite index using FrameGroup formula
          const spriteIndex = getSpriteIndex(w, h, l, pxClamped, pyClamped, pzClamped, frameClamped);
          
          // Check if spriteIndex is valid and within bounds
          if (spriteIndex >= 0 && spriteIndex < sprites.length) {
            const spriteData = sprites[spriteIndex];
            if (spriteData) {
              // Handle different sprite data structures
              let pixels: Uint8Array | ArrayBuffer | Buffer | null = null;
              
              if (spriteData.pixels) {
                pixels = spriteData.pixels;
              } else if (spriteData instanceof Uint8Array || spriteData instanceof ArrayBuffer || Buffer.isBuffer(spriteData)) {
                pixels = spriteData;
              } else if (Array.isArray(spriteData)) {
                // If it's an array, try to use it as pixel data
                pixels = new Uint8Array(spriteData);
              }
              
              if (pixels) {
                // Calculate position (sprites are drawn bottom-to-top, right-to-left)
                // In Tibia, sprites are positioned from bottom-right
                const x = offsetX + (width - w - 1) * spriteSize;
                const y = offsetY + (height - h - 1) * spriteSize;
                
                renderSpritePixelsAt(ctx, pixels, x, y, spriteSize);
              }
            }
          }
        }
      }
    }
  };

  const renderSpritePixelsAt = (
    ctx: CanvasRenderingContext2D,
    pixels: Uint8Array | ArrayBuffer | Buffer,
    x: number,
    y: number,
    size: number
  ) => {
    try {
      let pixelData: Uint8Array;
      if (pixels instanceof ArrayBuffer) {
        pixelData = new Uint8Array(pixels);
      } else if (Buffer.isBuffer(pixels)) {
        pixelData = new Uint8Array(pixels.buffer, pixels.byteOffset, pixels.byteLength);
      } else {
        pixelData = pixels;
      }

      // Create ImageData for the sprite
      const imageData = ctx.createImageData(size, size);
      const data = imageData.data;

      // Convert RGBA pixels to ImageData
      const pixelCount = size * size;
      for (let i = 0; i < pixelCount * 4 && i < pixelData.length; i += 4) {
        const idx = i / 4;
        if (idx < data.length / 4) {
          data[i] = pixelData[i] || 0;         // R
          data[i + 1] = pixelData[i + 1] || 0; // G
          data[i + 2] = pixelData[i + 2] || 0; // B
          data[i + 3] = pixelData[i + 3] ?? 255; // A (default to opaque if missing)
        }
      }

      ctx.putImageData(imageData, x, y);
    } catch (error) {
      console.error('Error rendering sprite pixels:', error);
    }
  };

  const renderSpritePixels = (
    ctx: CanvasRenderingContext2D,
    pixels: Uint8Array | ArrayBuffer | Buffer,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    const spriteSize = 32;
    const x = (canvasWidth - spriteSize) / 2;
    const y = (canvasHeight - spriteSize) / 2;
    renderSpritePixelsAt(ctx, pixels, x, y, spriteSize);
  };

  const renderSprites = (
    ctx: CanvasRenderingContext2D,
    sprites: any[],
    canvasWidth: number,
    canvasHeight: number
  ) => {
    // Render all sprites layered on top of each other
    const spriteSize = 32;
    const x = (canvasWidth - spriteSize) / 2;
    const y = (canvasHeight - spriteSize) / 2;

    for (const sprite of sprites) {
      if (sprite && sprite.pixels) {
        renderSpritePixelsAt(ctx, sprite.pixels, x, y, spriteSize);
      }
    }
  };

  const renderPlaceholder = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = '#999999';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('No preview available', width / 2, height / 2);
  };

  return (
    <div className="preview-canvas-container">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="preview-canvas"
      />
      {isAnimating && (
        <div className="preview-animation-indicator" title="Animation playing">
          ●
        </div>
      )}
    </div>
  );
};
