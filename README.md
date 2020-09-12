# lenz 🤓

Console based MAP 🗺 

![sc](sc/sc.gif)

## motivation

I was looking for one fully console based location data visualiser, with below functionalities 

- can show machine's connected peers 👩‍💻
- can look up given IP Address location
- can look up given (sub-)domain name location
- can show peers, given torrent 🧲 link
- _can show my own location on Map_ 🙋

which can be invoked in fully console based environments i.e. VM, VPS etc.

But couldn't find one, may be I needed to try harder. 

So I decided to write one, with all these above mentioned functionalites.

I interested in extending its functionalites in coming days, if you find I'm missing certain use case, feel free to let me know/ just raise a PR.

## prerequisite

We need to download [IP2Location™ LITE IP-COUNTRY-REGION-CITY-LATITUDE-LONGITUDE Database](https://lite.ip2location.com/database/ip-country-region-city-latitude-longitude) for using this tool.

Consider using IPv6 version, cause that will also support IPv4 lookup. This specific database I've planned to use is codenamed **db5**. 

Please try to stick with that, otherwise there might be some unexpected behaviours.

And you need to have NodeJS( >10.X ).

## installation

### using NPM

[This](https://www.npmjs.com/package/lenz) software is distributed using NPM.

```bash
npm i -g lenz
```

### using GITHUB

You can clone this repo in your machine and run below commands to use this CLI tool.

Lets get into project directory

```bash
git clone git@github.com:itzmeanjan/lenz.git
cd lenz/lenz
```

And install tool globally. Also make sure you've added NPM global installation path to your system **PATH** variable.

```bash
npm i -g .
```

Now you can use `lenz` from any where in your directory tree.

## usage

Invoke `lenz` from CLI, supply proper params for each of supported commands.

![sc](sc/sc_2.gif)

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

## contribution

If you're interested in adding more features to this CLI tool, please raise a PR.
