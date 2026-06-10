declare module "heatmap.js" {
  interface HeatmapConfig {
    container: HTMLElement;
    radius?: number;
    maxOpacity?: number;
    minOpacity?: number;
    blur?: number;
    gradient?: Record<string, string>;
    backgroundColor?: string;
  }
  interface HeatmapDataPoint {
    x: number;
    y: number;
    value: number;
  }
  interface HeatmapData {
    max: number;
    min?: number;
    data: HeatmapDataPoint[];
  }
  interface HeatmapInstance {
    setData(data: HeatmapData): void;
    addData(points: HeatmapDataPoint[]): void;
    repaint(): void;
  }
  const h337: { create(config: HeatmapConfig): HeatmapInstance };
  export default h337;
}
