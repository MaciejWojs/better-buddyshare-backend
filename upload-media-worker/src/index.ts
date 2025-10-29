import { env, S3Client } from 'bun'
import { Connection } from 'rabbitmq-client'

const VIDEO_QUEUE_NAME = env.VIDEO_QUEUE_NAME || "video_processing_queue";
const PHOTO_QUEUE_NAME = env.PHOTO_QUEUE_NAME || "photo_processing_queue";
const SRS_PORT = env.SRS_PORT || "8080";

if (!env.RABBITMQ_URL) {
    console.error('RABBITMQ_URL is not defined in environment variables')
    process.exit(1)
}

const rabbit = new Connection(env.RABBITMQ_URL)
rabbit.on('error', (err) => {
    console.log('RabbitMQ connection error', err)
})
rabbit.on('connection', () => {
    console.log('Connection successfully (re)established')
})


if (!env.MINIO_ENDPOINT || !env.MINIO_ROOT_USER || !env.MINIO_ROOT_PASSWORD) {
    console.error('MinIO configuration is not fully defined in environment variables')
    process.exit(1)
}
// const buckets = ['video', 'photos'];

// for (const bucket of buckets) {
//     const client = new S3Client({
//         endpoint: env.MINIO_ENDPOINT!,
//         accessKeyId: env.MINIO_ROOT_USER!,
//         secretAccessKey: env.MINIO_ROOT_PASSWORD!,
//         bucket,
//     });

//     client.write('ping.txt', 'pong')
//         .then(() => {
//             console.log(`Successfully connected to MinIO bucket "${bucket}" and wrote test file`);
//         })
//         .catch((error: Error) => {
//             console.error(`Error connecting to MinIO bucket "${bucket}" or writing test file:`, error);
//             process.exit(1);
//         });
// }

const bucket = 'photos';

const s3Client = new S3Client({
    endpoint: env.MINIO_ENDPOINT!,
    accessKeyId: env.MINIO_ROOT_USER!,
    secretAccessKey: env.MINIO_ROOT_PASSWORD!,
    bucket,
});

s3Client.write('ping.txt', 'pong')
    .then(() => {
        console.log(`Successfully connected to MinIO bucket "${bucket}" and wrote test file`);
    })
    .catch((error: Error) => {
        console.error(`Error connecting to MinIO bucket "${bucket}" or writing test file:`, error);
        process.exit(1);
    });


const bucketVideo = 'videos';

const videoS3Client = new S3Client({
    endpoint: env.MINIO_ENDPOINT!,
    accessKeyId: env.MINIO_ROOT_USER!,
    secretAccessKey: env.MINIO_ROOT_PASSWORD!,
    bucket: bucketVideo,
});

videoS3Client.write('ping.txt', 'pong')
    .then(() => {
        console.log(`Successfully connected to MinIO bucketVideo "${bucketVideo}" and wrote test file`);
    })
    .catch((error: Error) => {
        console.error(`Error connecting to MinIO bucketVideo "${bucketVideo}" or writing test file:`, error);
        process.exit(1);
    });





rabbit.createConsumer({
    queue: PHOTO_QUEUE_NAME
},

    async (req, reply) => {
        console.log('request:', req.body)
        await reply('pong')
    })


rabbit.createConsumer({
    queue: VIDEO_QUEUE_NAME
},

    async (req, reply) => {
        console.log('request:', req.body)

        const ip = req.body.addresIP;
        const path = req.body.videoPath;
        const videoID = req.body.videoId;

        const urlPath = `http://${ip}:${SRS_PORT}/${path}`;
        const file = await fetch(urlPath);

        console.log('Fetched file from URL:', urlPath);
        console.log('file:', file);
        console.log('videoID:', videoID);

        // Check if the fetch was successful

        console.log('Fetch response ok?:', file.ok);
        if (!file.ok) {
            console.error('Failed to fetch the video:', file.statusText);
            await reply('error: Failed to fetch video');
            return;
        }

        // Convert the fetched file to ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();

        console.log('Fetched ArrayBuffer size:', arrayBuffer.byteLength);

        const filename = `${videoID}.mp4`

        // Save to S3 using ArrayBuffer
        await videoS3Client.write(filename, arrayBuffer);

        const link = await videoS3Client.presign(filename, {
            acl: 'public-read'
        })

        console.log(`Video saved with ID ${videoID}`);

        // const forgedLink = link.replace('simple-storage', 'localhost');

        //! TODO Zaimplementowac usuwanie z SRS po udanym zapisaniu do S3


        // Respond back to the client
        await reply(link);
    })