// src/pages/Profile/admin/Dashboard/themes/config.ts
// ==============================|| THEME CONSTANT  ||============================== //

export const gridSpacing = 3;
export const drawerWidth = 280;

// ==============================|| THEME CONFIG  ||============================== //

interface ThemeConfig {
  theme: "light" | "dark"; // chế độ mặc định
  rtlLayout: boolean; // RTL layout
  i18n: string; // ngôn ngữ
  statsColors?: {
    students: string;
    teachers: string;
    parents: string;
    classes: string;
  };
}

const config: ThemeConfig = {
  theme: "light",
  rtlLayout: false,
  i18n: "en",
  statsColors: {
    students: "#e0f2fe",
    teachers: "#dcfce7",
    parents: "#fef9c3",
    classes: "#ede9fe",
  },
};

export default config;
