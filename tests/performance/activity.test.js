import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    vus: 5, // virtual users
    duration: '10s', // run for 10 seconds
};

const baseUrl = 'http://localhost:3000/api/activity'; // ปรับตามที่ server คุณรัน

export default function () {
    // 1. GET all activities
    const getRes = http.get(baseUrl);
    check(getRes, {
        'GET /api/activity: status 200': (r) => r.status === 200,
        'GET /api/activity: return JSON': (r) => r.headers['Content-Type'].includes('application/json'),
    });

    // 2. CREATE (POST) activity - without image
    const payload = JSON.stringify({
        title: 'Test Activity',
        content: 'Just testing',
        detail: 'Details...',
        lecturer: 'Dr. Test',
        start_date: '2025-08-10',
        end_date: '2025-08-12',
    });

    const headers = {
        'Content-Type': 'application/json',
    };

    const postRes = http.post(baseUrl, payload, { headers });
    check(postRes, {
        'POST /api/activity: status 201': (r) => r.status === 201,
    });

    // 3. Extract inserted ID (ถ้าต้องทำต่อ)
    const activityId = JSON.parse(postRes.body)?.result?.insertId;
    if (!activityId) {
        console.warn('No activity ID returned from POST');
        return;
    }

    // 4. GET by ID
    const getById = http.get(`${baseUrl}/${activityId}`);
    check(getById, {
        'GET by ID: status 200': (r) => r.status === 200,
    });

    // 5. UPDATE activity (PUT method)
    const updatePayload = JSON.stringify({
        title: 'Updated Title',
        lecturer: 'Prof. Update',
    });

    const putRes = http.put(`${baseUrl}/${activityId}`, updatePayload, { headers });
    check(putRes, {
        'PUT /api/activity/:id: status 200': (r) => r.status === 200 || r.status === 204,
    });

    // 6. DELETE
    const deleteRes = http.del(`${baseUrl}/${activityId}`);
    check(deleteRes, {
        'DELETE /api/activity/:id: status 200': (r) => r.status === 200,
    });

    sleep(1);
}
