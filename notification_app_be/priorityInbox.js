const axios = require('axios');
const { logger } = require('../logging_middleware/index');

async function getPriorityInbox() {
    try {
        const url = process.env.NOTIFICATIONS_API_URL || 'http://20.207.122.201/evaluation-service/notifications';
        
        let response;
        try {
            response = await axios.get(url);
        } catch(error) {
            logger.error(`Failed to fetch notifications: ${error.message}`);
            return;
        }

        const notifications = response.data.notifications || response.data || [];
        
        if (notifications.length === 0) {
            logger.info("No notifications found.");
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
        
        logger.info("--- TOP 10 PRIORITY INBOX ---");
        top10.forEach((n, i) => {
            logger.info(`${i+1}. [${(n.Type || 'UNKNOWN').toUpperCase()}] ${n.Message} (ID: ${n.ID}) - ${n.Timestamp}`);
        });
        
    } catch (error) {
        logger.error(`Error: ${error}`);
    }
}

getPriorityInbox();
