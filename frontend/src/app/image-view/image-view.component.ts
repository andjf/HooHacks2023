import * as p5 from 'p5';
import { Component, DoCheck, Input, OnDestroy, OnInit } from '@angular/core';
import { Move } from '../editor/Move';

@Component({
  selector: 'app-image-view',
  templateUrl: './image-view.component.html',
  styleUrls: ['./image-view.component.css']
})
export class ImageViewComponent implements OnInit, OnDestroy, DoCheck {

  private p5: any;

  @Input() socket?: WebSocket;

  @Input() currentLocalMoves: Move[] = [];

  useGlobalImage: boolean = true;

  ngOnInit() {
    console.log('image-view init');
    this.createCanvas();
  }

  ngOnDestroy(): void {
    this.destroyCanvas();
    console.log('image-view destroy');
  }

  private createCanvas = () => {
    console.log('creating canvas');
    this.p5 = new p5(this.drawing);
    this.p5.connectWebsocket(this.socket);
  }

  private destroyCanvas = () => {
    console.log('destroying canvas');
    this.p5.noCanvas();
  }

  ngDoCheck() {
    this.p5.executeMoves(this.currentLocalMoves);
  }

  flipScope() {
    this.useGlobalImage = !this.useGlobalImage
    this.p5.setUseGlobalImage(this.useGlobalImage);
  }

  drawing(p: p5) {
    let global_image: p5.Image;
    let local_image: p5.Image;

    let scale = 1;
    let translateX: number = 0;
    let translateY: number = 0;

    function applyScale(s: number) {
      scale = scale * s;
      translateX = p.mouseX * (1 - s) + translateX * s;
      translateY = p.mouseY * (1 - s) + translateY * s;
    }


    const DEFAULT_TRANSLATE_RATE: number = 1.0;
    let translate_rate: number = DEFAULT_TRANSLATE_RATE;

    let upPressed: boolean;
    let downPressed: boolean;
    let leftPressed: boolean;
    let rightPressed: boolean;

    let useGlobalImage = true;
    // @ts-ignore
    p5.prototype.setUseGlobalImage = function (ugi: boolean) {
      useGlobalImage = ugi;
    }

    // @ts-ignore
    p5.prototype.executeMoves = function (moves: Move[]) {
      if (local_image === undefined)
        return;
      local_image.loadPixels();
      while (moves.length > 0) {
        const { x, y, color } = moves[0];
        const expanded_color = color.length === 3 ? color.charAt(0) + color.charAt(0) + color.charAt(1) + color.charAt(1) + color.charAt(2) + color.charAt(2) : color;
        let value = parseInt(expanded_color, 16);
        let pos = (y * local_image.width + x) * 4;
        local_image.pixels[pos + 0] = value & 0xFF0000; // r
        local_image.pixels[pos + 1] = value & 0x00FF00; // g
        local_image.pixels[pos + 2] = value & 0x0000FF; // b
        local_image.pixels[pos + 3] = 255; // a
        moves.shift();
      }
      local_image.updatePixels();
    }

    // @ts-ignore
    p5.prototype.connectWebsocket = function (socket: any) {
      socket.addEventListener("message", (event: any) => {
        let data = JSON.parse(event.data);
        if (data.message !== "success") {
          return;
        }
        data = data.data;

        const W = data.width;
        const H = data.height;

        local_image.loadPixels();
        let pos = 0;
        for (let y = 0; y < H; y++) {
          for (let x = 0; x < W; x++) {
            local_image.pixels[pos + 0] = 255; // r
            local_image.pixels[pos + 1] = 255; // g
            local_image.pixels[pos + 2] = 255; // b
            local_image.pixels[pos + 3] = 255; // a
            pos += 4;
          }
        }
        local_image.updatePixels();


        global_image.loadPixels();
        pos = 0;
        for (let y = 0; y < H; y++) {
          for (let x = 0; x < W; x++) {
            let color = data.state[y][x];
            global_image.pixels[pos + 0] = (color & 0xFF0000); // r
            global_image.pixels[pos + 1] = (color & 0x00FF00); // g
            global_image.pixels[pos + 2] = (color & 0x0000FF); // b
            global_image.pixels[pos + 3] = 255; // a
            pos += 4;
          }
        }

        global_image.updatePixels();
      });

      socket.addEventListener("open", () => {
        socket.send(JSON.stringify({ message: "get_update", data: "" }));
      });
    }

    p.setup = () => {
      const parent = document.getElementById('p5-target');
      if (!parent)
        return

      upPressed = false;
      downPressed = false;
      leftPressed = false;
      rightPressed = false;

      const rect: DOMRect = parent.getBoundingClientRect();
      const W = Math.floor(rect.width);
      const H = Math.floor(rect.height);
      let renderer = p.createCanvas(W, H);
      renderer.elt.width = parent.clientWidth;
      renderer.elt.height = parent.clientHeight;

      renderer.parent('p5-target');


      window.addEventListener("wheel", function (e) {
        if ((p.mouseX > 0 && p.mouseX < p.width) && (p.mouseY > 0 && p.mouseY < p.height)) {
          applyScale(e.deltaY > 0 ? 1.05 : 0.95);
        }
      });

      global_image = p.createImage(1000, 1000);
      local_image = p.createImage(1000, 1000);
      p.noSmooth();
    };

    p.draw = () => {
      // If the mouse is "focused" on the canvas
      if ((p.mouseX > 0 && p.mouseX < p.width) && (p.mouseY > 0 && p.mouseY < p.height)) {
        if (upPressed)
          translateY += translate_rate;
        if (downPressed)
          translateY -= translate_rate;
        if (leftPressed)
          translateX += translate_rate;
        if (rightPressed)
          translateX -= translate_rate;

        if (!upPressed && !downPressed && !leftPressed && !rightPressed) {
          translate_rate = DEFAULT_TRANSLATE_RATE;
        } else {
          translate_rate += 0.10;
        }
      }

      // Apply scale
      p.translate(translateX, translateY);
      p.scale(scale);

      p.background(0);
      if (useGlobalImage) {
        p.image(global_image, 0, 0, global_image.width, global_image.height);
      } else {
        p.image(local_image, 0, 0, local_image.width, local_image.height);
      }
    };

    p.keyReleased = () => {
      if (p.keyCode == p.UP_ARROW) {
        upPressed = false;
      } else if (p.keyCode == p.DOWN_ARROW) {
        downPressed = false;
      } else if (p.keyCode == p.LEFT_ARROW) {
        leftPressed = false;
      } else if (p.keyCode == p.RIGHT_ARROW) {
        rightPressed = false;
      }
    }

    p.keyPressed = () => {
      if (p.keyCode === p.UP_ARROW) {
        upPressed = true;
      } else if (p.keyCode === p.DOWN_ARROW) {
        downPressed = true;
      } else if (p.keyCode === p.LEFT_ARROW) {
        leftPressed = true;
      } else if (p.keyCode === p.RIGHT_ARROW) {
        rightPressed = true;
      }

      // If the mouse is "focused" on the canvas
      if ((p.mouseX > 0 && p.mouseX < p.width) && (p.mouseY > 0 && p.mouseY < p.height)) {
        // Backslash resetst the position
        if (p.key === '\\') {
          translateX = 0;
          translateY = 0;
          scale = 1;
        }

        // Zoom "+" and "-" buttons
        if (p.key === '-') {
          applyScale(0.95);
        } else if (p.key === "=") {
          applyScale(1.05);
        }
      }
    };
  }
}
