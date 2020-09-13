# lenz 🤓

Console based MAP 🗺 , with lots of features 😉 

> More can be found [here](https://github.com/itzmeanjan/lenz#motivation)

## prerequisite

We need to download [IP2Location™ LITE IP-COUNTRY-REGION-CITY-LATITUDE-LONGITUDE Database](https://lite.ip2location.com/database/ip-country-region-city-latitude-longitude) for using this tool.

Consider using IPv6 Binary version, cause that will also support IPv4 lookup. This specific database, I've planned to use, is codenamed **db5**. 

And you need to have NodeJS( >10.X ).

## installation

Download & install from NPM.

```bash
npm i -g lenz
```

## develop

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

## usage

Invoke `lenz` from CLI, supply proper params for each of supported commands.

```bash
5p1d3r:lenz anjan$ lenz
[+]Author  : Anjan Roy < anjanroy@yandex.com >
[+]Project : https://github.com/itzmeanjan/lenz

Commands:
  lenz lm <magnet> <db>  Find peers by Torrent Infohash
  lenz ld <domain> <db>  Find location of Domain Name
  lenz lp <ip> <db>      Find location of IP Address

Options:
  --version  Show version number                               [boolean]
  --help     Show help                                         [boolean]

Not enough non-option arguments: got 0, need at least 1
```

Please check here for more [info](https://github.com/itzmeanjan/lenz#usage)

## contribution

If you're interested in adding more features to this CLI tool, please raise a PR.
