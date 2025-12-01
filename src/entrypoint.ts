import "dotenv/config";
import http from "http";
import { Application } from "express";

import { createServer } from "./app";
import { constructIOC } from "./ioc.builder";
import { ApplicationType } from "./lib/enum/application.enum";
import { logger } from "./lib/logger";
import { createSocketServer } from "./scoket/socket.server";
import { initWorker } from "./worker/worker";
import { Container } from "inversify";

async function initSockets(ioc: Container, server?: http.Server) {
  const socketApp = await createSocketServer(server, ioc);

  if (!server) {
    socketApp.httpServer.listen(socketApp.port, () => {
      logger().info(`Socket server is running on port ${socketApp.port}`);
    });
  }
}

async function boot() {
  const appType: ApplicationType = (process.env.APP_TYPE ||
    ApplicationType.API) as ApplicationType;
  let _server: Application | undefined;
  let serverName: string;

  try {
    const ioc = await constructIOC();
    switch (appType) {
      case ApplicationType.Socket:
        await initSockets(ioc);
        serverName = ApplicationType.Socket;

        break;
      case ApplicationType.Worker:
        await initWorker(ioc);
        serverName = ApplicationType.Worker;

        break;
      case ApplicationType.API:
      default:
        _server = await createServer(ioc);

        serverName = ApplicationType.API;
        break;
    }

    const port = parseInt(process.env.PORT || "8080", 10);

    if (_server) {
      _server.listen(port, () => {
        logger().info(`APP (${serverName}) is running on port ${port}`);
      });
    } else {
      logger().info(`APP (${serverName}) initialized successfully.`);
    }
  } catch (error) {
    logger().error(`Failed to boot the application: ${error}`);
    process.exit(1);
  }
}

boot();
