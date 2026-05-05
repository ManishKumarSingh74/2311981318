# Stage 1

For the core API, we basically just need a few endpoints to handle fetching and reading notifications.

`GET /api/v1/notifications`
Pass the auth token in headers. You can send `page`, `limit`, and an `unreadOnly` flag in the query params to paginate or filter.
The response will just look like this:
```json
{
  "notifications": [
    {
      "id": "d146095a-0d86-4a34-9e69-3900a14576bc",
      "type": "result",
      "message": "mid-sem",
      "isRead": false,
      "timestamp": "2026-04-22 17:51:30"
    }
  ],
  "meta": { "total": 100, "page": 1, "unreadCount": 5 }
}
```

`PUT /api/v1/notifications/:id/read`
Just hit this endpoint to mark a specific notification as read.

`PUT /api/v1/notifications/read-all`
Marks everything as read for the logged-in user.

For real-time updates, Server-Sent Events (SSE) makes the most sense here. Since we're only pushing data from the server to the client, we don't really need the full two-way communication of WebSockets. The client can just listen to a stream endpoint.

# Stage 2

I'd definitely go with PostgreSQL for storage. Notifications are pretty structured (we know we need user IDs, timestamps, read statuses), so a relational database works perfectly. Plus, Postgres handles indexing really well which we'll need.

Here's the schema I'd use:
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

As the table gets huge, simple queries are going to slow down. To fix that, we'll need to add composite indexes on the fields we query the most (like `student_id` and `is_read`). Eventually, when we have way too many rows, we can set up table partitioning based on the `created_at` date so we can easily archive or drop old data without locking up the database.

Here are the queries we'd use:
```sql
SELECT * FROM notifications WHERE student_id = 1042 ORDER BY created_at DESC LIMIT 20;

UPDATE notifications SET is_read = TRUE WHERE id = 'uuid';
```

# Stage 3

The query is super slow because the database has to scan way too many rows or do an expensive sort in memory since there's no proper index.

We can fix this by adding a composite index that matches exactly what the query is looking for:
```sql
CREATE INDEX idx_student_unread_recent 
ON notifications (studentID, isRead, createdAt DESC);
```

With this index, the database can instantly find the exact block of unread notifications for that specific student. And since we added `createdAt DESC` right into the index, the results are already sorted. The database just grabs the top rows without having to sort anything at runtime, making the query basically instant.

# Stage 4

Fetching notifications on every single page load is going to destroy the database. 

We have a couple ways to solve this:
First, we could use Redis to cache the unread notifications. When a user loads a page, we just read from memory instead of hitting the database. The downside is that it takes up RAM and we have to write extra logic to invalidate the cache whenever a notification gets read.

Alternatively, we could use WebSockets or SSE. Instead of the frontend constantly asking for notifications, it just keeps one connection open and the server pushes updates when they happen. This is great for UX and saves a ton of HTTP requests, but keeping thousands of connections open at once can be tough on the server's memory.

# Stage 5

The current pseudocode is doing everything synchronously. If an email fails, it might break the loop, and the rest of the students won't get their notifications. Also, waiting for 50,000 emails to send in one loop will take forever.

We need to decouple the database save from the email sending. Saving to the database is fast, but hitting an external email API is slow and unreliable. We should use a message queue like RabbitMQ or Kafka to handle this in the background.

Here's how I'd rewrite it:
```python
function notify_all(student_ids: array, message: string):
    for student_id in student_ids:
        publish_to_queue("notification_events", { student_id, message })

function worker_process_notification(event):
    student_id, message = event.student_id, event.message
    
    db_success = save_to_db(student_id, message)
    
    if db_success:
        enqueue_app_push(student_id, message)
        enqueue_email(student_id, message)
```

# Stage 6

To keep track of the top 10 notifications without spamming the database or sorting massive arrays in memory, we can use a Min-Heap.

We just keep a priority queue of size 10 in memory. Whenever a new notification comes in, we calculate its priority (combining the weight of its type and its timestamp). If this priority is higher than the lowest priority currently sitting in our top 10 (which is always at the root of the Min-Heap), we pop the root out and insert the new one. 

This keeps the insertion time at `O(log 10)`, which is incredibly fast, and we always have the top 10 ready to go without any heavy processing.
