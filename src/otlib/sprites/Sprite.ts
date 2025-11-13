/*
*  Copyright (c) 2014-2023 Object Builder <https://github.com/ottools/ObjectBuilder>
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the "Software"), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/

import * as crypto from "crypto";
import { BitmapData } from "../utils/BitmapData";
import { Rect } from "../geom/Rect";
import { SpriteExtent } from "../utils/SpriteExtent";
import { ByteArray } from "../utils/ByteArray";

export class Sprite {
    private _id: number;
    private _transparent: boolean;
    private _compressedPixels: ByteArray;
    private _bitmap: BitmapData | null = null;
    private _hash: string | null = null;
    private _rect: Rect;

    public get id(): number { return this._id; }
    public set id(value: number) { this._id = value; }

    public get transparent(): boolean { return this._transparent; }
    public set transparent(value: boolean) {
        if (this._transparent !== value) {
            const pixels = this.getPixels();
            this._transparent = value;
            this.setPixels(pixels);
        }
    }

    public get isEmpty(): boolean { return (this._compressedPixels.length === 0); }

    public get length(): number { return this._compressedPixels.length; }
    public get compressedPixels(): ByteArray { return this._compressedPixels; }
    public set compressedPixels(value: ByteArray) { this._compressedPixels = value; }

    constructor(id: number, transparent: boolean) {
        this._id = id;
        this._transparent = transparent;
        this._compressedPixels = new ByteArray();
        this._rect = new Rect(0, 0, SpriteExtent.DEFAULT_SIZE, SpriteExtent.DEFAULT_SIZE);
    }

    public toString(): string {
        return this._id.toString();
    }

    public getPixels(): ByteArray {
        return this.uncompressPixels();
    }

    public setPixels(pixels: ByteArray): boolean {
        if (!pixels) {
            throw new Error("pixels cannot be null");
        }

        if (pixels.length !== SpriteExtent.DEFAULT_DATA_SIZE) {
            throw new Error("Invalid sprite pixels length");
        }

        this._hash = null;
        return this.compressPixels(pixels);
    }

    public getBitmap(): BitmapData | null {
        if (this._bitmap) {
            return this._bitmap;
        }

        const pixels = this.getPixels();
        if (!pixels) {
            return null;
        }

        // Pixels returned by getPixels() are in ARGB format (A, R, G, B)
        // Canvas ImageData expects RGBA (R, G, B, A), so convert before setting
        const argb = pixels.toBuffer();
        const rgba = Buffer.alloc(argb.length);
        const pixelCount = argb.length / 4;
        for (let i = 0; i < pixelCount; i++) {
            const ai = i * 4;
            const ri = ai + 1;
            const gi = ai + 2;
            const bi = ai + 3;
            const di = i * 4;
            rgba[di] = argb[ri] || 0;       // R
            rgba[di + 1] = argb[gi] || 0;   // G
            rgba[di + 2] = argb[bi] || 0;   // B
            rgba[di + 3] = argb[ai] ?? 255; // A
        }

        this._bitmap = new BitmapData(SpriteExtent.DEFAULT_SIZE, SpriteExtent.DEFAULT_SIZE, true);
        this._bitmap.setPixels(this._rect, rgba);

        return this._bitmap;
    }

    public setBitmap(bitmap: BitmapData): boolean {
        if (!bitmap) {
            throw new Error("bitmap cannot be null");
        }

        if (bitmap.width !== SpriteExtent.DEFAULT_SIZE || bitmap.height !== SpriteExtent.DEFAULT_SIZE) {
            throw new Error("Invalid sprite bitmap size");
        }

        const pixels = ByteArray.fromBuffer(bitmap.getPixels(this._rect));
        if (!this.compressPixels(pixels)) {
            return false;
        }

        this._hash = null;
        this._bitmap = bitmap.clone();
        return true;
    }

    public getHash(): string {
        if (this._hash !== null) {
            return this._hash;
        }

        if (this._compressedPixels.length !== 0) {
            const buffer = this._compressedPixels.toBuffer();
            this._hash = crypto.createHash("md5").update(buffer).digest("hex");
        }

        return this._hash || "";
    }

    public clone(): Sprite {
        const sprite = new Sprite(this._id, this._transparent);
        const buffer = this._compressedPixels.toBuffer();
        sprite._compressedPixels = ByteArray.fromBuffer(buffer);
        sprite._bitmap = this._bitmap;
        return sprite;
    }

    public clear(): void {
        if (this._compressedPixels) {
            this._compressedPixels.clear();
        }

        if (this._bitmap) {
            this._bitmap.fillRect(0, 0, SpriteExtent.DEFAULT_SIZE, SpriteExtent.DEFAULT_SIZE, 0x00FF00FF);
        }
    }

    public dispose(): void {
        if (this._compressedPixels) {
            this._compressedPixels.clear();
        }

        if (this._bitmap) {
            this._bitmap.dispose();
            this._bitmap = null;
        }

        this._id = 0;
    }

    private compressPixels(pixels: ByteArray): boolean {
        this._compressedPixels.clear();
        pixels.position = 0;

        let index = 0;
        let color: number;
        let transparentPixel = true;
        let alphaCount = 0;
        let chunkSize = 0;
        let coloredPos = 0;
        let finishOffset = 0;
        const length = pixels.length / 4;

        while (index < length) {
            chunkSize = 0;
            while (index < length) {
                pixels.position = index * 4;
                color = pixels.readUnsignedInt();
                transparentPixel = (color === 0);
                if (!transparentPixel) break;
                alphaCount++;
                chunkSize++;
                index++;
            }

            // Entire image is transparent
            if (alphaCount < length) {
                // Already at the end
                if (index < length) {
                    this._compressedPixels.writeShort(chunkSize); // Write transparent pixels
                    coloredPos = this._compressedPixels.position; // Save colored position
                    this._compressedPixels.position += 2; // Skip colored short
                    chunkSize = 0;

                    while (index < length) {
                        pixels.position = index * 4;
                        color = pixels.readUnsignedInt();
                        transparentPixel = (color === 0);
                        if (transparentPixel) break;

                        this._compressedPixels.writeByte((color >> 16) & 0xFF); // Write red
                        this._compressedPixels.writeByte((color >> 8) & 0xFF); // Write green
                        this._compressedPixels.writeByte(color & 0xFF); // Write blue
                        if (this._transparent) {
                            this._compressedPixels.writeByte((color >> 24) & 0xFF); // Write Alpha
                        }

                        chunkSize++;
                        index++;
                    }

                    finishOffset = this._compressedPixels.position;
                    this._compressedPixels.position = coloredPos; // Go back to chunksize indicator
                    this._compressedPixels.writeShort(chunkSize); // Write colored pixels
                    this._compressedPixels.position = finishOffset;
                }
            }
        }

        return true;
    }

    private uncompressPixels(): ByteArray {
        let read = 0;
        let write = 0;
        let transparentPixels: number;
        let coloredPixels: number;
        let alpha: number;
        let red: number;
        let green: number;
        let blue: number;
        const channels = this._transparent ? 4 : 3;
        const length = this._compressedPixels.length;

        this._compressedPixels.position = 0;
        const pixels = new ByteArray();

        for (read = 0; read < length; read += 4 + (channels * coloredPixels)) {
            transparentPixels = this._compressedPixels.readUnsignedShort();
            coloredPixels = this._compressedPixels.readUnsignedShort();

            for (let i = 0; i < transparentPixels; i++) {
                pixels.writeByte(0x00); // Alpha
                pixels.writeByte(0x00); // Red
                pixels.writeByte(0x00); // Green
                pixels.writeByte(0x00); // Blue
            }

            for (let i = 0; i < coloredPixels; i++) {
                red = this._compressedPixels.readUnsignedByte(); // Red
                green = this._compressedPixels.readUnsignedByte(); // Green
                blue = this._compressedPixels.readUnsignedByte(); // Blue
                alpha = this._transparent ? this._compressedPixels.readUnsignedByte() : 0xFF; // Alpha

                pixels.writeByte(alpha); // Alpha
                pixels.writeByte(red); // Red
                pixels.writeByte(green); // Green
                pixels.writeByte(blue); // Blue
            }
        }

        while (write < SpriteExtent.DEFAULT_DATA_SIZE) {
            pixels.writeByte(0x00); // Alpha
            pixels.writeByte(0x00); // Red
            pixels.writeByte(0x00); // Green
            pixels.writeByte(0x00); // Blue
            write += 4;
        }

        return pixels;
    }
}

