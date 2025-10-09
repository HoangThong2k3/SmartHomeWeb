// Định nghĩa kiểu dữ liệu cho TypeScript
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Device {
  id: string;
  name: string;
  type: "light" | "sensor" | "switch";
  status: "online" | "offline";
  lastUpdate: Date;
}
