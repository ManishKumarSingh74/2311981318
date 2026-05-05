const axios = require('axios');
const { Log } = require('../logging_middleware/index');

async function getPriorityInbox() {
    try {
        const url = process.env.NOTIFICATIONS_API_URL || 'http://20.207.122.201/evaluation-service/notifications';
        
        let response;
        try {
            response = await axios.get(url);
        } catch(error) {
            Log("backend", "error", "api", `Network or parsing error when calling Notifications API: ${error.message}`);
            return;
        }

        const notifications = response.data.notifications || response.data || [];
        
        if (notifications.length === 0) {
            Log("backend", "info", "api", "Successfully fetched notifications but the payload was empty.");
            return;
        }

        const getWeight = (type) => {
            const t = (type || '').toLowerCase();
            if (t === 'placement') return 3;
            if (t === 'result') return 2;
            if (t === 'event') return 1;
            return 0;
        };

        notifications.sort((a, b) => {
            const weightA = getWeight(a.Type);
            const weightB = getWeight(b.Type);
            
            if (weightA !== weightB) {
                return weightB - weightA;
            }
            
            const timeA = new Date(a.Timestamp).getTime();
            const timeB = new Date(b.Timestamp).getTime();
            
            return timeB - timeA;
        });

        const top10 = notifications.slice(0, 10);
        
        Log("backend", "info", "handler", "Calculated and displaying top 10 priority notifications for user inbox.");
        top10.forEach((n, i) => {
            Log("backend", "info", "handler", `${i+1}. [${(n.Type || 'UNKNOWN').toUpperCase()}] ${n.Message} (ID: ${n.ID}) - ${n.Timestamp}`);
        });
        
    } catch (error) {
        Log("backend", "fatal", "handler", `Unexpected fatal error in priority inbox processor: ${error.message}`);
    }
}

getPriorityInbox();
