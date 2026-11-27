import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F4F6F8",
        surface: "#FFFFFF",
        "text-primary": "#101828",
        "text-secondary": "#475467",
        border: "#E4E7EC",
        accent: { DEFAULT: "#0B6E8A", strong: "#084F63", soft: "#E6F2F6" },
        success: { fg: "#067647", bg: "#E7F6EE" },
        warning: { fg: "#B54708", bg: "#FEF0E6" },
        danger: { fg: "#B42318", bg: "#FEF3F2" },
        "chat-customer": "#D7EEF5",
        stage: {
          acquire: { fg: "#0F6A5E", bg: "#E3F5F1" },
          serve: { fg: "#1849A9", bg: "#EAF1FD" },
          retain: { fg: "#6B2FA3", bg: "#F3EAFB" },
        },
        sender: { bot: { fg: "#475467", bg: "#F2F4F7" }, ai: { fg: "#0B6E8A", bg: "#E6F2F6" } },
      },
      fontFamily: {
        heading: ["var(--font-heading)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      borderRadius: { control: "8px", card: "12px", bubble: "16px" },
    },
  },
  plugins: [],
};
export default config;
