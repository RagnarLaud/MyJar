# API Usage Guide and Documentation

## GET /clients

Get a page of clients

If no field queries are given, all clients from the page will be returned. 

Searching by mobile number is not implemented (or rather allowed) due to
it making possible to brute-force mobile numbers and their respective
email addresses. Searching using the mobile field will not cause errors,
but it will simply be ignored.

### URL Parameters
    f:fieldName A field query - optional
	page        The page index (1...n) - optional, defaults to 1
	pageSize    The page size (1...100) - optional, defaults to 10

### Usage
    Request: 
        GET /clients/?page=1&pageSize=32&f:email=example&f:foo=bar
    Response:
        {
            "id": "xxxxx"
            "email": "example@example.org",
            "mobile": "+********9999",
            "foo": "bar"
        }

### Possible Responses
#### 200 OK - Request successful
    [
        {
            "id": "...",        The unique client ID
            "email": "...",     The client's email address
            "mobile": "...",    The client's mobile number
            "...": "..."        Arbitrary data
        },
        ...
    ]
#### 400 Bad Request - Invalid page parameters
    []
    
## GET /client/:id

Get client with corresponding :id

### Possible Responses
#### 200 OK - Request successful
    {
        "id": "..."             The unique client ID
        "email": "...",         The client's email address
        "mobile": "...",        The client's mobile number
        "...": "..."            Arbitrary data
    }

#### 404 Not Found - The ID is not associated with a client
    {}

## PUT /client/

Insert a client into the database

The fields can include any amount of arbitrary data,
and must include a valid email address and a valid UK mobile
number. Arbitrary data fields can only contain values of type
`string`, `number` or `boolean`. Anything else will trigger a 
406 Not Acceptable response.

### Required Fields In The Request Body
    email: 		                A valid email address
    mobile: 	                A valid UK mobile number
    
### Usage
    Request: 
        PUT /client
            {
                "email": "example@example.org",
                "mobile": "+44 20 9999 9999",
                "arbitrary": "both",
                "name": "and value"
            }
    Response:
        200 OK
            {
                "id": "aValidClientID",
                "email": "example@example.org",
                "mobile": "+********9999",
                "arbitrary": "both",
                "name": "and value"
            }

### Possible Responses:
#### 201 Created - Client created successfully
    {
        "id": "...",            The unique client ID
        "email": "...",         The client's email address
        "mobile": "...",        The client's mobile number
        "...": "..."            Arbitrary data
    }
#### 406 Not Acceptable - Fields contain invalid data
    [
        "email",                If the email was invalid
        "mobile",               If the mobile was invalid
        "field"                 If "field" contained invalid data    
    ]
#### 400 Bad Request - Email or mobile number missing from request
    [
        "email"                 If the email was missing
        "mobile"                If the mobile was missing         
    ]

## PUT /client/:id

Modify the data of the client with the corresponding :id

This is almost identical to ` PUT /client/ ` in the way that
the request body contains similar data. Only send the fields you want to modify.
When editing the email or mobile number, they must be valid, otherwise the
client will not be modified. 
When sending an arbitrary data field with no value (an empty string), 
the field will be removed.
When sending a new arbitrary data field, it will be added to the list of fields.
Arbitrary data field values must be of type `string`, `number` or `boolean`.

### Usage
    Request:
        PUT /client/foobar1234567890
            {
                "email": "modified@example.org",
                "arbitrary": "",
                "name and": "value"
            }
    Response:    
        200 OK
            {
                "id": "foobar1234567890",
                "email": "modified@example.org",
                "mobile": "+********9999",
                "name": "and value",
                "name and": "value"
            }

### Possible Responses:
#### 200 OK - Client modified successfully
    {
        "id": "...",            The unique client ID
        "email": "...",         The client's email address
        "mobile": "...",        The client's mobile number
        "...": "..."            Arbitrary data
    }
#### 404 Not Found - No client associated with the specified :id
    {}
#### 406 Not Acceptable - Fields contain invalid data
    [
        "email",                If the email was invalid
        "mobile",               If the mobile was invalid
        "field"                 If "field" contained invalid data
    ]
## DELETE /client/:id
Delete the client with the corresponding :id

### Possible Responses:
#### 200 OK Client deleted successfully
    {}
#### 404 Not Found - No client associated with the specified :id
    {}