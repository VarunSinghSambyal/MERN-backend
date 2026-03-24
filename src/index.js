import { app } from "./app.js";
import ConnectDB from "./db/index.js";
import dotenv from "dotenv";

dotenv.config({
    path: "./.env"
});

ConnectDB()
.then(() => {
    app.listen(3000, () => {
        console.log("Server is running on port 3000");
    });
    app.on("error", (error) => {
        console.error("Server error:", error);
    });
})
.catch((error) => {
    console.error("Failed to connect to the database:", error);
    process.exit(1);
});