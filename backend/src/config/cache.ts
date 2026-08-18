
import NodeCache from 'node-cache';

// Std TTL = 60 seconds, Check period = 120
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

export default cache;
