import React, { useRef, useEffect } from 'react';
import './SpriteThumbnail.css';

interface SpriteThumbnailProps {
  pixels?: Uint8Array | ArrayBuffer | any;
  size?: number;
  scale?: number;
  className?: string;
  format?: 'argb' | 'rgba' | 'auto'; // Explicit format, or 'auto' for detection
}

export const SpriteThumbnail: React.FC<SpriteThumbnailProps> = ({
  pixels,
  size = 32,
  scale = 1,
  className = '',
  format = 'auto',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!pixels || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Set background
    ctx.fillStyle = '#636363';
    ctx.fillRect(0, 0, size, size);

    try {
      // Convert various pixel data formats to Uint8Array
      let pixelData: Uint8Array;
      
      if (pixels instanceof ArrayBuffer) {
        pixelData = new Uint8Array(pixels);
      } else if (Buffer.isBuffer && Buffer.isBuffer(pixels)) {
        // Node.js Buffer (shouldn't happen in browser, but handle it)
        pixelData = new Uint8Array(pixels.buffer, pixels.byteOffset, pixels.byteLength);
      } else if (pixels instanceof Uint8Array) {
        pixelData = pixels;
      } else if (pixels && pixels.buffer instanceof ArrayBuffer) {
        // Typed array (Uint8Array, Int8Array, etc.)
        pixelData = new Uint8Array(pixels.buffer, pixels.byteOffset, pixels.byteLength);
      } else if (Array.isArray(pixels)) {
        // Plain array
        pixelData = new Uint8Array(pixels);
      } else {
        console.warn('Unknown pixel data format:', typeof pixels);
        return;
      }
      
      // Check if we have valid pixel data
      if (!pixelData || pixelData.length < 4) {
        return;
      }

      // Create ImageData for the sprite
      const imageData = ctx.createImageData(size, size);
      const data = imageData.data;

      // Convert RGBA pixels to ImageData
      // Sprites are typically 32x32 = 1024 pixels = 4096 bytes (RGBA)
      const expectedLength = size * size * 4;
      const pixelLength = Math.min(pixelData.length, expectedLength);
      const pixelCount = size * size;

      // Copy pixel data row by row (sprites are stored top-to-bottom)
      // Pixels can be in two formats:
      // 1. ARGB format (from individual sprites via Sprite.uncompressPixels) - Alpha, Red, Green, Blue
      // 2. RGBA format (from composite bitmaps via getBitmapPixels -> BitmapData.getPixels -> canvas.getImageData) - Red, Green, Blue, Alpha
      // 
      // Detection: getBitmapPixels creates a BitmapData, copies sprites to it, then calls getPixels()
      // which uses canvas.getImageData() - this ALWAYS returns RGBA format.
      // Individual sprite pixels from Sprite.uncompressPixels are in ARGB format.
      //
      // Detection strategy:
      // 1. If format is explicitly specified, use it (never override)
      // 2. If data size is larger than a single 32x32 sprite (4096 bytes), it's likely a composite bitmap (RGBA)
      // 3. Otherwise, check pixel patterns - ARGB has alpha (0 or 255) at position 0, RGBA has red values
      const expectedSingleSpriteSize = size * size * 4; // 32x32 = 4096 bytes
      let isARGB = false;
      
      // Explicit format takes precedence - never use detection if format is specified
      if (format === 'argb') {
        isARGB = true;
      } else if (format === 'rgba') {
        isARGB = false;
      } else {
        // Auto-detection only when format is 'auto' or not specified
        if (pixelData.length > expectedSingleSpriteSize) {
          // Composite bitmap from getBitmapPixels - always RGBA format
          isARGB = false;
        } else {
        // Single sprite - could be ARGB or RGBA, use pattern detection
        // ARGB: [A, R, G, B] - position 0 is alpha (0 or 255), position 3 is blue (varies)
        // RGBA: [R, G, B, A] - position 0 is red (varies), position 3 is alpha (0 or 255)
        let argbCount = 0;
        let rgbaCount = 0;
        const sampleSize = Math.min(32, Math.floor(pixelData.length / 4)); // Sample first 32 pixels
        for (let i = 0; i < sampleSize; i++) {
          const pos = i * 4;
          if (pos + 3 < pixelData.length) {
            const firstByte = pixelData[pos];
            const fourthByte = pixelData[pos + 3];
            const firstIsAlpha = (firstByte === 0 || firstByte === 255);
            const fourthIsAlpha = (fourthByte === 0 || fourthByte === 255);
            
            if (firstIsAlpha && !fourthIsAlpha) {
              // Position 0 is alpha-like, position 3 is not - likely ARGB
              argbCount++;
            } else if (!firstIsAlpha && fourthIsAlpha) {
              // Position 0 varies, position 3 is alpha-like - likely RGBA
              rgbaCount++;
            } else if (firstIsAlpha && fourthIsAlpha) {
              // Both are alpha-like - ambiguous, but if position 0 is more consistently 0/255, it's ARGB
              // Count towards ARGB but with less weight
              argbCount += 0.5;
            }
            // If neither is alpha-like, it's ambiguous - don't count
          }
        }
          // If we have strong evidence for ARGB, use it; otherwise default to RGBA (safer for composite bitmaps)
          isARGB = argbCount > rgbaCount;
        }
      }
      
      // Determine if this is a single sprite or composite bitmap
      // Single sprites are exactly 32x32 (4096 bytes) and should be read linearly
      // Composite bitmaps are larger and need width calculation to read top-left 32x32 correctly
      const isCompositeBitmap = pixelData.length > expectedSingleSpriteSize;
      let sourceWidth = size; // Default to size for single sprites
      
      if (isCompositeBitmap && !isARGB) {
        // Composite bitmap (RGBA from getBitmapPixels): calculate width from total pixel count
        // getBitmapPixels creates bitmaps that are width*32 x height*32
        // Total pixels = width * height, where width and height are multiples of 32
        const totalPixels = pixelData.length / 4;
        // Find width by trying multiples of 32
        // width must be a multiple of 32, and height = totalPixels / width must also be a multiple of 32
        for (let w = 32; w <= Math.sqrt(totalPixels) * 2; w += 32) {
          const h = totalPixels / w;
          if (h >= 32 && h % 32 === 0 && Math.abs(h - Math.round(h)) < 0.001) {
            sourceWidth = w;
            break;
          }
        }
        // Fallback: if we can't determine, assume square-ish
        if (sourceWidth === size) {
          sourceWidth = Math.floor(Math.sqrt(totalPixels));
        }
      }
      
      // Read pixels
      // For single sprites: read linearly (y * size + x)
      // For composite bitmaps: read top-left 32x32 accounting for actual row width (y * sourceWidth + x)
      // Pixels are stored row by row: row 0 (all pixels), row 1 (all pixels), etc.
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          // Calculate source pixel index
          const sourcePixelIndex = isCompositeBitmap && !isARGB
            ? (y * sourceWidth + x) * 4  // Composite bitmap: account for row width
            : (y * size + x) * 4;        // Single sprite: linear index
          const dataIndex = (y * size + x) * 4;
          
          if (sourcePixelIndex + 3 < pixelData.length && dataIndex + 3 < data.length) {
            if (isARGB) {
              // Convert from ARGB to RGBA for canvas ImageData
              data[dataIndex] = pixelData[sourcePixelIndex + 1] || 0;     // R (from ARGB position 1)
              data[dataIndex + 1] = pixelData[sourcePixelIndex + 2] || 0; // G (from ARGB position 2)
              data[dataIndex + 2] = pixelData[sourcePixelIndex + 3] || 0; // B (from ARGB position 3)
              data[dataIndex + 3] = pixelData[sourcePixelIndex] !== undefined ? pixelData[sourcePixelIndex] : 255; // A (from ARGB position 0)
            } else {
              // Already in RGBA format, copy directly
              data[dataIndex] = pixelData[sourcePixelIndex] || 0;         // R
              data[dataIndex + 1] = pixelData[sourcePixelIndex + 1] || 0; // G
              data[dataIndex + 2] = pixelData[sourcePixelIndex + 2] || 0; // B
              data[dataIndex + 3] = pixelData[sourcePixelIndex + 3] !== undefined ? pixelData[sourcePixelIndex + 3] : 255; // A
            }
          }
        }
      }

      // Put image data on canvas
      ctx.putImageData(imageData, 0, 0);
    } catch (error) {
      console.error('Error rendering sprite thumbnail:', error);
      // Show placeholder on error
      ctx.fillStyle = '#999999';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('?', size / 2, size / 2);
    }
  }, [pixels, size, format]);

  const displaySize = size * scale;

  return (
    <div className={`sprite-thumbnail ${className}`} style={{ width: displaySize, height: displaySize, backgroundColor: '#636363' }}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="sprite-thumbnail-canvas"
        style={{
          width: displaySize,
          height: displaySize,
          imageRendering: 'pixelated', // Keep pixel art crisp
          display: 'block', // Prevent inline spacing
        }}
      />
    </div>
  );
};

