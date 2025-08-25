import { AppRegistry } from "react-native-web";
import App from "./src/App";

// Import SCSS entry point
import "./src/stylesheets/main.scss";

// Register RNW app
AppRegistry.registerComponent("App", () => App);

// Mount vào div#root trong index.html
const rootTag = document.getElementById("root");
AppRegistry.runApplication("App", { rootTag });
