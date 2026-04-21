"use client"

import * as React from "react"
import * as Direction from "@radix-ui/react-direction"

/**
 * DirectionProvider handles Right-to-Left (RTL) or Left-to-Right (LTR) 
 * contexts. It maintains the logic of prioritizing the 'direction' prop 
 * over the 'dir' prop.
 */
function DirectionProvider({
  dir,
  direction,
  children,
}) {
  return (
    <Direction.Provider dir={direction ?? dir}>
      {children}
    </Direction.Provider>
  )
}

const useDirection = Direction.useDirection

export { DirectionProvider, useDirection }