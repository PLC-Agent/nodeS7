import { EventEmitter } from 'events';

declare class NodeS7 extends EventEmitter {
  constructor(opts?: { silent?: boolean; debug?: boolean });

  /**
   * Initiate a connection to a Siemens S7 PLC.
   */
  initiateConnection(params: NodeS7.ConnectionParams, callback: (err?: Error) => void): void;

  /**
   * Drop the connection to the PLC.
   */
  dropConnection(callback: () => void): void;

  /**
   * Set a translation callback for mapping symbolic names to S7 addresses.
   */
  setTranslationCB(translator: (tag: string) => string): void;

  /**
   * Add items (S7 addresses) to the read polling list.
   */
  addItems(items: string | string[]): void;

  /**
   * Remove items from the read polling list. If no items specified, removes all.
   */
  removeItems(items?: string | string[]): void;

  /**
   * Read all items currently in the polling list.
   */
  readAllItems(callback: (err: boolean, values: Record<string, any>) => void): void;

  /**
   * Write values to specified S7 addresses.
   */
  writeItems(items: string | string[], values: any | any[], callback: (err: boolean) => void): number;

  // Promise-based API

  /**
   * Promise-based version of initiateConnection.
   */
  initiateConnectionAsync(params: NodeS7.ConnectionParams): Promise<void>;

  /**
   * Promise-based version of readAllItems.
   */
  readAllItemsAsync(): Promise<Record<string, any>>;

  /**
   * Promise-based version of writeItems.
   */
  writeItemsAsync(items: string | string[], values: any | any[]): Promise<void>;

  /**
   * Promise-based version of dropConnection.
   */
  dropConnectionAsync(): Promise<void>;

  // Events
  on(event: 'connecting', listener: () => void): this;
  on(event: 'connected', listener: () => void): this;
  on(event: 'disconnected', listener: () => void): this;
  on(event: 'reconnecting', listener: (info: { attempt: number; delay: number }) => void): this;
  on(event: 'connect-failed', listener: (info: { attempts: number }) => void): this;
  on(event: 'error', listener: (err: Error) => void): this;

  // Static properties
  static errors: NodeS7.S7ErrorCodes;
}

declare namespace NodeS7 {
  interface ConnectionParams {
    host?: string;
    port?: number;
    rack?: number;
    slot?: number;
    timeout?: number;
    localTSAP?: number;
    remoteTSAP?: number;
    connection_name?: string;
    doNotOptimize?: boolean;
    wdtAsUTC?: boolean;
    /** Enable TLS encryption (requires S7-1500 FW 2.0+ or S7-1200 FW 4.3+) */
    tls?: boolean;
    /** TLS options passed to tls.connect() */
    tlsOptions?: {
      ca?: Buffer | string;
      cert?: Buffer | string;
      key?: Buffer | string;
      rejectUnauthorized?: boolean;
      minVersion?: string;
    };
    /** Maximum number of reconnection attempts (default: Infinity) */
    maxReconnectAttempts?: number;
    /** Base reconnection delay in ms (default: 2000) */
    reconnectDelay?: number;
    /** Maximum reconnection delay in ms for exponential backoff (default: 30000) */
    maxReconnectDelay?: number;
  }

  interface S7ErrorCodes {
    TIMEOUT: string;
    INVALID_ADDRESS: string;
    BUFFER_OVERFLOW: string;
    PACKET_MALFORMED: string;
    CONNECTION_REFUSED: string;
    NOT_CONNECTED: string;
    WRITE_IN_PROGRESS: string;
    PLC_ERROR: string;
    INVALID_ARGUMENT: string;
  }
}

export = NodeS7;
