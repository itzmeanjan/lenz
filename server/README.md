## magneto-server

Express Application for facilitating location lookup by IPv _{4,6}_ address. 

## setup

- Create a `config.env` file in current working directory, with content similar to it. Update `DB` field's value with path to unzipped [ip2location db5](https://lite.ip2location.com/database/ip-country-region-city-latitude-longitude) bin file (ipv6).

```text
HOST=0.0.0.0
PORT=8000
DB=../ip2location-db5-ipv6-file.bin
```

- Install all dependencies

```bash
npm install
```

- Run express application

```bash
node index.js
```

## usage

Sending a GET request at `/ip/{addr}`, where **addr** is a valid IPv _{4,6}_ address, returns JSON response like below.

```json
{
	"ip": "32.88.0.1",
	"lon": -81.34584,
	"lat": 28.75992,
	"region": "Florida",
	"country": "United States of America"
}
```

In case of bad IP, returns error indication, using

```json
{
	"msg": "Bad Input"
}
```

Assuming **HOST** & **PORT** were set to `127.0.0.1` & `8000` respectively, following command will lookup location info associated with `32.88.0.1`

```bash
curl -X GET http://localhost:8000/ip/32.88.0.1
```
