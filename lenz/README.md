# lenz 🤓

Console based MAP 🗺 , with lots of features 😉 

> More can be found [here](https://github.com/itzmeanjan/lenz#motivation)

## Features

- Given (sub-)domain name, it can look up all associated server IPv4/6 addresses, showing them in console map 🥴
- Given IPv4/6 address, can lookup it's location & show it in console map 🥳
- Can find all active TCP/UDP socket connections & marks their respective peers in console map 🤩

> Note: For 👆 operation, auto refresh has been enabled

- Given torrent 🧲 link, can look up all peers associated with that infohash & show them in console map 🤓
- Given any random URL, parses HTML & extracts out all static content i.e. {`*.js`, `*.css`, `image/*`} delivery domains & geo locate them 😎
- Given Autonomous System Number ( `ASN` ), geo locates all IPv4 addresses owned by this Autonomous System ( `AS` ) 😉🦾

> Caution: 👆 operation is very computationally intensive, for large Autonomous Systems, might take some time to complete, though it keeps streaming, as soon as it finds something useful

In all these cases, generates a tabular report of all connected peers _( including self )_, who were shown on console map

> Now also dumps peers along with location info into JSON file, for all supported commands

## Prerequisite

We need to download [IP2Location™ LITE IP-COUNTRY-REGION-CITY-LATITUDE-LONGITUDE Database](https://lite.ip2location.com/database/ip-country-region-city-latitude-longitude) for using this tool.

Consider using IPv6 Binary version, cause that will also support IPv4 lookup. This specific database, I've planned to use, is codenamed **db5**.

Please try to stick with that to avoid unexpected behaviours.

We'll also need [IP2Location™ LITE IP-ASN Database](https://lite.ip2location.com/database/ip-asn) for using `la` command. See [below](#geo-locate-ipv4-addresses-owned-by-some-autonomous-system--la-).
  - Please use IPv4 version of ASN Database

And you need to have NodeJS( >10.X ).

## Installation

Download & install from NPM.

```bash
npm i -g lenz
```

## Develop

You can clone this repo in your machine & try to do installation another way.

```bash
git clone git@github.com:itzmeanjan/lenz.git
cd lenz/lenz
npm install
```

And install tool globally. Also make sure you've added NPM global installation path to your system **PATH** variable.

```bash
npm i -g .
```

Now you can use `lenz` from any where in your directory tree.

## Usage

Invoke `lenz` from CLI, supply proper params for each of supported commands.

```bash
5p1d3r:lenz anjan$ lenz
[+]Author  : Anjan Roy < anjanroy@yandex.com >
[+]Project : https://github.com/itzmeanjan/lenz

Commands:
  lenz lm <magnet> <db>  Find peers by Torrent Infohash
  lenz ld <domain> <db>  Find location of Domain Name
  lenz lp <ip> <db>      Find location of IP Address
  lenz ls <db>           Find location of open TCP/UDP socket peer(s)

Options:
  --version  Show version number                               [boolean]
  --help     Show help                                         [boolean]

Not enough non-option arguments: got 0, need at least 1P
```

Please check here for more [info](https://github.com/itzmeanjan/lenz#usage)

## Contribution

If you're interested in adding more features to this CLI tool, please raise a PR.

## Attribution

This non-profit open sourced software uses [IP2Location LITE Database](https://lite.ip2location.com).

Thanks to [@IP2Location](https://github.com/ip2location)
