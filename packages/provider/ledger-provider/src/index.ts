import Web3ProviderEngine from 'web3-provider-engine'
import HookedWalletSubprovider from 'web3-provider-engine/subproviders/hooked-wallet'
import SubscriptionSubprovider from 'web3-provider-engine/subproviders/subscriptions'
import FilterSubprovider from 'web3-provider-engine/subproviders/filters'

import { IRPCMap, IJsonRpcRequest, } from '@ledgerconnect/types'
import { IWalletConnectProviderOptions } from '@ledgerconnect/utils'
import { generateAddresses, isValidPath } from "@ledgerconnect/utils";
import { networkName } from '@ledgerconnect/utilities'
import { TransportU2F } from '@ledgerhq/hw-transport-u2f'
import { Eth } from '@ledgerhq/hw-app-eth'
import { EthereumTx } from 'ethereumjs-tx'
import { ethUtil } from 'ethereumjs-util'
import { buffer } from 'buffer'

const LEDGER_LIVE_PATH = `m/44'/60'`
const ACCOUNTS_TO_GET = 5

let eth: any
let dPath = ''
let addressToPath = new Map()
let enabled = false
let customPath = false
let account:
    | undefined
    | { publicKey: string; chainCode: string; path: string }

class LedgerConnectProvider extends Web3ProviderEngine {

  public rpc: IRPCMap | null = null;
  public infuraId = "";
  public isConnecting = false;
  public connected = false;
  public connectCallbacks: any[] = [];
  public accounts: string[] = [];
  public chainId = 1;
  public networkId = 1;
  public rpcUrl = "";
  public transport: any;
  public LedgerTransport : any;

  constructor(opts: IWalletConnectProviderOptions) {
    super({ pollingInterval: opts.pollingInterval || 8000 });
    this.rpc = opts.rpc || null;
    if (
      !this.rpc &&
      (!opts.infuraId || typeof opts.infuraId !== "string" || !opts.infuraId.trim())
    ) {
      throw new Error("Missing one of the required parameters: rpc or infuraId");
    }
    this.infuraId = opts.infuraId || "";
    this.chainId = typeof opts.chainId !== "undefined" ? opts.chainId : 1;
    this.networkId = this.chainId;
    this.updateRpcUrl(this.chainId);
    this.provider = createProvider({
        getAccounts: async (cb: any) => {
          	getAccounts()
        	.then((res: Array<any>) => cb(null, res))
        	.catch((err: string) => cb(err, null))
        },
        signTransaction: (transactionData: any, callback: any) => {
      		signTransaction(transactionData)
        		.then((res: string) => callback(null, res))
        		.catch(err => callback(err, null))
    	},
        processMessage: async (messageData: any, callback: any) => {
          	signMessage(messageData)
        	.then((res: string) => callback(null, res))
        	.catch(err => callback(err, null))
        },
        processPersonalMessage: (messageData: any, callback: any) => {
      		signMessage(messageData)
        	.then((res: string) => callback(null, res))
        	.catch(err => callback(err, null))
    	},
        signMessage: (messageData: any, callback: any) => {
      		signMessage(messageData)
        	.then((res: string) => callback(null, res))
        	.catch(err => callback(err, null))
    	},
    	signPersonalMessage: (messageData: any, callback: any) => {
      		signMessage(messageData)
        	.then((res: string) => callback(null, res))
        	.catch(err => callback(err, null))
    	},
      });

    this.provider.setPath = setPath
    this.provider.dPath = dPath
    this.provider.enable = enable
    this.provider.setPrimaryAccount = setPrimaryAccount
    this.provider.getPrimaryAddress = getPrimaryAddress
    this.provider.getAccounts = getAccounts
    this.provider.getMoreAccounts = getMoreAccounts
    this.provider.getBalance = getBalance
    this.provider.getBalances = getBalances
    this.provider.send = this.provider.sendAsync
    this.provider.disconnect = disconnect
    this.provider.isCustomPath = isCustomPath
    this.addProvider(this.provider);
  }
  
  function createProvider(config: any){
    const {
      getAccounts,
      processMessage,
      processPersonalMessage,
      processSignTransaction,
      processTransaction,
	  processTypedMessage
    } = config

    const idMgmt =
      getAccounts &&
      new HookedWalletSubprovider({
        getAccounts,
        processMessage,
        processPersonalMessage,
        processSignTransaction,
        processTransaction,
	    processTypedMessage
      })

    let provider = new Web3ProviderEngine()

    provider.addProvider(new SubscriptionSubprovider())
    provider.addProvider(new FilterSubprovider())
    idMgmt && provider.addProvider(idMgmt)
    provider.on('error', console.error)
    return provider
  }

    async function setPath(path: string, custom?: boolean) {
      if (!isValidPath(path)) {
        return false
      }

      if (path !== dPath) {
        // clear any exsting addresses if different path
        addressToPath = new Map()
      }

      if (custom) {
        const address = await getAddress(path)
        addressToPath.set(address, path)
        customPath = true
        return true
      }

      customPath = false
      dPath = path
      return true
    }
  

  function isCustomPath() {
    return customPath
  }

  async function createTransport() {
    try {
      this.transport = this.LedgerTransport
        ? await this.LedgerTransport.create()
        : await TransportU2F.create()

      eth = new Eth(this.transport)

      const observer = {
        next: (event: any) => {
          if (event.type === 'remove') {
            disconnect()
          }
        },
        error: () => {},
        complete: () => {}
      }

      this.LedgerTransport
        ? this.LedgerTransport.listen(observer)
        : TransportU2F.listen(observer)
    } catch (error) {
      throw new Error('Error connecting to Ledger wallet')
    }
  }

  function enable() {
	this.start();
    enabled = true
    return getAccounts()
  }

  function addresses() {
    return Array.from(addressToPath.keys())
  }

  function setPrimaryAccount(address: string) {
    // make a copy and put in an array
    const accounts = [...addressToPath.entries()]
    const accountIndex = accounts.findIndex(
      ([accountAddress]) => accountAddress === address
    )
    // pull the item at the account index out of the array and place at the front
    accounts.unshift(accounts.splice(accountIndex, 1)[0])
    // reassign addressToPath to new ordered accounts
    addressToPath = new Map(accounts)
  }

  async function getAddress(path: string) {
    if (!eth) {
      await createTransport()
    }

    try {
      const result = await eth.getAddress(path)
      return result.address
    } catch (error) {}
  }

  async function getPublicKey() {
    if (!dPath) {
      throw new Error('a derivation path is needed to get the public key')
    }

    if (!eth) {
      await createTransport()
    }

    try {
      const result = await eth.getAddress(dPath, false, true)
      const { publicKey, chainCode } = result

      account = {
        publicKey,
        chainCode,
        path: dPath
      }

      return account
    } catch (error) {
      throw new Error('There was a problem accessing your Ledger accounts.')
    }
  }

  function getPrimaryAddress() {
    return enabled ? addresses()[0] : undefined
  }

  async function getMoreAccounts() {
    const accounts = await getAccounts(true)
    return accounts && getBalances(accounts)
  }

  async function getAccounts(getMore?: boolean) {
    if (!enabled) {
      return []
    }

    if (addressToPath.size > 0 && !getMore) {
      return addresses()
    }

    if (!eth) {
      await createTransport()
    }

    if (dPath === '') {
      dPath = LEDGER_LIVE_PATH
    }

    if (dPath === LEDGER_LIVE_PATH) {
      const currentAccounts = addressToPath.size
      const paths = []
      for (
        let i = currentAccounts;
        i < ACCOUNTS_TO_GET + currentAccounts;
        i++
      ) {
        paths.push(`${LEDGER_LIVE_PATH}/${i}'/0/0`)
      }

      for (const path of paths) {
        const res = await eth.getAddress(path)
        addressToPath.set(res.address, path)
      }
    } else {
      if (!account) {
        try {
          account = await getPublicKey()
        } catch (error) {
          throw error
        }
      }

      const addressInfo = generateAddresses(account, addressToPath.size)

      addressInfo.forEach(({ dPath, address }) => {
        addressToPath.set(address, dPath)
      })
    }

    return addresses()
  }

  function getBalances(addresses: Array<string>) {
    return Promise.all(
      addresses.map(
        address =>
          new Promise(async resolve => {
            const balance = await getBalance(address)
            resolve({ address, balance })
          })
      )
    )
  }

  function getBalance(address: string) {
    return new Promise((resolve, reject) => {
      this.provider.sendAsync(
        {
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: [address, 'latest'],
          id: 42
        },
        (e: any, res: any) => {
          e && reject(e)
          const result = res && res.result

          if (result != null) {
            resolve(new BigNumber(result).toString(10))
          } else {
            resolve(null)
          }
        }
      )
    })
  }

  async function signTransaction(transactionData: any) {
    const path = [...addressToPath.values()][0]

    try {
      const transaction = new EthereumTx.Transaction(transactionData, {
        chain: networkName(this.networkId)
      })

      transaction.raw[6] = buffer.Buffer.from([this.networkId]) // v
      transaction.raw[7] = buffer.Buffer.from([]) // r
      transaction.raw[8] = buffer.Buffer.from([]) // s

      const ledgerResult = await eth.signTransaction(
        path,
        transaction.serialize().toString('hex')
      )

      transaction.v = buffer.Buffer.from(ledgerResult.v, 'hex')
      transaction.r = buffer.Buffer.from(ledgerResult.r, 'hex')
      transaction.s = buffer.Buffer.from(ledgerResult.s, 'hex')

      return `0x${transaction.serialize().toString('hex')}`
    } catch (error) {
      throw error
    }
  }

  async function signMessage(message: { data: string }): Promise<string> {
    if (addressToPath.size === 0) {
      await enable()
    }

    const path = [...addressToPath.values()][0]

    return eth
      .signPersonalMessage(path, ethUtil.stripHexPrefix(message.data))
      .then((result: any) => {
        let v = (result['v'] - 27).toString(16)
        if (v.length < 2) {
          v = '0' + v
        }
        return `0x${result['r']}${result['s']}${v}`
      })
  }

  onConnect(callback: any) {
    this.connectCallbacks.push(callback);
  }

  triggerConnect(result: any) {
    if (this.connectCallbacks && this.connectCallbacks.length) {
      this.connectCallbacks.forEach(callback => callback(result));
    }
  }

  function disconnect() {
    this.transport && this.transport.close()
    this.close();
  }

  async close() {
	await this.onDisconnect();
  }

  async onDisconnect() {
    // tslint:disable-next-line:await-promise
    await this.stop();
    this.emit("close", 1000, "Connection closed");
    this.emit("disconnect", 1000, "Connection disconnected");
  }

  updateRpcUrl(chainId: number, rpcUrl = "") {
    const infuraNetworks = {
      1: "mainnet",
      3: "ropsten",
      4: "rinkeby",
      5: "goerli",
      42: "kovan",
    };
    const network = infuraNetworks[chainId];
    if (!rpcUrl) {
      if (this.rpc && this.rpc[chainId]) {
        rpcUrl = this.rpc[chainId];
      } else if (network) {
        rpcUrl = `https://${network}.infura.io/v3/${this.infuraId}`;
      }
    }
    if (rpcUrl) {
      // Update rpcUrl
      this.rpcUrl = rpcUrl;
      // Handle http update
    } else {
      this.emit("error", new Error(`No RPC Url available for chainId: ${chainId}`));
    }
  }
}

export default LedgerConnectProvider;