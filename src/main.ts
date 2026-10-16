/**
 * JWT Faker Plugin
 *
 * Provides JSON Web Token (JWT) generation, HMAC signing (HS256, HS384, HS512),
 * unsigned token support (alg: none), decoding, claim quick-helpers, and template management.
 * Renders as a native Voiden editor tab alongside documents.
 */

import type { PluginContext } from "@voiden/sdk/ui";
import React from "react";
import { JwtFakerTab } from "./components/JwtFakerTab";

const TAB_ID = "jwt-faker";
const TAB_TITLE = "JWT Faker";

const jwtFakerPlugin = (context: PluginContext) => {
  const showToast = (context as any)?.ui?.showToast as
    | ((message: string, type?: "info" | "success" | "warning" | "error") => void)
    | undefined;

  const TabComponent = (props: any) =>
    React.createElement(JwtFakerTab, {
      ...props,
      showToast,
    });

  const openJwtFakerTab = () => {
    if (typeof (context as any).addTab === "function") {
      (context as any).addTab("main", {
        id: TAB_ID,
        title: TAB_TITLE,
        component: TabComponent,
      });
    } else if (typeof (context as any).registerPanel === "function") {
      (context as any).registerPanel("main", {
        id: TAB_ID,
        title: TAB_TITLE,
        component: TabComponent,
      });
    }
  };

  return {
    onload: () => {
      // Pre-register panel component in main layout so it can be restored on app restart if already in layout
      if (typeof (context as any).registerPanel === "function") {
        (context as any).registerPanel("main", {
          id: TAB_ID,
          title: TAB_TITLE,
          component: TabComponent,
        });
      }

      // Expose global helper to open tab
      (window as any).__voidenOpenJwtFaker__ = () => {
        openJwtFakerTab();
      };

      // Register command in Command Palette
      if (typeof (context as any).registerCommand === "function") {
        (context as any).registerCommand({
          id: "jwt-faker.open",
          name: "JWT Faker: Open Generator & Decoder Tab",
          icon: "Sparkles",
          category: "Tools",
          callback: () => {
            openJwtFakerTab();
          },
        });
      }

      // Register status bar item
      if (typeof context.registerStatusBarItem === "function") {
        context.registerStatusBarItem({
          id: "jwt-faker-status-item",
          position: "left",
          label: "JWT Faker",
          icon: "Sparkles",
          tooltip: "Open JWT Faker tab to generate and decode JWTs",
          onClick: () => {
            openJwtFakerTab();
          },
        });
      }
    },

    onunload: () => {
      delete (window as any).__voidenOpenJwtFaker__;
    },
  };
};

export default jwtFakerPlugin;
