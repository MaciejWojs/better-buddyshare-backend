import { env } from "bun";
import { Connection } from "rabbitmq-client";

if (!env.RABBITMQ_URL) {
  console.error("RABBITMQ_URL is not defined in environment variables");
  process.exit(1);
}

export abstract class BaseRabbitService {
  private static connection: Connection | null = null;
  private static instances: Map<string, BaseRabbitService> = new Map();

  protected rabbit: Connection;

  protected constructor() {
    if (!BaseRabbitService.connection) {
      console.log("🔌 Establishing RabbitMQ connection...");
      const conn = new Connection(env.RABBITMQ_URL!);
      conn.on("error", (err) => console.error("RabbitMQ error:", err));
      conn.on("connection", () =>
        console.log("✅ RabbitMQ connection established")
      );
      BaseRabbitService.connection = conn;
    }

    this.rabbit = BaseRabbitService.connection!;
  }

  /**
   * Generic singleton getter for subclasses.
   * Usage: `NotificationService.getInstance()`
   */
  public static getInstance<T extends BaseRabbitService>(
    this: new () => T
  ): T {
    const className = this.name;
    if (!BaseRabbitService.instances.has(className)) {
      BaseRabbitService.instances.set(className, new this());
      console.log(`🆕 Created new instance of ${className}`);
    }
    return BaseRabbitService.instances.get(className)! as T;
  }

  abstract init(): Promise<void>;
}
