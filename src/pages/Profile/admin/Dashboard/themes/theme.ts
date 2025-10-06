// src/pages/Profile/admin/Dashboard/themes/theme.ts
import { createTheme } from "@mui/material/styles";

/* ===== MỞ RỘNG TYPE ===== */
declare module "@mui/material/styles" {
  interface TypeText {
    dark?: string;
    hint?: string;
  }

  interface TypographyVariants {
    menuCaption: React.CSSProperties;
    subMenuCaption: React.CSSProperties;
  }

  interface TypographyVariantsOptions {
    menuCaption?: React.CSSProperties;
    subMenuCaption?: React.CSSProperties;
  }

  interface Theme {
    statsColors: {
      students: string;
      teachers: string;
      parents: string;
      classes: string;
    };
  }
  interface ThemeOptions {
    statsColors?: {
      students?: string;
      teachers?: string;
      parents?: string;
      classes?: string;
    };
  }
}

declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    menuCaption: true;
    subMenuCaption: true;
  }
}

interface Customization {
  navType?: "light" | "dark";
}

/* ===== MÀU CƠ BẢN ===== */
const paletteBase = {
  primary: "#4f46e5",
  primaryLight: "#6366f1",
  primaryDark: "#3730a3",
  primary100: "#c7d2fe",

  secondary: "#10b981",
  secondaryLight: "#6ee7b7",
  secondaryDark: "#047857",

  textPrimary: "#111827",
  textSecondary: "#4b5563",
  textDark: "#1f2937",
  textHint: "#9ca3af",

  menuHover: "#f3f4f6",
  background: "#f9fafb",
  paper: "#ffffff",

  stats: {
    students: "#e0f2fe",
    teachers: "#dcfce7",
    parents: "#fef9c3",
    classes: "#ede9fe",
  },
};

/* ===== FUNCTION CHÍNH ===== */
export function theme(customization: Customization = { navType: "light" }) {
  return createTheme({
    palette: {
      mode: customization.navType === "dark" ? "dark" : "light",
      primary: {
        main: paletteBase.primary,
        light: paletteBase.primaryLight,
        dark: paletteBase.primaryDark,
      },
      secondary: {
        main: paletteBase.secondary,
        light: paletteBase.secondaryLight,
        dark: paletteBase.secondaryDark,
      },
      background: {
        paper: paletteBase.paper,
        default: paletteBase.background,
      },
      text: {
        primary: paletteBase.textPrimary,
        secondary: paletteBase.textSecondary,
        dark: paletteBase.textDark,
        hint: paletteBase.textHint,
      },
    },

    typography: {
      fontFamily: `'Poppins', sans-serif`,
      h1: { fontWeight: 600, fontSize: "2.25rem" },
      h2: { fontWeight: 600, fontSize: "1.75rem" },
      h3: { fontWeight: 600, fontSize: "1.5rem" },
      h4: { fontWeight: 500, fontSize: "1.25rem" },
      h5: { fontWeight: 500, fontSize: "1.1rem" },
      body1: { fontSize: "0.95rem", lineHeight: 1.5 },
      body2: { fontSize: "0.85rem", color: paletteBase.textSecondary },
      caption: { fontSize: "0.75rem", color: paletteBase.textHint },

      menuCaption: {
        fontSize: "0.7rem",
        textTransform: "uppercase",
        color: paletteBase.textSecondary,
        fontWeight: 600,
      },
      subMenuCaption: {
        fontSize: "0.7rem",
        color: paletteBase.textHint,
        fontWeight: 400,
      },
    },

    statsColors: paletteBase.stats,
  });
}

export default theme;
