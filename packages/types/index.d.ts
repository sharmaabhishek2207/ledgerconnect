declare module "@ledgerconnect/types" {
  export interface WalletModule {
	
	name: string
    type: 'hardware' | 'injected' | 'sdk'
    uri: string;
    chainId: number;
    networkId: number;
    accounts: string[];
    rpcUrl: string;
    readonly connected: boolean;
    readonly pending: boolean;

    on(event: string, callback: (error: Error | null, payload: any | null) => void): void;
    connect(opts?: ICreateSessionOptions): Promise<ISessionStatus>;
    createSession(opts?: ICreateSessionOptions): Promise<void>;
    approveSession(sessionStatus: ISessionStatus): void;
    rejectSession(sessionError?: ISessionError): void;
    updateSession(sessionStatus: ISessionStatus): void;
    killSession(sessionError?: ISessionError): Promise<void>;

    sendTransaction(tx: ITxData): Promise<any>;
    signTransaction(tx: ITxData): Promise<any>;
    signMessage(params: any[]): Promise<any>;
    signPersonalMessage(params: any[]): Promise<any>;
    signTypedData(params: any[]): Promise<any>;
    updateChain(chainParams: IUpdateChainParams): Promise<any>;

    sendCustomRequest(request: Partial<IJsonRpcRequest>, options?: IRequestOptions): Promise<any>;
    unsafeSend(
      request: IJsonRpcRequest,
      options?: IRequestOptions,
    ): Promise<IJsonRpcResponseSuccess | IJsonRpcResponseError>;

    approveRequest(response: Partial<IJsonRpcResponseSuccess>): void;
    rejectRequest(response: Partial<IJsonRpcResponseError>): void;
  }

  export interface ISessionStatus {
    chainId: number;
    accounts: string[];
    networkId?: number;
    rpcUrl?: string;
  }

  export interface ICreateSessionOptions {
    chainId?: number;
  }

  export interface ISessionError {
    message?: string;
  }


  export interface ICallTxData {
    to?: string;
    value?: number | string;
    gas?: number | string;
    gasLimit?: number | string;
    gasPrice?: number | string;
    nonce?: number | string;
    data?: string;
  }

  export interface ITxData extends ICallTxData {
    from: string;
  }

  export interface IJsonRpcResponseSuccess {
    id: number;
    jsonrpc: string;
    result: any;
  }

  export interface IJsonRpcErrorMessage {
    code?: number;
    message: string;
  }

  export interface IJsonRpcResponseError {
    id: number;
    jsonrpc: string;
    error: IJsonRpcErrorMessage;
  }

  export interface IJsonRpcRequest {
    id: number;
    jsonrpc: string;
    method: string;
    params: any[];
  }

  export interface IUpdateChainParams {
    chainId: number;
    networkId: number;
    rpcUrl: string;
    nativeCurrency: {
      name: string;
      symbol: string;
    };
  }

  export interface IRequestOptions {
    forcePushNotification?: boolean;
  }

  export interface IRPCMap {
    [chainId: number]: string;
  }
}