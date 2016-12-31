import mongoose, {Schema, Types} from 'mongoose';
import crypto from 'crypto';

mongoose.Promise = global.Promise;

/**
 * The client handler constructor function.
 * Contains all the functions for manipulating clients
 * and data associated with them.
 * @constructor
 */
function ClientHandler() {
    /** The client model and schema */
    let Client      = {
        /** @type Model */
        model: null,
        /** @type Schema */
        schema: null
    };
    /** The information model and schema */
    let Information = {
        /** @type Model */
        model: null,
        /** @type Schema */
        schema: null
    };

    /**
     * Creates the schemas and models
     * @param {Connection} connection The mongoose connection
     */
    this.prepareDatabase = async connection => {
        Client.schema      = new Schema({
            id: {
                type: String,
                required: true
            },
            email: {
                type: String,
                required: true
            },
            mobile: {
                type: String,
                required: true
            },
            information: [{name: String, value: String}]
        });
        Information.schema = new Schema({
            client: {
                type: String,
                required: true
            },
            name: {
                type: String,
                required: true
            },
            value: {
                type: String,
                required: true
            }
        });

        Information.model = connection.model('Information', Information.schema);
        Client.model      = connection.model('Client', Client.schema);
    };

    /**
     * Updates the array of arbitrary information fields
     * inside the client document.
     * @param {Model} document The document to update
     */
    this.updateClientInformation = async(document) => {
        let rows        = await Information.model.find({client: document.id});
        let information = [];

        // Populate the information array with all the information rows found
        for (let {name, value} of rows) {
            information.push({name, value});
        }

        // Insert the information array into the client document
        document.information = information;
    };

    /**
     * Adds a client into the database
     * @param email The client's email address
     * @param mobile The client's mobile number
     * @param information The client's arbitrary fields
     * @returns {Model} The document
     */
    this.addClient = async(email, mobile, information) => {
        // Create a new sha256 hash object
        let hash   = crypto.createHash('sha256');
        // Generate a random number from 0-1000
        let random = Math.floor(Math.random() * 1000);
        // Use the email address, mobile number, registration timestamp,
        // and the generated number to produce a hash that will, with a very high probability,
        // be unique.
        let id       = (hash.update(`${email}${mobile}${new Date().getTime()}${random}`)) &&
            hash.digest('hex');
        let document = new Client.model({id, email, mobile});

        // Create the information rows for the arbitrary information
        for (let {name, value} of information) {
            if (name && value) {
                let document_row = new Information.model({client: document.id, name, value});

                await document_row.validate();
                await document_row.save();
            }
        }

        // Update the arbitrary information inside the client document
        await this.updateClientInformation(document);
        await document.validate();
        await document.save();

        return document;
    };

    /**
     * Modifies the client using the data specified
     * @param id The ID of the client
     * @param email The new email address
     * @param mobile The new mobile number
     * @param information The arbitrary information fields
     * @returns {Model|null} The modified client document or null if the client was not found
     */
    this.modifyClient = async(id, {email, mobile, information}) => {
        let document = await Client.model.findOne({id});

        if (null === document) return null;

        if ('undefined' !== typeof email)
            document.email = email;

        if ('undefined' !== typeof mobile)
            document.mobile = mobile;

        // If an array of informational fields is given
        if ('undefined' !== typeof information)
        // Loop through all of them, taking the name and value properties from each
            for (let {name, value} of information) {
                // Find the row that belongs to the specified user and has the specified name
                let row = await Information.model.findOne({client: id, name});

                // If a row was found
                if (null !== row) {
                    // And a value was not given, delete
                    if (!value) {
                        await row.remove();
                    }
                    // Otherwise change the value to the given one
                    else {
                        row.value = value;
                        await row.validate();
                        await row.save();
                    }
                } else if (name && value) {
                    row = new Information.model({client: id, name, value});
                    await row.validate();
                    await row.save();
                }
            }

        // Update the arbitrary information inside the client document
        await this.updateClientInformation(document);
        await document.validate();
        await document.save();

        return document;
    };

    /**
     * Delete the client
     * @param id The client ID
     * @returns {boolean} Whether the client was deleted or not
     */
    this.deleteClient = async(id) => {
        let document = await Client.model.findOne({id});

        if (null === document)
            return null;

        await Information.model.remove({client: id});
        await document.remove();

        return true;
    };

    /**
     * Returns a client by it's ID
     * @param id The client ID
     * @returns {Model|null} The client document or null if the client was not found
     */
    this.getClient = async(id) => {
        return await Client.model.findOne({id});
    };

    /**
     * Returns a set of clients within the specified bounds
     * @param skip The amount of clients to skip
     * @param limit The maximum amount of clients to return
     * @returns {Array<Model>} The array of client documents
     */
    this.getClients = async({skip, limit}) => {
        return await Client.model.find({}, null, {skip, limit});
    };

    /**
     * Find clients by a criteria
     * @param {Array} criteria  An array of field queries.
     * Each element is an object containing a field and query parameter.
     * @param skip The amount of clients to skip
     * @param limit The maximum amount of clients to return
     * @returns {null|Array<Model>} The array of client documents found or null
     * if criteria is not an array
     */
    this.findClientsByFields = async(criteria, {skip, limit}) => {
        let clientSearch      = {};
        let informationSearch = [];
        let $or               = [];

        if (!Array.isArray(criteria)) return null;
        if (criteria.length === 0) return [];

        // TODO: Escape all regex characters from the criteria

        for (let {field, query} of criteria) {
            if (field !== 'mobile') {
                // If the client schema contains the specified field,
                // look for client models matching that
                if (Client.schema.paths[field] && query)
                    clientSearch[field] = new RegExp(query, 'i');
                // Otherwise look for information fields matching the query
                else
                    informationSearch.push({name: field, value: new RegExp(query, 'i')});
            }
        }

        // Search for information matches
        let informationMatches = informationSearch.length ?
            await Information.model.find({$or: informationSearch}) : [];

        // Create the query using the information gathered
        if (informationMatches.length) {
            for (let {client} of informationMatches) {
                let search = {id: client};
                if (clientSearch.email) search.email = clientSearch.email;
                $or.push(search);
            }
        } else if (Object.keys(clientSearch).length) {
            $or.push(clientSearch);
        }

        return $or.length ? await Client.model.find({$or}, null, {skip, limit}) : [];
    };
}

/**
 * The database constructor function
 * @constructor
 */
export default function Database() {
    this.connection    = null;
    this.clientHandler = new ClientHandler();

    /**
     * Performs database setup
     */
    this.setup = async() => {
        await this.clientHandler.prepareDatabase(this.connection);
    };

    this.addClient    = this.clientHandler.addClient.bind(this.clientHandler);
    this.modifyClient = this.clientHandler.modifyClient.bind(this.clientHandler);
    this.deleteClient = this.clientHandler.deleteClient.bind(this.clientHandler);

    this.getClient           = this.clientHandler.getClient.bind(this.clientHandler);
    this.getClients          = this.clientHandler.getClients.bind(this.clientHandler);
    this.findClientsByFields = this.clientHandler.findClientsByFields.bind(this.clientHandler);

    /**
     * Creates a connection to the database
     * @param hostname The database hostname
     * @param port The database port
     * @param user The database username
     * @param pass The database password
     * @param name The database name
     */
    this.connect = async(hostname, {port, user, pass, name}) => {
        // Start the connection url
        let connectionUrl = `mongodb://`;

        // If the username and password are specified,
        // use them in the url
        if (user) connectionUrl += `${user}:`;
        if (user && pass) connectionUrl += `${pass}`;

        // Add the hostname
        connectionUrl += `${hostname}`;

        // If the port is specified, add it
        if (port) connectionUrl += `:${port}`;
        // If the database name is specified, add it
        if (name) connectionUrl += `/${name}`;

        // Create the connection
        this.connection = await mongoose.createConnection(connectionUrl);

        // Perform the database setup
        await this.setup();
    };

    /**
     * Closes the connection to the database
     */
    this.close      = async() => await this.connection.close();
    /**
     * The middleware function that adds the database into the request object
     */
    this.middleware = (req, res, next) => (req.database = this) && next();

};