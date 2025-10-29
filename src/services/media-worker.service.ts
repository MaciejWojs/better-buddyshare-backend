import { RPCClient } from "rabbitmq-client";
import { BaseRabbitService } from "./BaseRabbit.service";
import { env } from "bun";

export class MediaWorkerService extends BaseRabbitService {
    private static VIDEO_QUEUE_NAME = env.VIDEO_QUEUE_NAME || "video_processing_queue";
    private static PHOTO_QUEUE_NAME = env.PHOTO_QUEUE_NAME || "photo_processing_queue";
    private rpcClient!: RPCClient;

    public constructor() {
        super();
        console.log(`⚙️ Initializing ${this.constructor.name} service`);
        this.init()
    }

    public async init() {
        // Inicjalizacja RPC Clienta
        this.rpcClient = this.rabbit.createRPCClient({
            confirm: true,
        });
        console.log(`📡 RPC client initialized for ${this.constructor.name}`);
    }

    private async publishRequest(
        type: "video" | "photo",
        id: number,
        path: string,
        addresIP?: string
    ) {
        if (!this.rpcClient) {
            console.error("❌ RPC Client not initialized");
            return null;
        }

        const queueName =
            type === "video"
                ? MediaWorkerService.VIDEO_QUEUE_NAME
                : MediaWorkerService.PHOTO_QUEUE_NAME;

        const payload =
            type === "video"
                ? { videoId: id, videoPath: path, addresIP }
                : { photoId: id, photoPath: path, addresIP };

        console.log(`📤 Publishing ${type} processing request:`, payload);

        return this.rpcClient.send(queueName, payload);
    }

    public publishVideoProcessingRequest(videoId: number, videoPath: string, addresIP: string) {
        return this.publishRequest("video", videoId, videoPath, addresIP);
    }

    public publishPhotoProcessingRequest(photoId: number, photoPath: string, addresIP: string) {
        return this.publishRequest("photo", photoId, photoPath, addresIP);
    }
}
