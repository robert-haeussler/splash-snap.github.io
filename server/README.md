# splash-snap.github.io/server

This is the directory for the .java files run on the server.
All files in / should be sent on receiving a GET request for them.

## Special files/endpoints

/api/http/ and /api/socket/ are special directories. they are used in the following ways:

/api/http/*projectCreatorUsername*/*projectName*/*variableName*/
	return the current value of the var

/api/socket/*projectCreatorUsername*/*projectName*/*variableName*/
	open a websocket connection with the client. If the client is from the current domain, allow them to set the vars. Otherwise, only send them changes and ignore their input.

/api/restart/ is also a special directory: It tells the server to load a change from github