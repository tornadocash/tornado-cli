# Tornado cli

Command line tool to interact with [Tornado Cash](https://tornadocash.eth.link).

### Warning!
Current cli version doesn't support [Anonymity Mining](https://tornado-cash.medium.com/tornado-cash-governance-proposal-a55c5c7d0703)

### How to install tornado cli
Download and install [node.js](https://nodejs.org/en/download/).

If you have git installed on your system, clone the master branch.

```bash
$ git clone https://github.com/tornadocash/tornado-cli
```

Or, download the archive file from github

https://github.com/tornadocash/tornado-cli/archive/refs/heads/master.zip

After downloading or cloning the repository, you must install necessary libraries using the following command.

```bash
$ cd tornado-cli
$ npm install
```

If you want to use Tor connection to conceal ip address, install [Tor Browser](https://www.torproject.org/download/) and add `--tor 9150` for `cli.js` if you connect tor with browser.
Note that you should reset your tor connection by restarting the browser every time when you deposit & withdraw otherwise you will have the same exit node used for connection.

### Goerli, Mainnet, Binance Smart Chain, Gnosis Chain, Polygon Network, Arbitrum, Avalanche
1. Add `PRIVATE_KEY` to `.env` file
2. `node cli.js --help`

Example:
```bash
$ node cli.js deposit ETH 0.1 --rpc https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161 --tor 9150

Your note: tornado-eth-0.1-5-0xf73dd6833ccbcc046c44228c8e2aa312bf49e08389dadc7c65e6a73239867b7ef49c705c4db227e2fadd8489a494b6880bdcb6016047e019d1abec1c7652
Tornado ETH balance is 8.9
Sender account ETH balance is 1004873.470619891361352542
Submitting deposit transaction
Tornado ETH balance is 9
Sender account ETH balance is 1004873.361652048361352542
```

```bash
$ node cli.js withdraw tornado-eth-0.1-5-0xf73dd6833ccbcc046c44228c8e2aa312bf49e08389dadc7c65e6a73239867b7ef49c705c4db227e2fadd8489a494b6880bdcb6016047e019d1abec1c7652 0x8589427373D6D84E98730D7795D8f6f8731FDA16 --rpc https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161 --relayer https://goerli-frelay.duckdns.org --tor 9150

Relay address:  0x6A31736e7490AbE5D5676be059DFf064AB4aC754
Getting current state from tornado contract
Generating SNARK proof
Proof time: 9117.051ms
Sending withdraw transaction through relay
Transaction submitted through the relay. View transaction on etherscan https://goerli.etherscan.io/tx/0xcb21ae8cad723818c6bc7273e83e00c8393fcdbe74802ce5d562acad691a2a7b
Transaction mined in block 17036120
Done
```

### List of public rpc & relayers for withdrawal

Infura API key fetched from https://rpc.info (Same one with Metamask)

```json
{
   "netId1":{
      "rpcUrls":{
         "Infura":{
            "name":"Infura",
            "url":"https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"
         },
         "MyEtherWallet":{
            "name":"MyEtherWallet",
            "url":"https://nodes.mewapi.io/rpc/eth"
         },
         "MyCrypto":{
            "name":"MyCrypto",
            "url":"https://api.mycryptoapi.com/eth"
         },
         "CloudFlare":{
            "name":"CloudFlare",
            "url":"https://cloudflare-eth.com"
         }
      },
      "relayers":{
         "mainnet-v2.poanet.eth":{
            "url":"mainnet-v2.poanet.eth",
            "name":"mainnet-v2.poanet.eth",
            "cachedUrl":"https://tornado-mainnet-v2.poa.network/"
         },
         "mainnet-v2.relaymy.eth":{
            "url":"mainnet-v2.relaymy.eth",
            "name":"mainnet-v2.relaymy.eth",
            "cachedUrl":"https://mainnet-v2.relaymy.xyz/"
         },
         "mainnet-v2.gaasservices.eth":{
            "url":"mainnet-v2.gaasservices.eth",
            "name":"mainnet-v2.gaasservices.eth",
            "cachedUrl":"https://mainnet-v2.gaas.services/"
         },
         "mainnet-v2.reasoned.eth":{
            "url":"mainnet-v2.reasoned.eth",
            "name":"mainnet-v2.reasoned.eth",
            "cachedUrl":"https://mainnet-v2.solarsis.net/"
         },
         "v2.mainnet.thewizardseye.eth":{
            "url":"v2.mainnet.thewizardseye.eth",
            "name":"v2.mainnet.thewizardseye.eth",
            "cachedUrl":"https://v2.mainnet.thewizardseye.de/"
         },
         "v2.odanrot.eth":{
            "url":"v2.odanrot.eth",
            "name":"v2.odanrot.eth",
            "cachedUrl":"https://tcrv2.avado.cloud/"
         },
         "mainnet-v2.releth.eth":{
            "url":"mainnet-v2.releth.eth",
            "name":"mainnet-v2.releth.eth",
            "cachedUrl":"https://mainnet-v2.reloch.net/"
         },
         "mainnet.t-relay.eth":{
            "url":"mainnet.t-relay.eth",
            "name":"mainnet.t-relay.eth",
            "cachedUrl":"https://mainnet.t-relay.online/"
         },
         "mainnet-v2.therelayer.eth":{
            "url":"mainnet-v2.therelayer.eth",
            "name":"mainnet-v2.therelayer.eth",
            "cachedUrl":"https://mainnet-v2.therelayer.xyz/"
         },
         "mainnet.relayer-service.eth":{
            "url":"mainnet.relayer-service.eth",
            "name":"mainnet.relayer-service.eth",
            "cachedUrl":"https://mainnet-relayer.hertz.zone/"
         },
         "mainnet-v2.tornadosolutions.eth":{
            "url":"mainnet-v2.tornadosolutions.eth",
            "name":"mainnet-v2.tornadosolutions.eth",
            "cachedUrl":"https://mainnet-v2.tornado.solutions/"
         },
         "mainnet-v2.torn.eth":{
            "url":"mainnet-v2.torn.eth",
            "name":"mainnet-v2.torn.eth",
            "cachedUrl":"https://mainnet-v2.torn.cash/"
         },
         "mainnet-v2.defidevotee.eth":{
            "url":"mainnet-v2.defidevotee.eth",
            "name":"mainnet-v2.defidevotee.eth",
            "cachedUrl":"https://mainnet-v2.defidevotee.xyz/"
         }
      }
   },
   "netId56":{
      "rpcUrls":{
         "publicRpc1":{
            "name":"BSC Public RPC 1",
            "url":"https://bsc-dataseed.binance.org/"
         },
         "publicRpc2":{
            "name":"BSC Public RPC 2",
            "url":"https://bsc-dataseed1.defibit.io/"
         },
         "publicRpc3":{
            "name":"BSC Public RPC 3",
            "url":"https://bsc-dataseed1.ninicoin.io/"
         },
         "MyEtherWallet":{
            "name":"MyEtherWallet",
            "url":"https://nodes.mewapi.io/rpc/bsc/"
         }
      },
      "relayers":{
         "bsc.relayer-service.eth":{
            "url":"bsc.relayer-service.eth",
            "name":"bsc.relayer-service.eth",
            "cachedUrl":"https://bsc-relayer.hertz.zone/"
         },
         "bsc.t-relay.eth":{
            "url":"bsc.t-relay.eth",
            "name":"bsc.t-relay.eth",
            "cachedUrl":"https://bsc.t-relay.online/"
         },
         "bsc.therelayer.eth":{
            "url":"bsc.therelayer.eth",
            "name":"bsc.therelayer.eth",
            "cachedUrl":"https://bsc.therelayer.xyz/"
         },
         "bsc-v2.defidevotee.eth":{
            "url":"bsc-v2.defidevotee.eth",
            "name":"bsc-v2.defidevotee.eth",
            "cachedUrl":"https://bsc-v2.defidevotee.xyz/"
         },
         "v1.bsc.thewizardseye.eth":{
            "url":"v1.bsc.thewizardseye.eth",
            "name":"v1.bsc.thewizardseye.eth",
            "cachedUrl":"https://v1.bsc.thewizardseye.de/"
         },
         "bsc.relaymy.eth":{
            "url":"bsc.relaymy.eth",
            "name":"bsc.relaymy.eth",
            "cachedUrl":"https://bsc.relaymy.xyz/"
         },
         "bsc.torn.eth":{
            "url":"bsc.torn.eth",
            "name":"bsc.torn.eth",
            "cachedUrl":"https://bsc.torn.cash/"
         },
         "bsc.gaasservices.eth":{
            "url":"bsc.gaasservices.eth",
            "name":"bsc.gaasservices.eth",
            "cachedUrl":"https://bsc.gaas.services/"
         },
         "bsc.tornadosolutions.eth":{
            "url":"bsc.tornadosolutions.eth",
            "name":"bsc.tornadosolutions.eth",
            "cachedUrl":"https://bsc.tornado.solutions/"
         },
         "bsc.odanrot.eth":{
            "url":"bsc.odanrot.eth",
            "name":"bsc.odanrot.eth",
            "cachedUrl":"https://tcrbsc.avado.cloud/"
         },
         "bsc.releth.eth":{
            "url":"bsc.releth.eth",
            "name":"bsc.releth.eth",
            "cachedUrl":"https://bsc.reloch.net/"
         }
      }
   },
   "netId100":{
      "rpcUrls":{
         "publicRpc":{
            "name":"Gnosis Chain RPC",
            "url":"https://rpc.gnosischain.com"
         },
         "publicRpc2":{
            "name":"Gnosis Chain RPC2",
            "url":"https://xdai.poanetwork.dev"
         },
         "publicRpc3":{
            "name":"Gnosis Chain RPC3",
            "url":"https://dai.poa.network/"
         }
      },
      "relayers":{
         "xdai.relayer-service.eth":{
            "url":"xdai.relayer-service.eth",
            "name":"xdai.relayer-service.eth",
            "cachedUrl":"https://xdai-relayer.hertz.zone/"
         },
         "xdai.releth.eth":{
            "url":"xdai.releth.eth",
            "name":"xdai.releth.eth",
            "cachedUrl":"https://xdai.reloch.net/"
         },
         "xdai.relaymy.eth":{
            "url":"xdai.relaymy.eth",
            "name":"xdai.relaymy.eth",
            "cachedUrl":"https://xdai.relaymy.xyz/"
         },
         "xdai.torn.eth":{
            "url":"xdai.torn.eth",
            "name":"xdai.torn.eth",
            "cachedUrl":"https://xdai.torn.cash/"
         },
         "xdai.t-relay.eth":{
            "url":"xdai.t-relay.eth",
            "name":"xdai.t-relay.eth",
            "cachedUrl":"https://xdai.t-relay.online/"
         },
         "xdai-v2.poanet.eth":{
            "url":"xdai-v2.poanet.eth",
            "name":"xdai-v2.poanet.eth",
            "cachedUrl":"https://tornado-xdai.poa.network/"
         },
         "xdai.gaasservices.eth":{
            "url":"xdai.gaasservices.eth",
            "name":"xdai.gaasservices.eth",
            "cachedUrl":"https://xdai.gaas.services/"
         },
         "xdai.therelayer.eth":{
            "url":"xdai.therelayer.eth",
            "name":"xdai.therelayer.eth",
            "cachedUrl":"https://xdai.therelayer.xyz/"
         },
         "xdai.tornadosolutions.eth":{
            "url":"xdai.tornadosolutions.eth",
            "name":"xdai.tornadosolutions.eth",
            "cachedUrl":"https://xdai.tornado.solutions/"
         },
         "xdai.odanrot.eth":{
            "url":"xdai.odanrot.eth",
            "name":"xdai.odanrot.eth",
            "cachedUrl":"https://tcxdai.avado.cloud/"
         }
      }
   },
   "netId137":{
      "rpcUrls":{
         "publicRpc1":{
            "name":"publicRpc1",
            "url":"https://polygon-rpc.com"
         },
         "publicRpc2":{
            "name":"publicRpc2",
            "url":"https://rpc-mainnet.matic.network"
         },
         "publicRpc3":{
            "name":"publicRpc3",
            "url":"https://matic-mainnet.chainstacklabs.com"
         },
         "MyEtherWallet":{
            "name":"MyEtherWallet",
            "url":"https://nodes.mewapi.io/ws/matic"
         }
      },
      "relayers":{
         "polygon.therelayer.eth":{
            "url":"polygon.therelayer.eth",
            "name":"polygon.therelayer.eth",
            "cachedUrl":"https://polygon.therelayer.xyz/"
         },
         "polygon.odanrot.eth":{
            "url":"polygon.odanrot.eth",
            "name":"polygon.odanrot.eth",
            "cachedUrl":"https://tcrmatic.avado.cloud/"
         },
         "polygon.t-relay.eth":{
            "url":"polygon.t-relay.eth",
            "name":"polygon.t-relay.eth",
            "cachedUrl":"https://polygon.t-relay.online/"
         },
         "polygon.relayer-service.eth":{
            "url":"polygon.relayer-service.eth",
            "name":"polygon.relayer-service.eth",
            "cachedUrl":"https://polygon-relayer.hertz.zone/"
         },
         "poly.releth.eth":{
            "url":"poly.releth.eth",
            "name":"poly.releth.eth",
            "cachedUrl":"https://poly.reloch.net/"
         },
         "v1.polygon.thewizardseye.eth":{
            "url":"v1.polygon.thewizardseye.eth",
            "name":"v1.polygon.thewizardseye.eth",
            "cachedUrl":"https://v1.polygon.thewizardseye.de/"
         },
         "polygon.reasoned.eth":{
            "url":"polygon.reasoned.eth",
            "name":"polygon.reasoned.eth",
            "cachedUrl":"https://polygon.solarsis.net/"
         },
         "polygon.torn.eth":{
            "url":"polygon.torn.eth",
            "name":"polygon.torn.eth",
            "cachedUrl":"https://polygon.torn.cash/"
         },
         "polygon.relaymy.eth":{
            "url":"polygon.relaymy.eth",
            "name":"polygon.relaymy.eth",
            "cachedUrl":"https://polygon.relaymy.xyz/"
         },
         "polygon.tornadosolutions.eth":{
            "url":"polygon.tornadosolutions.eth",
            "name":"polygon.tornadosolutions.eth",
            "cachedUrl":"https://polygon.tornado.solutions/"
         },
         "polygon.gaasservices.eth":{
            "url":"polygon.gaasservices.eth",
            "name":"polygon.gaasservices.eth",
            "cachedUrl":"https://polygon.gaas.services/"
         }
      }
   },
   "netId42161":{
      "rpcUrls":{
         "Arbitrum":{
            "name":"Arbitrum Public RPC",
            "url":"https://arb1.arbitrum.io/rpc"
         }
      },
      "relayers":{
         "arb.releth.eth":{
            "url":"arb.releth.eth",
            "name":"arb.releth.eth",
            "cachedUrl":"https://arbitrum.reloch.net/"
         },
         "arbitrum.therelayer.eth":{
            "url":"arbitrum.therelayer.eth",
            "name":"arbitrum.therelayer.eth",
            "cachedUrl":"https://arbitrum.therelayer.xyz/"
         },
         "arbitrum.relayer-service.eth":{
            "url":"arbitrum.relayer-service.eth",
            "name":"arbitrum.relayer-service.eth",
            "cachedUrl":"https://arbitrum-relayer.hertz.zone/"
         },
         "arbitrum.t-relay.eth":{
            "url":"arbitrum.t-relay.eth",
            "name":"arbitrum.t-relay.eth",
            "cachedUrl":"https://arbitrum.t-relay.online/"
         },
         "arbitrum.relaymy.eth":{
            "url":"arbitrum.relaymy.eth",
            "name":"arbitrum.relaymy.eth",
            "cachedUrl":"https://arbitrum.relaymy.xyz/"
         },
         "arbitrum.torn.eth":{
            "url":"arbitrum.torn.eth",
            "name":"arbitrum.torn.eth",
            "cachedUrl":"https://arbitrum.torn.cash/"
         }
      }
   },
   "netId43114":{
      "rpcUrls":{
         "publicRpc":{
            "name":"Avalanche RPC",
            "url":"https://api.avax.network/ext/bc/C/rpc"
         }
      },
      "relayers":{
         "avax.odanrot.eth":{
            "url":"avax.odanrot.eth",
            "name":"avax.odanrot.eth",
            "cachedUrl":"https://tcravalanche.avado.cloud/"
         },
         "avalanche.therelayer.eth":{
            "url":"avalanche.therelayer.eth",
            "name":"avalanche.therelayer.eth",
            "cachedUrl":"https://avalanche.therelayer.xyz/"
         },
         "avalanche.t-relay.eth":{
            "url":"avalanche.t-relay.eth",
            "name":"avalanche.t-relay.eth",
            "cachedUrl":"https://avalanche.t-relay.online/"
         },
         "avalanche.relaymy.eth":{
            "url":"avalanche.relaymy.eth",
            "name":"avalanche.relaymy.eth",
            "cachedUrl":"https://avalanche.relaymy.xyz/"
         },
         "avalanche.tornadosolutions.eth":{
            "url":"avalanche.tornadosolutions.eth",
            "name":"avalanche.tornadosolutions.eth",
            "cachedUrl":"https://avalanche.tornado.solutions/"
         },
         "avalanche.gaasservices.eth":{
            "url":"avalanche.gaasservices.eth",
            "name":"avalanche.gaasservices.eth",
            "cachedUrl":"https://avalanche.gaas.services/"
         },
         "avax.releth.eth":{
            "url":"avax.releth.eth",
            "name":"avax.releth.eth",
            "cachedUrl":"https://avax.reloch.net/"
         }
      }
   },
   "netId10":{
      "rpcUrls":{
         "Optimism":{
            "name":"Optimism Public RPC",
            "url":"https://mainnet.optimism.io"
         }
      },
      "relayers":{
         "optimism.t-relay.eth":{
            "url":"optimism.t-relay.eth",
            "name":"optimism.t-relay.eth",
            "cachedUrl":"https://optimism.t-relay.online/"
         },
         "optimism.therelayer.eth":{
            "url":"optimism.therelayer.eth",
            "name":"optimism.therelayer.eth",
            "cachedUrl":"https://optimism.therelayer.xyz/"
         },
         "optimism.relayer-service.eth":{
            "url":"optimism.relayer-service.eth",
            "name":"optimism.relayer-service.eth",
            "cachedUrl":"https://optimism-relayer.hertz.zone/"
         },
         "optimism.torn.eth":{
            "url":"optimism.torn.eth",
            "name":"optimism.torn.eth",
            "cachedUrl":"https://optimism.torn.cash/"
         },
         "optimism.relaymy.eth":{
            "url":"optimism.relaymy.eth",
            "name":"optimism.relaymy.eth",
            "cachedUrl":"https://optimism.relaymy.xyz/"
         }
      }
   },
   "netId5":{
      "rpcUrls":{
         "Infura":{
            "name":"Infura",
            "url":"https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"
         },
         "Mudit":{
            "name":"Mudit",
            "url":"https://rpc.goerli.mudit.blog"
         },
         "Slockit":{
            "name":"Slockit",
            "url":"https://rpc.slock.it/goerli"
         },
         "Prylabs":{
            "name":"Prylabs",
            "url":"https://goerli.prylabs.net"
         },
         "MyEtherWallet":{
            "name":"MyEtherWallet",
            "url":"https://nodes.mewapi.io/ws/goerli"
         }
      },
      "relayers":{
         "goerli-v2.poanet.eth":{
            "url":"goerli-v2.poanet.eth",
            "name":"goerli-v2.poanet.eth",
            "cachedUrl":"https://tornado-goerli-v2.poa.network/"
         },
         "goerli.v2.odanrot.eth":{
            "url":"goerli.v2.odanrot.eth",
            "name":"goerli.v2.odanrot.eth",
            "cachedUrl":"https://tcrv2goerli.avado.cloud/"
         },
         "goerli-v2.releth.eth":{
            "url":"goerli-v2.releth.eth",
            "name":"goerli-v2.releth.eth",
            "cachedUrl":"https://goerli-v2.reloch.net/"
         },
         "goerli-v2.relaymy.eth":{
            "url":"goerli-v2.relaymy.eth",
            "name":"goerli-v2.relaymy.eth",
            "cachedUrl":"https://goerli-v2.relaymy.xyz/"
         },
         "goerli-v2.gaasservices.eth":{
            "url":"goerli-v2.gaasservices.eth",
            "name":"goerli-v2.gaasservices.eth",
            "cachedUrl":"https://goerli-v2.gaas.services/"
         },
         "v2.goerli.thewizardseye.eth":{
            "url":"v2.goerli.thewizardseye.eth",
            "name":"v2.goerli.thewizardseye.eth",
            "cachedUrl":"https://digitalocean.v2.goerli.thewizardseye.de/"
         },
         "goerli-v2.reasoned.eth":{
            "url":"goerli-v2.reasoned.eth",
            "name":"goerli-v2.reasoned.eth",
            "cachedUrl":"https://goerli-v2.fairish.net/"
         },
         "goerli.t-relay.eth":{
            "url":"goerli.t-relay.eth",
            "name":"goerli.t-relay.eth",
            "cachedUrl":"https://goerli.t-relay.online/"
         },
         "goerli-v2.therelayer.eth":{
            "url":"goerli-v2.therelayer.eth",
            "name":"goerli-v2.therelayer.eth",
            "cachedUrl":"https://goerli-v2.therelayer.xyz/"
         },
         "goerli.relayer-service.eth":{
            "url":"goerli.relayer-service.eth",
            "name":"goerli.relayer-service.eth",
            "cachedUrl":"https://goerli-relayer.hertz.zone/"
         },
         "goerli-v2.tornadosolutions.eth":{
            "url":"goerli-v2.tornadosolutions.eth",
            "name":"goerli-v2.tornadosolutions.eth",
            "cachedUrl":"https://goerli-v2.tornado.solutions/"
         },
         "goerli-v2.torn.eth":{
            "url":"goerli-v2.torn.eth",
            "name":"goerli-v2.torn.eth",
            "cachedUrl":"https://goerli-v2.torn.cash/"
         },
         "goerli-v2.defidevotee.eth":{
            "url":"goerli-v2.defidevotee.eth",
            "name":"goerli-v2.defidevotee.eth",
            "cachedUrl":"https://goerli-v2.defidevotee.xyz"
         }
      }
   }
}
```
