import { registerRootComponent } from "expo";
import React from "react";  // ✅ Needed
import { useLayoutEffect } from "react"; // ✅ We'll use this for the polyfill

import App from "./App";

// ✅ Polyfill: map useInsertionEffect → useLayoutEffect
if (typeof React.useInsertionEffect === "undefined") {
  React.useInsertionEffect = useLayoutEffect;
}

// Register app
registerRootComponent(App);
