require('dotenv').config()

module.exports = {
  deployments: {
    netId1: {
      'eth': {
        'instanceAddress': {
          '0.1': '0x12D66f87A04A9E220743712cE6d9bB1B5616B8Fc',
          '1': '0x47CE0C6eD5B0Ce3d3A51fdb1C52DC66a7c3c2936',
          '10': '0x910Cbd523D972eb0a6f4cAe4618aD62622b39DbF',
          '100': '0xA160cdAB225685dA1d56aa342Ad8841c3b53f291'
        },
        'deployedBlockNumber': {
          '0.1': 9116966,
          '1': 9117609,
          '10': 9117720,
          '100': 9161895
        },
        'miningEnabled': true,
        'symbol': 'ETH',
        'decimals': 18
      },
      'dai': {
        'instanceAddress': {
          '100': '0xD4B88Df4D29F5CedD6857912842cff3b20C8Cfa3',
          '1000': '0xFD8610d20aA15b7B2E3Be39B396a1bC3516c7144',
          '10000': '0x07687e702b410Fa43f4cB4Af7FA097918ffD2730',
          '100000': '0x23773E65ed146A459791799d01336DB287f25334'
        },
        'deployedBlockNumber': {
          '100': 9117612,
          '1000': 9161917,
          '10000': 12066007,
          '100000': 12066048
        },
        'miningEnabled': true,
        'tokenAddress': '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        'symbol': 'DAI',
        'decimals': 18,
        'gasLimit': '55000'
      },
      'cdai': {
        'instanceAddress': {
          '5000': '0x22aaA7720ddd5388A3c0A3333430953C68f1849b',
          '50000': '0x03893a7c7463AE47D46bc7f091665f1893656003',
          '500000': '0x2717c5e28cf931547B621a5dddb772Ab6A35B701',
          '5000000': '0xD21be7248e0197Ee08E0c20D4a96DEBdaC3D20Af'
        },
        'deployedBlockNumber': {
          '5000': 9161938,
          '50000': 12069037,
          '500000': 12067606,
          '5000000': 12066053
        },
        'miningEnabled': true,
        'tokenAddress': '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643',
        'symbol': 'cDAI',
        'decimals': 8,
        'gasLimit': '425000'
      },
      'usdc': {
        'instanceAddress': {
          '100': '0xd96f2B1c14Db8458374d9Aca76E26c3D18364307',
          '1000': '0x4736dCf1b7A3d580672CcE6E7c65cd5cc9cFBa9D',
          '10000': '',
          '100000': ''
        },
        'deployedBlockNumber': {
          '100': 9161958,
          '1000': 9161965,
          '10000': '',
          '100000': ''
        },
        'miningEnabled': false,
        'tokenAddress': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        'symbol': 'USDC',
        'decimals': 6,
        'gasLimit': '80000'
      },
      'usdt': {
        'instanceAddress': {
          '100': '0x169AD27A470D064DEDE56a2D3ff727986b15D52B',
          '1000': '0x0836222F2B2B24A3F36f98668Ed8F0B38D1a872f',
          '10000': '',
          '100000': ''
        },
        'deployedBlockNumber': {
          '100': 9162005,
          '1000': 9162012,
          '10000': '',
          '100000': ''
        },
        'miningEnabled': false,
        'tokenAddress': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        'symbol': 'USDT',
        'decimals': 6,
        'gasLimit': '100000'
      },
      'wbtc': {
        'instanceAddress': {
          '0.1': '0x178169B423a011fff22B9e3F3abeA13414dDD0F1',
          '1': '0x610B717796ad172B316836AC95a2ffad065CeaB4',
          '10': '0xbB93e510BbCD0B7beb5A853875f9eC60275CF498',
          '100': ''
        },
        'deployedBlockNumber': {
          '0.1': 12067529,
          '1': 12066652,
          '10': 12067591,
          '100': ''
        },
        'miningEnabled': true,
        'tokenAddress': '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        'symbol': 'WBTC',
        'decimals': 8,
        'gasLimit': '85000'
      },
      proxy: '0xd90e2f925DA726b50C4Ed8D0Fb90Ad053324F31b',
      multicall: '0xeefBa1e63905eF1D7ACbA5a8513c70307C1cE441',
      subgraph: 'https://api.thegraph.com/subgraphs/name/tornadocash/mainnet-tornado-subgraph',
    },
    netId5: {
      'eth': {
        'instanceAddress': {
          '0.1': '0x6Bf694a291DF3FeC1f7e69701E3ab6c592435Ae7',
          '1': '0x3aac1cC67c2ec5Db4eA850957b967Ba153aD6279',
          '10': '0x723B78e67497E85279CB204544566F4dC5d2acA0',
          '100': '0x0E3A09dDA6B20aFbB34aC7cD4A6881493f3E7bf7'
        },
        'deployedBlockNumber': {
          '0.1': 3782581,
          '1': 3782590,
          '10': 3782593,
          '100': 3782596
        },
        'miningEnabled': true,
        'symbol': 'ETH',
        'decimals': 18
      },
      'dai': {
        'instanceAddress': {
          '100': '0x76D85B4C0Fc497EeCc38902397aC608000A06607',
          '1000': '0xCC84179FFD19A1627E79F8648d09e095252Bc418',
          '10000': '0xD5d6f8D9e784d0e26222ad3834500801a68D027D',
          '100000': '0x407CcEeaA7c95d2FE2250Bf9F2c105aA7AAFB512'
        },
        'deployedBlockNumber': {
          '100': 4339088,
          '1000': 4367659,
          '10000': 4441492,
          '100000': 4441488
        },
        'miningEnabled': true,
        'tokenAddress': '0xdc31Ee1784292379Fbb2964b3B9C4124D8F89C60',
        'symbol': 'DAI',
        'decimals': 18,
        'gasLimit': '55000'
      },
      'cdai': {
        'instanceAddress': {
          '5000': '0x833481186f16Cece3f1Eeea1a694c42034c3a0dB',
          '50000': '0xd8D7DE3349ccaA0Fde6298fe6D7b7d0d34586193',
          '500000': '0x8281Aa6795aDE17C8973e1aedcA380258Bc124F9',
          '5000000': '0x57b2B8c82F065de8Ef5573f9730fC1449B403C9f'
        },
        'deployedBlockNumber': {
          '5000': 4441443,
          '50000': 4441489,
          '500000': 4441493,
          '5000000': 4441489
        },
        'miningEnabled': true,
        'tokenAddress': '0x822397d9a55d0fefd20F5c4bCaB33C5F65bd28Eb',
        'symbol': 'cDAI',
        'decimals': 8,
        'gasLimit': '425000'
      },
      'usdc': {
        'instanceAddress': {
          '100': '0x05E0b5B40B7b66098C2161A5EE11C5740A3A7C45',
          '1000': '0x23173fE8b96A4Ad8d2E17fB83EA5dcccdCa1Ae52',
          '10000': '',
          '100000': ''
        },
        'deployedBlockNumber': {
          '100': 4441426,
          '1000': 4441492,
          '10000': '',
          '100000': ''
        },
        'miningEnabled': false,
        'tokenAddress': '0xD87Ba7A50B2E7E660f678A895E4B72E7CB4CCd9C',
        'symbol': 'USDC',
        'decimals': 6,
        'gasLimit': '80000'
      },
      'usdt': {
        'instanceAddress': {
          '100': '0x538Ab61E8A9fc1b2f93b3dd9011d662d89bE6FE6',
          '1000': '0x94Be88213a387E992Dd87DE56950a9aef34b9448',
          '10000': '',
          '100000': ''
        },
        'deployedBlockNumber': {
          '100': 4441490,
          '1000': 4441492,
          '10000': '',
          '100000': ''
        },
        'miningEnabled': false,
        'tokenAddress': '0xb7FC2023D96AEa94Ba0254AA5Aeb93141e4aad66',
        'symbol': 'USDT',
        'decimals': 6,
        'gasLimit': '100000'
      },
      'wbtc': {
        'instanceAddress': {
          '0.1': '0x242654336ca2205714071898f67E254EB49ACdCe',
          '1': '0x776198CCF446DFa168347089d7338879273172cF',
          '10': '0xeDC5d01286f99A066559F60a585406f3878a033e',
          '100': ''
        },
        'deployedBlockNumber': {
          '0.1': 4441488,
          '1': 4441490,
          '10': 4441490,
          '100': ''
        },
        'miningEnabled': true,
        'tokenAddress': '0xC04B0d3107736C32e19F1c62b2aF67BE61d63a05',
        'symbol': 'WBTC',
        'decimals': 8,
        'gasLimit': '85000'
      },
      proxy: '0x454d870a72e29d5e5697f635128d18077bd04c60',
      multicall: '0x77dCa2C955b15e9dE4dbBCf1246B4B85b651e50e',
      subgraph: 'https://api.thegraph.com/subgraphs/name/tornadocash/goerli-tornado-subgraph',
    },
    netId56: {
      'bnb': {
        'instanceAddress': {
          '0.1': '0x84443CFd09A48AF6eF360C6976C5392aC5023a1F',
          '1': '0xd47438C816c9E7f2E2888E060936a499Af9582b3',
          '10': '0x330bdFADE01eE9bF63C209Ee33102DD334618e0a',
          '100': '0x1E34A77868E19A6647b1f2F47B51ed72dEDE95DD'
        },
        'deployedBlockNumber': {
          '0.1': 8159279,
          '1': 8159286,
          '10': 8159290,
          '100': 8159296
        },
        'miningEnabled': false,
        'symbol': 'BNB',
        'decimals': 18
      },
      proxy: '0x0D5550d52428E7e3175bfc9550207e4ad3859b17',
      multicall: '0x41263cBA59EB80dC200F3E2544eda4ed6A90E76C',
      subgraph: 'https://api.thegraph.com/subgraphs/name/tornadocash/bsc-tornado-subgraph',
    },
    netId100: {
      'xdai': {
        'instanceAddress': {
          '100': '0x1E34A77868E19A6647b1f2F47B51ed72dEDE95DD',
          '1000': '0xdf231d99Ff8b6c6CBF4E9B9a945CBAcEF9339178',
          '10000': '0xaf4c0B70B2Ea9FB7487C7CbB37aDa259579fe040',
          '100000': '0xa5C2254e4253490C54cef0a4347fddb8f75A4998'
        },
        'deployedBlockNumber': {
          '100': 17754566,
          '1000': 17754568,
          '10000': 17754572,
          '100000': 17754574
        },
        'miningEnabled': false,
        'symbol': 'xDAI',
        'decimals': 18
      },
      proxy: '0x0D5550d52428E7e3175bfc9550207e4ad3859b17',
      multicall: '0xb5b692a88BDFc81ca69dcB1d924f59f0413A602a',
      subgraph: 'https://api.thegraph.com/subgraphs/name/tornadocash/xdai-tornado-subgraph',
    },
    netId137: {
      'matic': {
        'instanceAddress': {
          '100': '0x1E34A77868E19A6647b1f2F47B51ed72dEDE95DD',
          '1000': '0xdf231d99Ff8b6c6CBF4E9B9a945CBAcEF9339178',
          '10000': '0xaf4c0B70B2Ea9FB7487C7CbB37aDa259579fe040',
          '100000': '0xa5C2254e4253490C54cef0a4347fddb8f75A4998'
        },
        'deployedBlockNumber': {
          '100': 16258013,
          '1000': 16258032,
          '10000': 16258046,
          '100000': 16258053
        },
        'miningEnabled': false,
        'symbol': 'MATIC',
        'decimals': 18
      },
      proxy: '0x0D5550d52428E7e3175bfc9550207e4ad3859b17',
      multicall: '0x11ce4B23bD875D7F5C6a31084f55fDe1e9A87507',
      subgraph: 'https://api.thegraph.com/subgraphs/name/tornadocash/matic-tornado-subgraph',
    },
    netId42161: {
      'eth': {
        'instanceAddress': {
          '0.1': '0x84443CFd09A48AF6eF360C6976C5392aC5023a1F',
          '1': '0xd47438C816c9E7f2E2888E060936a499Af9582b3',
          '10': '0x330bdFADE01eE9bF63C209Ee33102DD334618e0a',
          '100': '0x1E34A77868E19A6647b1f2F47B51ed72dEDE95DD'
        },
        'deployedBlockNumber': {
          '0.1': 3300000,
          '1': 3300000,
          '10': 3300000,
          '100': 3300000
        },
        'miningEnabled': false,
        'symbol': 'ETH',
        'decimals': 18
      },
      proxy: '0x0D5550d52428E7e3175bfc9550207e4ad3859b17',
      multicall: '0xB064Fe785d8131653eE12f3581F9A55F6D6E1ca3',
      subgraph: 'https://api.thegraph.com/subgraphs/name/tornadocash/arbitrum-tornado-subgraph',
    },
    netId43114: {
      'avax': {
        'instanceAddress': {
          '10': '0x330bdFADE01eE9bF63C209Ee33102DD334618e0a',
          '100': '0x1E34A77868E19A6647b1f2F47B51ed72dEDE95DD',
          '500': '0xaf8d1839c3c67cf571aa74B5c12398d4901147B3'
        },
        'deployedBlockNumber': {
          '10': 4429830,
          '100': 4429851,
          '500': 4429837
        },
        'miningEnabled': false,
        'symbol': 'AVAX',
        'decimals': 18
      },
      proxy: '0x0D5550d52428E7e3175bfc9550207e4ad3859b17',
      multicall: '0x98e2060F672FD1656a07bc12D7253b5e41bF3876',
      subgraph: 'https://api.thegraph.com/subgraphs/name/tornadocash/avalanche-tornado-subgraph',
    },
    netId10: {
      'eth': {
        'instanceAddress': {
          '0.1': '0x84443CFd09A48AF6eF360C6976C5392aC5023a1F',
          '1': '0xd47438C816c9E7f2E2888E060936a499Af9582b3',
          '10': '0x330bdFADE01eE9bF63C209Ee33102DD334618e0a',
          '100': '0x1E34A77868E19A6647b1f2F47B51ed72dEDE95DD'
        },
        'deployedBlockNumber': {
          '0.1': 2243707,
          '1': 2243709,
          '10': 2243735,
          '100': 2243749
        },
        'miningEnabled': false,
        'symbol': 'ETH',
        'decimals': 18
      },
      proxy: '0x0D5550d52428E7e3175bfc9550207e4ad3859b17',
      multicall: '0x142E2FEaC30d7fc3b61f9EE85FCCad8e560154cc',
      subgraph: 'https://api.thegraph.com/subgraphs/name/tornadocash/optimism-tornado-subgraph',
    },
  }
}
