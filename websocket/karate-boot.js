// Activates WebSocket support. There is no endpoint to set globally — a WebSocket URL belongs to the
// session, so each check sets its own `url`.
boot.ext('websocket');
