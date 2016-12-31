import http from 'http';

import Application from '../modules/application';

(async function main(){
	let application = new Application('../config.json');
	let server = http.createServer(application.express);
	
	await application.start();
	await server.listen(3000);
})();