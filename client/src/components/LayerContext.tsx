import { createContext, useContext } from "react";

export const LayerContext = createContext<number>(1000);

export function useLayerZIndex() {
  return useContext(LayerContext);
}