import express from 'express';

const PAGE_SIZE_CAP = 100;

export default function API() {

    this.router = express.Router();

    this.router.route('/clients')
        .get(async(req, res) => {

            let page     = 1;
            let pageSize = 10;
            let search   = [];

            if (req.query.page) page = Number(req.query.page);
            if (req.query.pageSize) pageSize = Number(req.query.pageSize);

            if (true !== (
                    (true !== isNaN(page) && page > 0) &&
                    (true !== isNaN(pageSize) && pageSize > 0)
                )) {
                return res.status(400).send([]);
            }

            if (pageSize > PAGE_SIZE_CAP) pageSize = PAGE_SIZE_CAP;

            for (let key of Object.keys(req.query)) {
                if (key.startsWith('f:')) {
                    let field = key.split(':')[1];
                    let query = req.query[key];
                    search.push({field, query});
                }
            }

            let clientDocuments = [];

            if (search.length) {
                clientDocuments = await req.database.findClientsByFields(search, {
                    skip: (page - 1) * pageSize,
                    limit: pageSize
                });
            } else {
                clientDocuments = await req.database.getClients({
                    skip: (page - 1) * pageSize,
                    limit: pageSize
                });
            }

            let clients = clientDocuments.reduce((clients, document) => {
                let client    = req.utils.formatter.formatClientFromDocument(document);
                client.mobile = req.encryption.decrypt(client.mobile);
                client.mobile = req.utils.formatter.formatPublicMobileNumber(client.mobile);
                clients.push(client);
                return clients;
            }, []);

            res.status(200).send(clients);
        });

    this.router.route('/client')
        .put(async(req, res) => {
            let {email, mobile} = req.body;
            let missing         = [];
            let invalid         = [];

            // If the email is not specified or is invalid, prompt
            if ('undefined' === typeof email)
                missing.push('email');
            else if(true !== await req.utils.validator.validateEmail(email))
                invalid.push('email');

            // If the mobile number is not specified or is invalid, prompt
            if ('undefined' === typeof mobile)
                missing.push('mobile');
            else if(true !== await req.utils.validator.validateMobile(mobile))
                invalid.push('mobile');

            // If at least one error emerged, respond with a 406
            if (missing.length > 0) {

                return res.status(400).send(missing);
            }
            if (invalid.length > 0) {

                return res.status(406).send(invalid);
            }

            // Format and encrypt the mobile number
            mobile = await req.utils.formatter.formatMobileNumber(mobile);
            mobile = req.encryption.encrypt(mobile);

            // Get the information fields from the request body
            let information       = req.utils.formatter.formatFromFields(req.body);
            let informationErrors = [];

            for (let {name, value} of information) {
                if (
                    typeof value !== 'string' &&
                    typeof value !== 'number' &&
                    typeof value !== 'boolean'
                ) informationErrors.push(name);
            }

            if (informationErrors.length) {
                return res.status(406).send(informationErrors);
            }

            // Construct a client document using the data
            let document = await req.database.addClient(email, mobile, information);
            // Construct a public client object from the document
            let client   = req.utils.formatter.formatClientFromDocument(document);

            // Decrypt the mobile number and make it safe to show
            client.mobile = req.encryption.decrypt(client.mobile);
            client.mobile = req.utils.formatter.formatPublicMobileNumber(client.mobile);

            // Send the client

            res.status(201).send(client);
        });

    this.router.route('/client/:id')
        .get(async(req, res) => {
            let id = req.params.id;

            let document = await req.database.getClient(id);

            if (null === document) {

                return res.status(404).send({});
            }

            let client    = req.utils.formatter.formatClientFromDocument(document);
            client.mobile = req.encryption.decrypt(client.mobile);
            client.mobile = req.utils.formatter.formatPublicMobileNumber(client.mobile);


            res.status(200).send(client);
        })
        .put(async(req, res) => {
            let id              = req.params.id;
            let {email, mobile} = req.body;
            let invalid         = [];

            // If the email is specified, but is invalid, prompt
            if (
                'undefined' !== typeof email &&
                true !== await req.utils.validator.validateEmail(email)
            ) invalid.push('email');

            // If the mobile number is specified, but is invalid, prompt
            if (
                'undefined' !== typeof mobile &&
                true !== await req.utils.validator.validateMobile(mobile)
            ) invalid.push('mobile');

            // If at least one error emerged, respond with a 406
            if (invalid.length > 0) {

                return res.status(406).send(invalid);
            }

            // If the mobile number was specified, encrypt it
            if (mobile) {
                mobile = await req.utils.formatter.formatMobileNumber(mobile);
                mobile = req.encryption.encrypt(mobile);
            }

            // Extract the information fields from the request body
            let information       = req.utils.formatter.formatFromFields(req.body);
            let informationErrors = [];

            for (let {name, value} of information) {
                if (
                    typeof value !== 'string' &&
                    typeof value !== 'number' &&
                    typeof value !== 'boolean'
                ) informationErrors.push(name);
            }

            if (informationErrors.length) {

                return res.status(406).send(informationErrors);
            }

            // Modify the client and retrieve the client object
            let document = await req.database.modifyClient(id, {email, mobile, information});

            // If the document was not found, respond with a 404
            if (null === document) return res.status(404).send({});

            // Construct a public client object from the document
            let client = req.utils.formatter.formatClientFromDocument(document);

            // Decrypt the mobile number and format it to be safe to show
            client.mobile = req.encryption.decrypt(client.mobile);
            client.mobile = req.utils.formatter.formatPublicMobileNumber(client.mobile);

            // Respond with the public client object

            res.status(200).send(client);
        })
        .delete(async(req, res) => {
            let id = req.params.id;

            let deleted = await req.database.deleteClient(id);

            if (true === deleted) {

                res.status(200).send({});
            } else {

                res.status(404).send({});
            }
        });

    this.router.use((req, res) => res.status(400).send({}));
}