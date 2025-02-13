db = db.getSiblingDB('subkeydb');
db.createCollection('publickey');
db.createUser({
	user: 'root',
	pwd: 'root',
	roles: [{
		role: "readWrite",
		db: 'subkeydb',
	}]
});
//db.adminCommand({setParameter:1, ttlMonitorSleepSecs: 86400}); // 1 day
