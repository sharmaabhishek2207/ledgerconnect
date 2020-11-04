export interface IRPCMap {
    [chainId: number]: string;
}

export interface IWCEthRpcConnectionOptions {
    rpc?: IRPCMap;
    infuraId?: string;
}

export interface IWalletConnectProviderOptions extends IWCEthRpcConnectionOptions {
    pollingInterval?: number;
}

export interface Subscriptions {
  address?: (address: string) => void
  network?: (networkId: number) => void
  balance?: (balance: string) => void
  wallet?: (wallet: Wallet) => void
}

export interface WalletCheckModule {
  (stateAndHelpers: StateAndHelpers):
    | WalletCheckModal
    | undefined
    | Promise<WalletCheckModal | undefined>
}

export interface WalletCheckModule {
  reset?: () => void
}

export interface Connect {
  (): Promise<{ message: string } | string[] | undefined>
}

export interface WalletCheckModal {
  heading: string
  description: string
  html?: string
  button?: {
    onclick: () => void
    text: string
  }
  eventCode: string
  action?: Connect | null
  icon?: string
}

export interface UserState {
  address: string
  network: number
  balance: string
  wallet: Wallet
  mobileDevice: boolean
  appNetworkId: number
}

export interface StateAndHelpers extends UserState {
  BigNumber: any
  walletSelect: WalletSelectFunction
  wallet: Wallet
  exit: (completed?: boolean) => void
  stateSyncStatus: {
    [key: string]:
      | null
      | CancelablePromise
      | Promise<Array<string>>
      | Promise<string>
      | Promise<void>
    balance: null | CancelablePromise
    address: null | Promise<Array<string>>
    network: null | Promise<string>
  }
  stateStore: {
    address: WalletStateSliceStore
    network: WalletStateSliceStore
    balance: BalanceStore | WalletStateSliceStore
  }
}

export interface StateSyncer {
  get?: () => Promise<string | number | null>
  onChange?: (updater: (val: number | string | undefined) => void) => void
}

export interface Wallet {
  name: string | null
  provider: any | null
  instance?: any | null
  connect?: Connect | null
  disconnect?: () => void
  address: StateSyncer
  network: StateSyncer
  balance: StateSyncer
}

export interface CommonWalletOptions {
  walletName: string
  preferred?: boolean
  label?: string
  iconSrc?: string
  svg?: string
}

export interface LedgerOptions extends CommonWalletOptions {
  rpcUrl: string
  LedgerTransport?: any
}

//#region torus

interface VerifierStatus {
  google?: boolean
  facebook?: boolean
  reddit?: boolean
  twitch?: boolean
  discord?: boolean
}

type LOGIN_TYPE =
  | 'google'
  | 'facebook'
  | 'reddit'
  | 'discord'
  | 'twitch'
  | 'apple'
  | 'github'
  | 'linkedin'
  | 'twitter'
  | 'weibo'
  | 'line'
  | 'jwt'
  | 'email-password'
  | 'passwordless'

interface BaseLoginOptions {
  display?: 'page' | 'popup' | 'touch' | 'wap'
  prompt?: 'none' | 'login' | 'consent' | 'select_account'
  max_age?: string | number
  ui_locales?: string
  id_token_hint?: string
  login_hint?: string
  acr_values?: string
  scope?: string
  audience?: string
  connection?: string
  [key: string]: unknown
}

interface JwtParameters extends BaseLoginOptions {
  domain: string
  client_id?: string
  redirect_uri?: string
  leeway?: number
  verifierIdField?: string
  isVerifierIdCaseSensitive?: boolean
}

interface IntegrityParams {
  check: boolean
  hash?: string
  version?: string
}

interface WhiteLabelParams {
  theme: ThemeParams
  defaultLanguage?: string
  logoDark: string
  logoLight: string
  topupHide?: boolean
  featuredBillboardHide?: boolean
  disclaimerHide?: boolean
  tncLink?: LocaleLinks<string>
  privacyPolicy?: LocaleLinks<string>
  contactLink?: LocaleLinks<string>
  customTranslations?: LocaleLinks<any>
}

interface LocaleLinks<T> {
  en?: T
  ja?: T
  ko?: T
  de?: T
  zh?: T
}

interface ThemeParams {
  isDark: boolean
  colors: any
}

interface LoginConfigItem {
  name?: string
  typeOfLogin: LOGIN_TYPE
  description?: string
  clientId?: string
  logoHover?: string
  logoLight?: string
  logoDark?: string
  showOnModal?: boolean
  jwtParameters?: JwtParameters
}

interface LoginConfig {
  [verifier: string]: LoginConfigItem
}

//#endregion torus

export interface WalletLinkOptions extends CommonWalletOptions {
  appName: string
  appLogoUrl?: string
  rpcUrl: string
}

export interface InjectedWithBalanceOptions extends CommonWalletOptions {
  rpcUrl?: string
}

export type WalletInitOptions =
  | CommonWalletOptions
  | LedgerOptions

export type AllWalletInitOptions = CommonWalletOptions &
 LedgerOptions & { networkId: number }

export interface WalletCheckCustomOptions {
  heading?: string
  description?: string
  minimumBalance?: string
  icon?: string
  button?: {
    text: string
    onclick: () => void
  }
  html?: string
}

export interface WalletCheckInit extends WalletCheckCustomOptions {
  checkName: string
}

export interface WalletSelectFunction {
  (autoSelectWallet?: string): Promise<boolean>
}

interface WalletCheck {
  (): Promise<boolean>
}

interface AccountSelect {
  (): Promise<boolean>
}

interface Config {
  (options: ConfigOptions): void
}

interface GetState {
  (): UserState
}

export interface ConfigOptions {
  darkMode?: boolean
  networkId?: number
}

export interface API {
  walletSelect: WalletSelectFunction
  walletCheck: WalletCheck
  walletReset: () => void
  config: Config
  getState: GetState
  accountSelect: AccountSelect
}

export interface WritableStore {
  set: (newValue: any) => void
  update: (updater: (newValue: any) => any) => void
  subscribe: (subscriber: (store: any) => any) => () => void
}

export interface ReadableStore {
  subscribe: (subscriber: (store: any) => any) => () => void
}

export interface WalletStateSliceStore {
  subscribe: (subscriber: (store: any) => void) => () => void
  reset: () => void
  setStateSyncer: (
    stateSyncer: StateSyncer
  ) => { clear: () => void } | undefined
  get: () => any
}

export interface BalanceStore {
  subscribe: (subscriber: (store: any) => void) => () => void
  setStateSyncer: (stateSyncer: StateSyncer) => undefined
  reset: () => void
  get: () => any
}

export type Browser = {
  name: string
  version: string
}

export type OS = {
  name: string
  version: string
  versionName: string
}

export interface AppState {
  dappId: string
  networkId: number
  version: string
  mobileDevice: boolean
  os: OS
  browser: Browser
  darkMode: boolean
  autoSelectWallet: string
  walletSelectInProgress: boolean
  walletSelectCompleted: boolean
  walletCheckInProgress: boolean
  walletCheckCompleted: boolean
  accountSelectInProgress: boolean
  walletSelectDisplayedUI: boolean
  walletCheckDisplayedUI: boolean
  displayBranding: boolean
}

export interface CancelablePromise extends Promise<any> {
  cancel: () => void
}
