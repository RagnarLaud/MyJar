import twilio from 'twilio';

let Client = twilio.LookupsClient;

/**
 * The formatter constructor function.
 * Contains functions for formatting data
 * to be used where different formatting is
 * required.
 * @constructor
 */
function Formatter() {

    this.twilioClient = null;

    /**
     * Formats the mobile number by removing any un-needed characters from it
     */
    this.formatMobileNumber = async number => await new Promise(resolve => {
        if (typeof number !== 'string') return resolve(false);

        if (this.twilioClient)
            this.twilioClient.phoneNumbers(number).get((error, result) => {
                if (error) {
                    if ('ENOTFOUND' === error.status) {
                        return resolve(number.replace(/\s/g, ''));
                    }
                    return resolve(null);
                }

                let {country_code, phone_number} = result;

                if ('GB' !== country_code) return resolve(null);
                else return resolve(phone_number);
            });
        else throw new Error('Twilio client not set up for Formatter');
    });

    /**
     * Formats the mobile number for showing publicly.
     * The output string will only have the last 4 digits visible,
     * and the rest will be replaced by an asteric
     */
    this.formatPublicMobileNumber = number => {
        let visible = number.substr(-4);
        let hidden  = number.substr(0, number.length - 4);
        return hidden.replace(/(\d)/g, '*').concat(visible);
    };

    /**
     * Creates a minimal client object from a client document.
     * This will not contain any document-specific variables,
     * but only what the API user should need.
     */
    this.formatClientFromDocument = (document) => {
        let {id, email, mobile, information} = document;
        let object                           = {id, email, mobile};

        if (information) for (let {name, value} of information) {
            // Don't overwrite any variables
            // Lazy way of avoiding overwriting the id, email and mobile fields.
            if (!object[name])
                object[name] = value;
        }

        return object;
    };

    /**
     * Returns the array of arbitrary fields within a set of fields.
     * Basically just creates a new object and copies the parameters over
     * in the format they are stored, skipping the email, mobile, and id.
     */
    this.formatFromFields = (fields) => {
        return Object.keys(fields)
            .reduce((information, key) => {
                if (key !== 'email' && key !== 'mobile' && key !== 'id')
                    information.push({
                        name: key,
                        value: fields[key]
                    });
                return information;
            }, []);
    };
}

/**
 * Validator constructor function.
 * Contains functions for validating the mobile number
 * and the email address
 * @constructor
 */
function Validator() {
    /**
     * Will matches most email addresses that follow the email address formatting rules.
     */
    let REGEX_EMAIL  = /^([a-zA-Z0-9_+-]+)((\.[a-zA-Z0-9_+-]+)+)?@([a-zA-Z0-9_+-]+)((\.[a-zA-Z0-9_+-]+)+)$/;
    /**
     Simple mobile regex, used as a fallback when twilio.com can not be reached.
     This matches +44 XX XXXX XXXX, +44 XX-XXXX-XXXX and +44XXXXXXXXXX.
     */
    let REGEX_MOBILE = /^(\+44)((\s\d{2}\s\d{4}\s\d{4})|(\s\d{2}-\d{4}-\d{4})|(\d{10}))$/;

    /**
     * The Twilio API client
     */
    this.twilioClient = null;

    /**
     * Validates the mobile number.
     * @param number
     */
    this.validateMobile = async number => await new Promise(resolve => {
        if (typeof number !== 'string') return resolve(false);

        if (this.twilioClient)
            this.twilioClient.phoneNumbers(number).get((error, result) => {
                if (error) {
                    if ('ENOTFOUND' === error.status) {
                        if (null !== number.match(REGEX_MOBILE))
                            return resolve(true);
                    }
                    return resolve(false);
                }

                if ('GB' !== result.country_code) return resolve(false);
                else return resolve(true);
            });
        else throw new Error('Twilio client not set up for Validator');
    });

    /**
     * Validates the email against the email regex
     */
    this.validateEmail = async email => null !== email.match(REGEX_EMAIL);
}

export default function Utils() {
    this.validator = new Validator();
    this.formatter = new Formatter();
    this.twilio    = null;

    this.initialize = ({sid, token}) => {
        this.twilio = new Client(sid, token, {});
        this.validator.twilioClient = this.twilio;
        this.formatter.twilioClient = this.twilio;
    };

    this.middleware = (req, res, next) => (req.utils = this) && next();
}