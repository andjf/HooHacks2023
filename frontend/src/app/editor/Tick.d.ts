
export interface Pixel {
    x: number;
    y: number;
}

export interface Tick {
    line: number;
}

export interface Changed {
    line: number;
    modified: Pixel[];
    position: Pixel;
}

export interface Invalid {
    line: number;
    message: string;
}

export type tick = Tick | Changed | Invalid;
