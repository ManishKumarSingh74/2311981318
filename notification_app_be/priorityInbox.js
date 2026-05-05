const axios = require('axios');
const { Log } = require('../logging_middleware/index');

async function getPriorityInbox() {
    try {
        const inboxUrl = process.env.NOTIFICATIONS_API_URL || 'http://20.207.122.201/evaluation-service/notifications';
        
        let res;
        try {
            res = await axios.get(inboxUrl);
        } catch(err) {
            Log("backend", "error", "api", `Network or parsing error when calling Notifications API: ${err.message}`);
            return;
        }

        const items = res.data.notifications || res.data || [];
        
        if (items.length === 0) {
            Log("backend", "info", "api", "Successfully fetched notifications but the payload was empty.");
            return;
        }

        const calcScore = (typeStr) => {
            const val = (typeStr || '').toLowerCase();
            if (val === 'placement') return 3;
            if (val === 'result') return 2;
            if (val === 'event') return 1;
            return 0;
        };

        items.sort((item1, item2) => {
            const w1 = calcScore(item1.Type);
            const w2 = calcScore(item2.Type);
            
            if (w1 !== w2) {
                return w2 - w1;
            }
            
            const t1 = new Date(item1.Timestamp).getTime();
            const t2 = new Date(item2.Timestamp).getTime();
            
            return t2 - t1;
        });

        const sliced = items.slice(0, 10);
        
        Log("backend", "info", "handler", "Calculated and displaying top 10 priority notifications for user inbox.");
        sliced.forEach((notify, idx) => {
            Log("backend", "info", "handler", `${idx+1}. [${(notify.Type || 'UNKNOWN').toUpperCase()}] ${notify.Message} (ID: ${notify.ID}) - ${notify.Timestamp}`);
        });
        
    } catch (e) {
        Log("backend", "fatal", "handler", `Unexpected fatal error in priority inbox processor: ${e.message}`);
    }
}

getPriorityInbox();
