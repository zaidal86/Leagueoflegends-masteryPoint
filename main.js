import dotenv from 'dotenv';
import axios from 'axios';
import Table from 'cli-table3';
import readline from 'readline';
dotenv.config();

let total = [];
let nombre = 1;

process.stdout.write('\x1B[2J\x1B[0f'); // clear terminal

const table = new Table({
    head: [`\u001b[34mCompte\u001b[0m`, `\u001b[34mRegion\u001b[0m`, `\u001b[34mPseudo\u001b[0m`, `\u001b[34mLevel\u001b[0m`,
        `\u001b[34mMaitrise\u001b[0m`, `\u001b[34mChest\u001b[0m`, `\u001b[34mPoint\u001b[0m`, `\u001b[34mTotal\u001b[0m`],
    style: { head: ['blue'], border: ['blue'], 'padding-left': 1, 'padding-right': 1 },
    colAligns: ['center','center','center','center','center','center','center','center']
});

const RiotKeyHeaders = { headers: { 'X-Riot-Token': process.env.RIOT_TOKEN } };

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

// [Accounts EUW] [Accounts RU]
const region = ['EUW1', 'RU', 'BR1', 'EUN1', 'JP1', 'KR', 'LA1', 'LA2','NA1','OC1','TR1','PH2','SG2','TH2','TW2','VN2'];
const accounts = [
    [
        ''
    ],
    [
        ''
    ],
]

const link = {
    version: 'https://ddragon.leagueoflegends.com/api/versions.json',
    championID: 'http://ddragon.leagueoflegends.com/cdn/{version}/data/en_US/champion.json',
    summonerID: 'https://{region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/{summonerName}',
    masteryChampion: 'https://{region}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/{summonerID}/by-champion/{championID}'
};

const getVersion = (callback) => {
    axios.get(link.version).then((data) => {
        callback(data.data[0]);
    });
};

const getChampionID = (championName, version, callback) => {
    const linkparsed = link.championID.replace('{version}', version);

    axios.get(linkparsed).then((data) => {
        callback(data.data.data[championName].key);
    }).catch(err=> console.log(`\u001b[33;1m[LOGS]\u001b[0m Champion error : ${err}`));
};

const getSumonnerID = (region, accounts, callback) => {
    const linkparsed = link.summonerID.replace('{region}', region).replace('{summonerName}', encodeURI(accounts));

    axios.get(linkparsed, RiotKeyHeaders).then((data) => {
        callback(data.data);
    }).catch((err) => console.log(err.response.data));
};

const getMastery = (region, accounts, champID, callback) => {
    const linkparsed = link.masteryChampion.replace('{region}', region).replace('{summonerID}', accounts).replace('{championID}', champID);

    axios.get(linkparsed, RiotKeyHeaders).then((data) => {
        callback(data.data);
    }).catch((err) => callback(err.response.data));
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});


rl.question("Enter the champion's name :", (championName) => {
    getVersion(version => {
        getChampionID(championName.charAt(0).toUpperCase() + championName.slice(1), version, async (champID) => {
            for (let select = 0; select < accounts.length; select++) {
                const regions = region[select];
                const number = accounts[select].length;
                for (let index = 0; index < number; index++) {
                    getSumonnerID(regions, accounts[select][index], (dataID) => {
                        getMastery(regions, dataID.id, champID, (data) => {
                            total.push(data.championPoints || 0);
                            console.log(`\u001b[33;1m[LOGS]\u001b[0m \u001b[36m${data.championPoints || 0}\u001b[0m : account \u001b[32m${accounts[select][index]}\u001b[0m at \u001b[31m${regions}\u001b[0m`);
                            table.push([
                                `${nombre}`, `\u001b[31m${regions}\u001b[0m`, `\u001b[32m${accounts[select][index]}\u001b[0m`,
                                `\u001b[33m${dataID.summonerLevel}\u001b[0m`, `\u001b[35m${data.championLevel || 0}\u001b[0m`,
                                `${data.chestGranted == true ? '\u001b[31mTrue\u001b[0m' : '\u001b[32mFalse\u001b[0m'}`,
                                `\u001b[36m${data.championPoints || 0}\u001b[0m`
                            ]);
                            nombre++;
                        });
                    });
                    await delay(1000);
                };
            };
            console.log(`\u001b[33;1m[LOGS]\u001b[0m \u001b[36m${new Intl.NumberFormat('fr-FR').format(total.reduce((previousValue, currentValue) => previousValue + currentValue))}\u001b[0m : total point on \u001b[35m${championName}\u001b[0m`);
            table.push([``, ``, ``, ``,``,``,``, `\u001b[37m${new Intl.NumberFormat('fr-FR').format(total.reduce((previousValue, currentValue) => previousValue + currentValue))}\u001b[0m`]);
            console.log(table.toString());
        });
    })
  rl.close();
});