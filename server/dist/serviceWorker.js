"use strict";
// src/serviceWorker.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.unregister = unregister;
// 🔹 Kiểm tra localhost
const isLocalhost = Boolean(window.location.hostname === "localhost" ||
    window.location.hostname === "[::1]" ||
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));
// 🔹 Env variables Vite/CRA
const NODE_ENV = process.env.NODE_ENV;
const PUBLIC_URL = process.env.PUBLIC_URL;
// 🔹 Register service worker
function register(config) {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
        const publicUrl = new URL(process.env.PUBLIC_URL || "/", window.location.href);
        if (publicUrl.origin !== window.location.origin)
            return;
        window.addEventListener("load", () => {
            const swUrl = `${process.env.PUBLIC_URL || ""}/service-worker.js`;
            if (isLocalhost) {
                checkValidServiceWorker(swUrl, config);
                navigator.serviceWorker.ready.then(() => {
                    console.log("This web app is being served cache-first by a service worker.");
                });
            }
            else {
                registerValidSW(swUrl, config);
            }
        });
    }
}
// 🔹 Hàm đăng ký SW chuẩn
function registerValidSW(swUrl, config) {
    navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
        registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (!installingWorker)
                return;
            installingWorker.onstatechange = () => {
                if (installingWorker.state === "installed") {
                    if (navigator.serviceWorker.controller) {
                        console.log("New content is available and will be used when all tabs for this page are closed.");
                        config?.onUpdate?.(registration);
                    }
                    else {
                        console.log("Content is cached for offline use.");
                        config?.onSuccess?.(registration);
                    }
                }
            };
        };
    })
        .catch((error) => console.error("Error during service worker registration:", error));
}
// 🔹 Kiểm tra SW trên localhost
function checkValidServiceWorker(swUrl, config) {
    fetch(swUrl, { headers: { "Service-Worker": "script" } })
        .then((response) => {
        const contentType = response.headers.get("content-type");
        if (response.status === 404 ||
            (contentType && contentType.indexOf("javascript") === -1)) {
            navigator.serviceWorker.ready.then((registration) => {
                registration.unregister().then(() => window.location.reload());
            });
        }
        else {
            registerValidSW(swUrl, config);
        }
    })
        .catch(() => console.log("No internet connection found. App is running in offline mode."));
}
// 🔹 Unregister
function unregister() {
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.ready
            .then((registration) => registration.unregister())
            .catch((error) => console.error(error.message));
    }
}
