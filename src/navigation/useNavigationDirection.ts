import { usePathname } from "expo-router";
import { useRef } from "react";

export function useNavigationDirection() {
  const prevPath = useRef<string | null>(null);
  const currentPath = usePathname();

  const direction =
    prevPath.current === null
      ? "right" // First load
      : prevPath.current < currentPath
      ? "right"
      : "left";

  // Update the ref after computing
  prevPath.current = currentPath;

  return direction;
}
