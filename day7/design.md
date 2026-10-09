# Photo-Sharing System Design

## 1. Assumptions and daily active users

The prompt does not specify traffic or image sizes, so these estimates use the following assumptions:

- 1,000,000 registered users.
- 20% of registered users are active on an average day.
- Each daily active user uploads 0.2 photos per day (one photo per five active users).
- Each daily active user views 10 feeds per day.
- An original photo averages 3 MB.
- A day has 86,400 seconds; peak feed traffic is 5 times the average.

Daily active users (DAU):

`1,000,000 users x 0.20 = 200,000 DAU`

## 2. Traffic and storage estimates

Uploads per day:

`200,000 DAU x 0.2 uploads/user/day = 40,000 uploads/day`

Average uploads per second:

`40,000 / 86,400 = 0.46 uploads/second`

Feed views per day:

`200,000 DAU x 10 views/user/day = 2,000,000 feed views/day`

Average feed views per second:

`2,000,000 / 86,400 = 23.15 feed views/second`

Peak feed views per second (5x average):

`23.148 x 5 = 115.74 feed views/second`

Original photo storage per year:

`40,000 photos/day x 3 MB/photo x 365 days = 43,800,000 MB/year`

That is about **43.8 TB per year** using decimal storage units. This estimate excludes thumbnails, replicas, backups, and storage overhead.

## 3. Read-heavy or write-heavy?

This system is read-heavy: the estimate has 2,000,000 feed views per day versus 40,000 uploads, about 50 feed reads per upload. The design should cache feed metadata and serve image files through a CDN, so common reads do not repeatedly load the database or object-storage origin. Uploads and thumbnail creation can be handled asynchronously so bursts of writes do not block feed requests.

## 4. Photo storage

Photos are large binary objects; storing them in a relational database would make database backups, replication, and queries heavier and more expensive. Store originals and thumbnails in object storage, and keep their object keys, owner, timestamps, and other searchable metadata in the database. A CDN can cache and deliver the image objects close to viewers.

## 5. Architecture

```text
                         +----------------------+
                         |      Web / Mobile    |
                         +----------+-----------+
                                    |
                       HTTPS API    |    Image URL
                                    |       |
                         +----------v--+    v
                         | API Gateway |  +-----+
                         +------+------+  | CDN |
                                |         +--+--+
                    +-----------+-----+      |
                    | Application API |      | cache miss
                    +---+----------+--+      v
                        |          |    +----+----------+
              feed data |          |    | Object Storage|
                        v          |    | originals and |
                 +------+-----+    |    | thumbnails    |
                 | Feed Cache |    |    +------+--------+
                 +------+-----+    |           ^
                        | miss     |           |
                        +----+     |      +----+----------+
                             v     +----->| Thumbnail     |
                      +------+-----+      | Worker        |
                      | Metadata DB|      +------+--------+
                      +------------+             ^
                                                 |
                                         +-------+------+
                                         | Job Queue    |
                                         +--------------+
```

## 6. Components

- **Web/mobile client:** Lets users upload photos and request feeds.
- **API gateway:** Routes HTTPS requests to the application and applies basic rate limits.
- **Application API:** Authenticates users, manages metadata, creates upload permissions, and returns feed data.
- **Feed cache:** Keeps frequently requested feed results ready to reduce database reads.
- **Metadata database:** Stores users, photo records, feed relationships, and object-storage keys.
- **Object storage:** Durably stores original photos and generated thumbnails.
- **Job queue:** Holds thumbnail work so uploads can finish before image processing completes.
- **Thumbnail worker:** Reads an original photo, creates smaller versions, stores them, and updates metadata.
- **CDN:** Caches and serves original or thumbnail objects near users.

## 7. Photo upload flow

1. The client asks the application API to begin an upload; the API checks the user's identity and file details.
2. The API creates a pending photo metadata record and returns a short-lived signed upload URL for object storage.
3. The client uploads the photo bytes directly to object storage, avoiding routing a large file through the application server.
4. Object storage confirms the upload and sends an event to the job queue.
5. A thumbnail worker takes the job, reads the original, creates thumbnail sizes, and writes them to object storage.
6. The worker updates the photo record with the thumbnail keys and marks the photo ready; the photo can now appear in feeds.
7. Viewers request feed metadata from the API/cache and load photo URLs through the CDN.

## 8. Trade-offs

- **Direct upload versus proxying through the API:** Signed direct uploads reduce application-server bandwidth and cost, but require careful URL expiry, file-size limits, and upload authorization.
- **Asynchronous thumbnails versus synchronous processing:** A queue makes uploads faster and isolates image processing, but a newly uploaded photo may briefly appear without its thumbnail while the job is pending.
- **Feed caching versus always reading the database:** Caching improves read speed and reduces database load, but cached feeds can be briefly stale and need an invalidation or expiry strategy.
