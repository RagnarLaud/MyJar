import http from 'http';

import Application from '../modules/application';

(async function main(args){

    let application = new Application({settingsPath: 'config.json'});

	for(let argument of args){
		if(argument.toLowerCase() === 'setup'){
            console.log(`Running setup procedure only`);
            await application.setup();
            await application.close();
            console.log(`Setup procedure finished`);
            process.exit(0);
		}
	}

    let server = http.createServer(application.express);

	await application.setup();
	await application.start();
	await server.listen(3000);
})(process.argv);