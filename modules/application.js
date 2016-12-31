import path from 'path';
import {fs} from 'mz';
import express from 'express';
import bodyParser from 'body-parser';

import Database from './database';
import Utils from './utils';
import Encryption from './encryption';

import API from '../routes/api';

/**
 * The Application constructor function
 * @param settingsPath  The path to the settings file
 * @constructor
 */
export default function Application(settingsPath) {
    this.express  = express();
    this.database = new Database();
    this.utils    = new Utils();
    this.api      = new API();
    this.enc      = new Encryption();
    this.settings = {};

    /**
     * Starts the application and everything
     * needed by the application.
     */
    this.start = async() => {
        settingsPath = settingsPath || path.resolve(__dirname, '..', 'config.json');

        if(true !== await fs.exists(settingsPath)) await fs.writeFile(settingsPath, '{}');

        let settings = JSON.parse(await fs.readFile(settingsPath, 'utf-8'));
        for (let key in settings)
            if (settings.hasOwnProperty(key))
                this.settings[key] = settings[key];

        this.settings.database          = this.settings.database || {};
        this.settings.database.hostname = this.settings.database.hostname || 'localhost';
        this.settings.database.port     = this.settings.database.port || 27017;
        this.settings.database.username = this.settings.database.username || '';
        this.settings.database.password = this.settings.database.password || '';
        this.settings.database.database = this.settings.database.database || 'myjar';

        this.settings.twilio = this.settings.twilio || {};
        this.settings.twilio.sid = this.settings.twilio.sid || 'INSERT TWILIO SID HERE';
        this.settings.twilio.token = this.settings.twilio.token || 'INSERT TWILIO TOKEN HERE';

        await this.enc.initialize({passphrasePath: this.settings.encryptionKey});
        await this.utils.initialize(this.settings.twilio);
        await this.database.connect(
            this.settings.database.hostname,
            {
                port: this.settings.database.port,
                user: this.settings.database.username,
                pass: this.settings.database.password,
                name: this.settings.database.database
            });

        this.settings.encryptionKey = this.enc.passphrasePath;
    };

    /**
     * Closes the application and everything
     * that was in use by it
     */
    this.close = async() => {
        await this.database.close();
        await fs.writeFile(settingsPath, JSON.stringify(this.settings, null, 4));
    };

    this.express.use(this.enc.middleware);
    this.express.use(this.database.middleware);
    this.express.use(this.utils.middleware);
    this.express.use(bodyParser.json());

    this.express.use(this.api.router);

    process.on('beforeExit', this.close);
};